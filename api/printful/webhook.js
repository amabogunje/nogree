import crypto from 'node:crypto';
import { sql } from '../lib/db.js';
import { syncPrintfulCatalog } from '../lib/catalog-sync.js';
import { configureCatalogWebhooks } from '../lib/printful-webhooks.js';
import { sendShipmentNotification } from '../lib/email.js';

const catalogEvents = new Set(['product_synced', 'product_updated', 'product_deleted', 'stock_updated']);

function hasValidSecret(request) {
  const expected = process.env.PRINTFUL_WEBHOOK_SECRET;
  const supplied = request.query?.secret;

  if (!expected || typeof supplied !== 'string') {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  return expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function eventId(event) {
  return crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex');
}

function orderIdFromExternalId(externalId) {
  const match = /^ng-(\d+)$/.exec(String(externalId || ''));
  return match ? Number(match[1]) : null;
}

async function recordShipment(event) {
  const shipment = event.data?.shipment;
  const orderId = orderIdFromExternalId(event.data?.order?.external_id);

  if (!shipment || !orderId) return;

  const shipmentRows = await sql`
    insert into order_shipments (
      order_id,
      printful_shipment_id,
      carrier,
      service,
      tracking_number,
      tracking_url,
      shipment_status,
      shipped_at,
      delivered_at,
      printful_payload
    )
    values (
      ${orderId},
      ${shipment.id || null},
      ${shipment.carrier || null},
      ${shipment.service || null},
      ${shipment.tracking_number || null},
      ${shipment.tracking_url || null},
      ${shipment.status || 'shipped'},
      ${shipment.shipped_at || null},
      ${shipment.delivered_at || null},
      ${JSON.stringify(event)}::jsonb
    )
    on conflict (order_id, printful_shipment_id) do update
    set
      carrier = excluded.carrier,
      service = excluded.service,
      tracking_number = excluded.tracking_number,
      tracking_url = excluded.tracking_url,
      shipment_status = excluded.shipment_status,
      shipped_at = excluded.shipped_at,
      delivered_at = excluded.delivered_at,
      printful_payload = excluded.printful_payload,
      updated_at = now()
    returning id
  `;

  await sql`
    update orders
    set fulfillment_status = 'fulfilled', updated_at = now()
    where id = ${orderId}
  `;

  await sendShipmentNotification({
    orderId,
    shipmentId: shipmentRows[0].id,
    carrier: shipment.carrier,
    trackingNumber: shipment.tracking_number,
    trackingUrl: shipment.tracking_url,
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!hasValidSecret(request)) {
    response.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const event = request.body;

  if (!event || typeof event !== 'object' || (!catalogEvents.has(event.type) && event.type !== 'package_shipped')) {
    response.status(200).json({ received: true, ignored: true });
    return;
  }

  try {
    const id = eventId(event);
    const recordedEvents = await sql`
      insert into webhook_events (provider, provider_event_id, payload, processed_at)
      values ('printful', ${id}, ${JSON.stringify(event)}::jsonb, null)
      on conflict (provider, provider_event_id) do update
      set payload = excluded.payload
      where webhook_events.processed_at is null
      returning id
    `;

    if (recordedEvents.length === 0) {
      response.status(200).json({ received: true, duplicate: true });
      return;
    }

    if (catalogEvents.has(event.type)) {
      const result = await syncPrintfulCatalog();
      await configureCatalogWebhooks(result);
    } else {
      await recordShipment(event);
    }

    await sql`
      update webhook_events
      set processed_at = now()
      where provider = 'printful' and provider_event_id = ${id}
    `;

    response.status(200).json({ received: true });
  } catch {
    response.status(500).json({ error: 'Could not synchronize the Printful catalog.' });
  }
}
