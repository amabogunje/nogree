alter table order_notifications drop constraint if exists order_notifications_notification_type_check;

alter table order_notifications
  add constraint order_notifications_notification_type_check
  check (notification_type in ('order_confirmed', 'shipment_sent', 'fulfillment_alert', 'refund_sent'));
