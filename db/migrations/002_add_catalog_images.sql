alter table products add column if not exists image_url text;
alter table products add column if not exists printful_store_id bigint;
alter table product_variants add column if not exists image_url text;
