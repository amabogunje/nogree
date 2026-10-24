import Stripe from 'stripe';
import { sql } from '../lib/db.js';

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
      values ('stripe', ${event.id}, ${JSON.stringify(event)}::jsonb, now())
      on conflict (provider, provider_event_id) do nothing
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
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      await sql`
        update orders
        set payment_status = 'failed', updated_at = now()
        where stripe_checkout_session_id = ${session.id}
      `;
    }

    response.status(200).json({ received: true });
  } catch {
    response.status(500).json({ error: 'Could not process Stripe webhook.' });
  }
}
