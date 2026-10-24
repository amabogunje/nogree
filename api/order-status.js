import { sql } from './lib/db.js';

function normalizeReference(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function customerStatus(order, shipments) {
  if (order.payment_status === 'failed') return 'Payment processing';
  if (order.fulfillment_status === 'failed' || order.fulfillment_status === 'cancelled') return 'Order received';
  if (shipments.length > 0) return 'Shipped';
  if (order.payment_status !== 'paid') return 'Payment processing';
  if (order.fulfillment_status === 'in_progress') return 'In production';
  return 'Order received';
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const reference = normalizeReference(request.body?.reference);
  const email = normalizeEmail(request.body?.email);

  if (!/^NG-[A-Z0-9-]{3,32}$/.test(reference) || !/^\S+@\S+\.\S+$/.test(email)) {
    response.status(400).json({ error: 'Enter the order number and email used at checkout.' });
    return;
  }

  try {
    const orderRows = await sql`
      select id, public_reference, created_at, payment_status, fulfillment_status
      from orders
      where (public_reference = ${reference} or ('NG-' || id::text) = ${reference})
        and lower(customer_email) = ${email}
      limit 1
    `;

    const order = orderRows[0];
    if (!order) {
      response.status(404).json({ error: 'We could not find an order with those details.' });
      return;
    }

    const [items, shipments] = await Promise.all([
      sql`
        select product_name, variant_label, quantity
        from order_items
        where order_id = ${order.id}
        order by id asc
      `,
      sql`
        select carrier, service, tracking_number, tracking_url, shipment_status, shipped_at, delivered_at
        from order_shipments
        where order_id = ${order.id}
        order by shipped_at desc nulls last, id desc
      `,
    ]);

    response.status(200).json({
      order: {
        reference: order.public_reference,
        placedAt: order.created_at,
        status: customerStatus(order, shipments),
        items,
        shipments,
      },
    });
  } catch {
    response.status(500).json({ error: 'Could not retrieve that order right now.' });
  }
}
