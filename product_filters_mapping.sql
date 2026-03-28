create table if not exists product_concerns (
  product_id uuid not null references products(id) on delete cascade,
  concern_id uuid not null references concerns(id) on delete cascade,
  primary key (product_id, concern_id)
);

create table if not exists product_personas (
  product_id uuid not null references products(id) on delete cascade,
  persona_id uuid not null references personas(id) on delete cascade,
  primary key (product_id, persona_id)
);

create index if not exists idx_product_concerns_product on product_concerns(product_id);
create index if not exists idx_product_concerns_concern on product_concerns(concern_id);

create index if not exists idx_product_personas_product on product_personas(product_id);
create index if not exists idx_product_personas_persona on product_personas(persona_id);