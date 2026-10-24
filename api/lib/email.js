import { Resend } from 'resend';
import { sql } from './db.js';

const emailFrom = process.env.EMAIL_FROM || 'NO GREE <orders@wearnogree.com>';
const emailReplyTo = process.env.EMAIL_REPLY_TO;
const orderAlertEmail = process.env.ORDER_ALERT_EMAIL || emailReplyTo;
const storefrontUrl = process.env.STOREFRONT_URL || 'https://wearnogree.com';

function orderStatusUrl(reference) {
  return `${storefrontUrl}/#order-status?order=${encodeURIComponent(reference)}`;
}

function money(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function emailShell({ eyebrow, title, body, detail, actionLabel, actionUrl }) {
  return `
    <main style="background:#e9dfce;color:#0d0c0b;font-family:Arial,sans-serif;padding:40px 24px;">
      <section style="max-width:560px;margin:0 auto;border-top:1px solid #0d0c0b;border-bottom:1px solid #0d0c0b;padding:32px 0;">
        <p style="font-family:Georgia,serif;font-size:28px;letter-spacing:-1px;margin:0 0 36px;">no·gree</p>
        <p style="font-size:11px;font-weight:700;letter-spacing:3px;margin:0 0 16px;text-transform:uppercase;">${eyebrow}</p>
        <h1 style="font-family:Georgia,serif;font-size:42px;font-weight:400;letter-spacing:-1.5px;line-height:1;margin:0 0 22px;">${title}</h1>
        <div style="font-size:15px;line-height:1.7;color:#302d29;">${body}</div>
        ${detail ? `<div style="border-top:1px solid rgba(13,12,11,.25);margin-top:28px;padding-top:22px;font-size:13px;line-height:1.7;">${detail}</div>` : ''}
        ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;background:#0d0c0b;color:#e9dfce;font-size:11px;font-weight:700;letter-spacing:2px;margin-top:30px;padding:16px 22px;text-decoration:none;text-transform:uppercase;">${actionLabel}</a>` : ''}
        <p style="font-size:11px;letter-spacing:2px;margin:38px 0 0;text-transform:uppercase;">No gree for anybody.</p>
      </section>
    </main>
  `;
}

async function reserveNotification({ orderId, shipmentId = null, notificationKey, notificationType, recipientEmail }) {
  const rows = await sql`
    insert into order_notifications (
      order_id, shipment_id, notification_key, notification_type, recipient_email, status
    )
    values (${orderId}, ${shipmentId}, ${notificationKey}, ${notificationType}, ${recipientEmail}, 'pending')
    on conflict (notification_key) do update
    set status = 'pending', error_message = null, updated_at = now()
    where order_notifications.status = 'failed'
    returning id
  `;

  return rows[0]?.id || null;
}

async function sendNotification({ orderId, shipmentId, notificationKey, notificationType, recipientEmail, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  const notificationId = await reserveNotification({ orderId, shipmentId, notificationKey, notificationType, recipientEmail });
  if (!notificationId) return { duplicate: true };

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: emailFrom,
      to: recipientEmail,
      ...(emailReplyTo ? { replyTo: emailReplyTo } : {}),
      subject,
      html,
    });

    await sql`
      update order_notifications
      set provider_message_id = ${result.data?.id || null}, status = 'sent', sent_at = now(), updated_at = now()
      where id = ${notificationId}
    `;
  } catch (error) {
    await sql`
      update order_notifications
      set status = 'failed', error_message = ${error.message || 'Email delivery failed.'}, updated_at = now()
      where id = ${notificationId}
    `;
    throw error;
  }
}

export async function sendOrderConfirmation(orderId) {
  const rows = await sql`
    select
      orders.id,
      orders.public_reference,
      orders.customer_email,
      orders.total_cents,
      orders.fulfillment_status,
      order_items.product_name,
      order_items.variant_label,
      order_items.quantity,
      order_items.unit_price_cents
    from orders
    join order_items on order_items.order_id = orders.id
    where orders.id = ${orderId}
    order by order_items.id asc
  `;

  const order = rows[0];
  if (!order?.customer_email) return { skipped: true };

  const items = rows.map((item) => `${item.quantity} × ${item.product_name} / ${item.variant_label} — ${money(item.unit_price_cents * item.quantity)}`).join('<br />');

  return sendNotification({
    orderId,
    notificationKey: `order-confirmed-${orderId}`,
    notificationType: 'order_confirmed',
    recipientEmail: order.customer_email,
    subject: `NO GREE / Order ${order.public_reference} received`,
    html: emailShell({
      eyebrow: `Order ${order.public_reference}`,
      title: 'Your order is received.',
      body: '<p>Payment received. We are preparing your pieces for fulfillment.</p><p>Your order number is below. You can check its status at any time, even before it ships.</p>',
      detail: `<strong>Selection</strong><br />${items}<br /><br /><strong>Total</strong> — ${money(order.total_cents)}`,
      actionLabel: 'Check order status',
      actionUrl: orderStatusUrl(order.public_reference),
    }),
  });
}

export async function sendFulfillmentAlert({ orderId, reason, printfulOrderUrl }) {
  if (!orderAlertEmail) return { skipped: true };

  const rows = await sql`
    select public_reference, customer_email
    from orders
    where id = ${orderId}
  `;
  const order = rows[0];
  if (!order) return { skipped: true };

  return sendNotification({
    orderId,
    notificationKey: `fulfillment-alert-${orderId}`,
    notificationType: 'fulfillment_alert',
    recipientEmail: orderAlertEmail,
    subject: `NO GREE / Fulfillment needs attention for ${order.public_reference}`,
    html: emailShell({
      eyebrow: 'Fulfillment alert',
      title: 'Order needs review.',
      body: `<p>${order.public_reference} has been paid by the customer, but Printful needs an action before fulfillment can continue.</p>`,
      detail: `<strong>Customer</strong><br />${order.customer_email || 'Email unavailable'}<br /><br /><strong>Printful reason</strong><br />${reason || 'Printful returned the order for review.'}`,
      actionLabel: printfulOrderUrl ? 'Open Printful order' : 'Open NO GREE status',
      actionUrl: printfulOrderUrl || orderStatusUrl(order.public_reference),
    }),
  });
}

export async function sendShipmentNotification({ orderId, shipmentId, carrier, trackingNumber, trackingUrl }) {
  const rows = await sql`
    select customer_email, public_reference
    from orders
    where id = ${orderId}
  `;
  const recipientEmail = rows[0]?.customer_email;
  if (!recipientEmail) return { skipped: true };

  return sendNotification({
    orderId,
    shipmentId,
    notificationKey: `shipment-sent-${shipmentId}`,
    notificationType: 'shipment_sent',
    recipientEmail,
    subject: `NO GREE / Order ${order.public_reference} is on the way`,
    html: emailShell({
      eyebrow: `Order ${order.public_reference}`,
      title: 'Your pieces are on the way.',
      body: '<p>Your order has left the facility. Tracking can take up to a day to show movement after the carrier receives the package.</p>',
      detail: `<strong>${carrier || 'Shipment'} tracking</strong><br />${trackingNumber || 'Tracking information is updating.'}`,
      actionLabel: 'Track order',
      actionUrl: trackingUrl || undefined,
    }),
  });
}
