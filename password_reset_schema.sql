create extension if not exists pgcrypto;

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_user
  on password_reset_tokens(user_id);

create index if not exists idx_password_reset_tokens_token
  on password_reset_tokens(token);