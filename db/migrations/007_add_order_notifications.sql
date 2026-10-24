create table if not exists order_shipments (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  printful_shipment_id bigint,
  carrier text,
  service text,
  tracking_number text,
  tracking_url text,
  shipment_status text not null default 'shipped',
  shipped_at timestamptz,
  delivered_at timestamptz,
  printful_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, printful_shipment_id)
);

create table if not exists order_notifications (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  shipment_id bigint references order_shipments(id) on delete cascade,
  notification_key text not null unique,
  notification_type text not null check (notification_type in ('order_confirmed', 'shipment_sent')),
  recipient_email text not null,
  provider_message_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_shipments_order_id_idx on order_shipments(order_id);
create index if not exists order_notifications_order_id_idx on order_notifications(order_id);
