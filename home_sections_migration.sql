-- home_sections_migration.sql
-- Adds home display controls to existing tables (safe migration)

-- PERSONAS
alter table personas
  add column if not exists show_on_home boolean not null default false,
  add column if not exists home_order int not null default 0;

-- CONCERNS
alter table concerns
  add column if not exists show_on_home boolean not null default false,
  add column if not exists home_order int not null default 0;

-- VIDEOS
alter table videos
  add column if not exists show_on_home boolean not null default false,
  add column if not exists home_order int not null default 0;

-- TESTIMONIALS
alter table testimonials
  add column if not exists show_on_home boolean not null default false,
  add column if not exists home_order int not null default 0;

-- HERO SLIDES (new table if not exists)
create table if not exists hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  heading text,
  subheading text,
  cta_primary_text text,
  cta_primary_url text,
  cta_secondary_text text,
  cta_secondary_url text,
  show_on_home boolean not null default true,
  home_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_hero_slides_home on hero_slides(show_on_home, home_order);