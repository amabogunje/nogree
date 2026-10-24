alter table product_variants add column if not exists printful_catalog_variant_id bigint;
alter table orders add column if not exists printful_shipping_method text;
