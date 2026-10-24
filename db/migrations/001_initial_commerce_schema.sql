create table if not exists email_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  collection text not null default 'DROP 01',
  description text,
  printful_sync_product_id bigint unique,
  active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  printful_sync_variant_id bigint unique,
  sku text unique,
  color text not null,
  size text not null,
  retail_price_cents integer not null check (retail_price_cents >= 0),
  currency char(3) not null default 'USD' check (currency = 'USD'),
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color, size)
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  printful_order_id bigint unique,
  customer_email text,
  currency char(3) not null default 'USD' check (currency = 'USD'),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status text not null default 'unsubmitted' check (fulfillment_status in ('unsubmitted', 'submitted', 'in_progress', 'fulfilled', 'cancelled', 'failed')),
  shipping_address jsonb,
  printful_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_variant_id bigint references product_variants(id) on delete set null,
  product_name text not null,
  variant_label text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  printful_sync_variant_id bigint,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('stripe', 'printful')),
  provider_event_id text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists product_variants_product_id_idx on product_variants(product_id);
create index if not exists orders_customer_email_idx on orders(customer_email);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists order_items_order_id_idx on order_items(order_id);
