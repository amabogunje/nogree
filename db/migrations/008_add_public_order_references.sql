alter table orders add column if not exists public_reference text;

update orders
set public_reference = 'NG-' || upper(substr(md5(id::text || coalesce(stripe_checkout_session_id, '') || created_at::text), 1, 10))
where public_reference is null;

alter table orders alter column public_reference set not null;
create unique index if not exists orders_public_reference_idx on orders(public_reference);
