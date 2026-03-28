create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  email text not null unique,
  password_hash text not null,

  is_verified boolean not null default false,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,

  full_name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',

  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function set_users_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_users_updated_at();

create index if not exists idx_user_addresses_user on user_addresses(user_id);