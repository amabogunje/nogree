import Stripe from 'stripe';
import { sql } from '../lib/db.js';
import { printfulRequest } from '../lib/printful.js';
import { sendFulfillmentAlert, sendOrderConfirmation, sendRefundNotification } from '../lib/email.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function fulfillOrder(session) {
  const orderId = Number(session.metadata?.nogree_order_id);

  if (!Number.isInteger(orderId)) {
    return;
  }

  const rows = await sql`
    select
      orders.id,
      orders.fulfillment_status,
      orders.printful_shipping_method,
      order_items.product_name,
      order_items.quantity,
      order_items.printful_sync_variant_id,
      products.printful_store_id
    from orders
    join order_items on order_items.order_id = orders.id
    join product_variants on product_variants.id = order_items.product_variant_id
    join products on products.id = product_variants.product_id
    where orders.id = ${orderId}
  `;

  if (rows.length === 0 || rows[0].fulfillment_status !== 'unsubmitted') {
    return;
  }

  const shippingDetails = session.shipping_details;
  const address = shippingDetails?.address;
  const storeId = rows[0].printful_store_id;

  if (!address?.line1 || !address?.city || !address?.state || !address?.postal_code || address.country !== 'US' || !storeId) {
    throw new Error('Paid order is missing a valid U.S. shipping address.');
  }

  const printfulOrder = await printfulRequest('/orders?confirm=1&update_existing=1', {
    method: 'POST',
    storeId,
    body: {
      external_id: `ng-${orderId}`,
      shipping: rows[0].printful_shipping_method || 'STANDARD',
      recipient: {
        name: shippingDetails.name,
        address1: address.line1,
        address2: address.line2 || undefined,
        city: address.city,
        state_code: address.state,
        country_code: address.country,
        zip: address.postal_code,
        email: session.customer_details?.email || undefined,
      },
      items: rows.map((item) => ({
        sync_variant_id: item.printful_sync_variant_id,
        quantity: item.quantity,
      })),
    },
  });

  await sql`
    update orders
    set
      printful_order_id = ${printfulOrder.id},
      fulfillment_status = ${printfulOrder.status === 'failed' ? 'failed' : 'submitted'},
      customer_email = coalesce(${session.customer_details?.email || null}, customer_email),
      shipping_address = ${JSON.stringify(shippingDetails)}::jsonb,
      printful_payload = ${JSON.stringify(printfulOrder)}::jsonb,
      updated_at = now()
    where id = ${orderId}
  `;

  if (printfulOrder.status === 'failed') {
    await sendFulfillmentAlert({
      orderId,
      reason: printfulOrder.error || 'Printful could not accept the order for fulfillment.',
      printfulOrderUrl: printfulOrder.dashboard_url,
    });
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers['stripe-signature'];

  if (!secretKey || !webhookSecret || !signature) {
    response.status(400).json({ error: 'Webhook is not configured.' });
    return;
  }

  let event;

  try {
    const stripe = new Stripe(secretKey);
    event = stripe.webhooks.constructEvent(await readRawBody(request), signature, webhookSecret);
  } catch {
    response.status(400).json({ error: 'Invalid Stripe signature.' });
    return;
  }

  try {
    const recordedEvents = await sql`
      insert into webhook_events (provider, provider_event_id, payload, processed_at)
      values ('stripe', ${event.id}, ${JSON.stringify(event)}::jsonb, null)
      on conflict (provider, provider_event_id) do update
      set payload = excluded.payload
      where webhook_events.processed_at is null
      returning id
    `;

    if (recordedEvents.length === 0) {
      response.status(200).json({ received: true });
      return;
    }

    const session = event.data.object;

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await sql`
        update orders
        set
          customer_email = coalesce(${session.customer_details?.email ?? null}, customer_email),
          stripe_payment_intent_id = coalesce(${typeof session.payment_intent === 'string' ? session.payment_intent : null}, stripe_payment_intent_id),
          payment_status = 'paid',
          updated_at = now()
        where stripe_checkout_session_id = ${session.id}
      `;

      if (session.payment_status === 'paid' || event.type === 'checkout.session.async_payment_succeeded') {
        await fulfillOrder(session);
        const orderId = Number(session.metadata?.nogree_order_id);
        if (Number.isInteger(orderId)) {
          await sendOrderConfirmation(orderId);
        }
      }
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      await sql`
        update orders
        set payment_status = 'failed', updated_at = now()
        where stripe_checkout_session_id = ${session.id}
      `;
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
      const isFullyRefunded = charge.refunded === true || charge.amount_refunded >= charge.amount;

      if (paymentIntentId && isFullyRefunded) {
        const refundedAt = new Date(event.created * 1000).toISOString();
        const refundedOrders = await sql`
          update orders
          set payment_status = 'refunded', refunded_at = coalesce(refunded_at, ${refundedAt}), updated_at = now()
          where stripe_payment_intent_id = ${paymentIntentId}
            and payment_status <> 'refunded'
          returning id
        `;

        for (const order of refundedOrders) {
          await sendRefundNotification(order.id);
        }
      }
    }

    await sql`
      update webhook_events
      set processed_at = now()
      where provider = 'stripe' and provider_event_id = ${event.id}
    `;

    response.status(200).json({ received: true });
  } catch {
    response.status(500).json({ error: 'Could not process Stripe webhook.' });
  }
}
