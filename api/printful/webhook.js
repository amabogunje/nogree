import crypto from 'node:crypto';
import { sql } from '../lib/db.js';
import { syncPrintfulCatalog } from '../lib/catalog-sync.js';

const catalogEvents = new Set(['product_synced', 'product_updated', 'product_deleted']);

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

  if (!event || typeof event !== 'object' || !catalogEvents.has(event.type)) {
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

    const result = await syncPrintfulCatalog();

    await sql`
      update webhook_events
      set processed_at = now()
      where provider = 'printful' and provider_event_id = ${id}
    `;

    response.status(200).json({ received: true, products: result.products.length });
  } catch {
    response.status(500).json({ error: 'Could not synchronize the Printful catalog.' });
  }
}
