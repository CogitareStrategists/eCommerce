-- product_migration.sql
-- Adds missing columns to existing products table (safe migration)

create extension if not exists pgcrypto;

-- Add new columns only if missing
alter table products
  add column if not exists category_id uuid null;

alter table products
  add column if not exists description text null,
  add column if not exists ingredients text null,
  add column if not exists benefits text null,
  add column if not exists how_to_use text null;

alter table products
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Add FK to categories (only if not already present)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_category_id_fkey'
  ) then
    alter table products
      add constraint products_category_id_fkey
      foreign key (category_id) references categories(id)
      on delete set null;
  end if;
end $$;

-- Ensure updated_at trigger exists
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