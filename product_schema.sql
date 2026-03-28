-- product_schema.sql
-- Run inside your postgres "ecommerce" database

create extension if not exists pgcrypto;

-- 1) Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Products (base info, not per-variant pricing/stock)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,

  name text not null,
  slug text not null unique,

  description text,        -- short description
  ingredients text,        -- can be plain text for now
  benefits text,           -- plain text for now
  how_to_use text,         -- plain text for now

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

-- 3) Product images
-- One product can have many images. We'll keep a "sort_order" and mark primary.
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false
);

-- 4) Product variants (THIS is where price/stock/discount live)
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,

  -- "Size/Quantity" as label. Examples: "100g", "250ml", "Pack of 3"
  label text not null,

  price numeric(12,2) not null,
  discount_percent numeric(5,2) not null default 0,  -- 0 to 100
  stock_qty int not null default 0,

  sku text unique, -- optional but useful
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint discount_range check (discount_percent >= 0 and discount_percent <= 100),
  constraint stock_non_negative check (stock_qty >= 0)
);

drop trigger if exists trg_variants_updated_at on product_variants;
create trigger trg_variants_updated_at
before update on product_variants
for each row execute function set_updated_at();

-- 5) Reviews (basic; later we can link to real customers/orders)
create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,

  reviewer_name text not null,
  rating int not null,
  title text,
  body text,

  is_approved boolean not null default false,
  created_at timestamptz not null default now(),

  constraint rating_range check (rating >= 1 and rating <= 5)
);

-- Helpful indexes
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_variants_product on product_variants(product_id);
create index if not exists idx_images_product on product_images(product_id);
create index if not exists idx_reviews_product on product_reviews(product_id);