alter table products
add column if not exists collection_id uuid references collections(id) on delete set null;

create index if not exists idx_products_collection on products(collection_id);