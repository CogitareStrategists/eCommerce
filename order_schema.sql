create extension if not exists pgcrypto;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  customer_name text not null,
  customer_email text not null,
  customer_phone text,

  shipping_address_line1 text not null,
  shipping_address_line2 text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_postal_code text not null,
  shipping_country text not null default 'India',

  subtotal numeric(12,2) not null default 0,
  shipping_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,

  payment_status text not null default 'pending',
  order_status text not null default 'placed',

  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,

  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,

  product_name text not null,
  variant_label text not null,

  unit_price numeric(12,2) not null,
  quantity int not null,
  line_total numeric(12,2) not null,

  created_at timestamptz not null default now(),

  constraint order_item_qty_positive check (quantity > 0)
);

create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_order_items_order on order_items(order_id);