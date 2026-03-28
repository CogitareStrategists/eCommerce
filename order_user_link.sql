alter table orders
add column if not exists user_id uuid references users(id) on delete set null;

create index if not exists idx_orders_user on orders(user_id);