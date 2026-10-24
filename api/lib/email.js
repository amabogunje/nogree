import { Resend } from 'resend';
import { sql } from './db.js';

const emailFrom = process.env.EMAIL_FROM || 'NO GREE <orders@wearnogree.com>';
const emailReplyTo = process.env.EMAIL_REPLY_TO;

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
  if (!order?.customer_email || order.fulfillment_status === 'failed') return { skipped: true };

  const items = rows.map((item) => `${item.quantity} × ${item.product_name} / ${item.variant_label} — ${money(item.unit_price_cents * item.quantity)}`).join('<br />');

  return sendNotification({
    orderId,
    notificationKey: `order-confirmed-${orderId}`,
    notificationType: 'order_confirmed',
    recipientEmail: order.customer_email,
    subject: `NO GREE / Order NG-${orderId} received`,
    html: emailShell({
      eyebrow: `Order NG-${orderId}`,
      title: 'Your selection is confirmed.',
      body: '<p>Payment received. Your pieces are now moving into production.</p><p>We will send tracking as soon as your order leaves the facility.</p>',
      detail: `<strong>Selection</strong><br />${items}<br /><br /><strong>Total</strong> — ${money(order.total_cents)}`,
    }),
  });
}

export async function sendShipmentNotification({ orderId, shipmentId, carrier, trackingNumber, trackingUrl }) {
  const rows = await sql`
    select customer_email
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
    subject: `NO GREE / Order NG-${orderId} is on the way`,
    html: emailShell({
      eyebrow: `Order NG-${orderId}`,
      title: 'Your pieces are on the way.',
      body: '<p>Your order has left the facility. Tracking can take up to a day to show movement after the carrier receives the package.</p>',
      detail: `<strong>${carrier || 'Shipment'} tracking</strong><br />${trackingNumber || 'Tracking information is updating.'}`,
      actionLabel: 'Track order',
      actionUrl: trackingUrl || undefined,
    }),
  });
}
