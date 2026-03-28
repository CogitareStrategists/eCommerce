-- home_schema_seed.sql
-- Run inside your postgres "ecommerce" database

-- Enable uuid generation (for gen_random_uuid)
create extension if not exists pgcrypto;

-- Drop (only for dev)
drop table if exists home_section_items cascade;
drop table if exists home_sections cascade;
drop table if exists collections cascade;
drop table if exists products cascade;
drop table if exists personas cascade;
drop table if exists concerns cascade;
drop table if exists videos cascade;
drop table if exists testimonials cascade;

-- HOME SECTIONS
create table home_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  is_enabled boolean not null default true,
  display_order int not null default 0
);

create table home_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references home_sections(id) on delete cascade,
  item_type text not null,
  ref_id uuid not null,
  display_order int not null default 0,
  is_active boolean not null default true
);

-- CORE (minimal for home)
create table collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text not null,
  is_active boolean not null default true
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price numeric(12,2) not null,
  is_active boolean not null default true
);

-- HOME CONTENT
create table personas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  filter_key text not null,
  is_active boolean not null default true
);

create table concerns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  filter_key text not null,
  is_active boolean not null default true
);

create table videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text not null,
  video_url text not null,
  thumbnail_url text not null,
  is_active boolean not null default true
);

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating int not null,
  content text not null,
  is_active boolean not null default true,
  constraint rating_range check (rating >= 1 and rating <= 5)
);

-- Seed sections (8)
insert into home_sections (key, title, display_order) values
('hero', 'Hero', 1),
('collections', 'Collections', 2),
('popular_products', 'Most Popular Products', 3),
('for_who_you_are', 'For Who You Are', 4),
('all_products', 'All Products', 5),
('cure_your_concerns', 'Cure Your Concerns', 6),
('videos', 'Videos', 7),
('testimonials', 'Testimonials', 8);

-- Seed collections
insert into collections (name, slug, image_url) values
('Wellness', 'wellness', 'https://placehold.co/600x400'),
('Fitness', 'fitness', 'https://placehold.co/600x400'),
('Skin Care', 'skin-care', 'https://placehold.co/600x400'),
('Daily Needs', 'daily-needs', 'https://placehold.co/600x400');

-- Seed products
insert into products (name, slug, price) values
('Product A', 'product-a', 199.00),
('Product B', 'product-b', 299.00),
('Product C', 'product-c', 149.00),
('Product D', 'product-d', 399.00),
('Product E', 'product-e', 249.00);

-- Seed personas
insert into personas (title, image_url, filter_key) values
('For Busy Professionals', 'https://placehold.co/600x400', 'who=busy_professionals'),
('For Fitness Lovers', 'https://placehold.co/600x400', 'who=fitness_lovers'),
('For Students', 'https://placehold.co/600x400', 'who=students');

-- Seed concerns
insert into concerns (title, image_url, filter_key) values
('Digestion', 'https://placehold.co/600x400', 'concern=digestion'),
('Sleep', 'https://placehold.co/600x400', 'concern=sleep'),
('Immunity', 'https://placehold.co/600x400', 'concern=immunity');

-- Seed videos
insert into videos (title, platform, video_url, thumbnail_url) values
('How it works (YouTube)', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://placehold.co/600x400'),
('Instagram Reel', 'instagram', 'https://www.instagram.com/reel/EXAMPLE', 'https://placehold.co/600x400');

-- Seed testimonials
insert into testimonials (customer_name, rating, content) values
('Asha', 5, 'Amazing experience and quick delivery!'),
('Rahul', 4, 'Good quality. Will buy again.');

-- Link items to sections (admin-controlled picks)
-- Collections section
insert into home_section_items (section_id, item_type, ref_id, display_order)
select s.id, 'collection', c.id, row_number() over (order by c.name)
from home_sections s, collections c
where s.key = 'collections';

-- Popular products section (pick 3)
insert into home_section_items (section_id, item_type, ref_id, display_order)
select s.id, 'product', p.id, row_number() over (order by p.price desc)
from home_sections s
join products p on p.slug in ('product-d','product-b','product-e')
where s.key = 'popular_products';

-- All products section (show all)
insert into home_section_items (section_id, item_type, ref_id, display_order)
select s.id, 'product', p.id, row_number() over (order by p.name)
from home_sections s, products p
where s.key = 'all_products';

-- Personas
insert into home_section_items (section_id, item_type, ref_id, display_order)
select s.id, 'persona', p.id, row_number() over (order by p.title)
from home_sections s, personas p
where s.key = 'for_who_you_are';

-- Concerns
insert into home_section_items (section_id, item_type, ref_id, display_order)
select s.id, 'concern', c.id, row_number() over (order by c.title)
from home_sections s, concerns c
where s.key = 'cure_your_concerns';

-- Videos
insert into home_section_items (section_id, item_type, ref_id, display_order)
select s.id, 'video', v.id, row_number() over (order by v.title)
from home_sections s, videos v
where s.key = 'videos';

-- Testimonials
insert into home_section_items (section_id, item_type, ref_id, display_order)
select s.id, 'testimonial', t.id, row_number() over (order by t.customer_name)
from home_sections s, testimonials t
where s.key = 'testimonials';