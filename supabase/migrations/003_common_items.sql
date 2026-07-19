-- ============================================================
-- MIGRATION 003: common_items — seed de partidas por sector
-- ============================================================

create table if not exists public.common_items (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  description text not null,
  unit text not null default 'uds',
  unit_price numeric(12,2) not null default 0,
  tax_pct numeric(5,2) not null default 21,
  frequency integer not null default 1,
  created_at timestamptz default now()
);

create index if not exists common_items_sector_idx on public.common_items(sector);

-- Seed para construcción
insert into public.common_items (sector, description, unit, unit_price, tax_pct) values
  ('construccion', 'Demolición de tabiquería', 'm²', 12.50, 21),
  ('construccion', 'Retirada de escombros', 'm³', 8.00, 21),
  ('construccion', 'Instalación de cableado eléctrico', 'ml', 30.00, 21),
  ('construccion', 'Punto de luz', 'uds', 25.00, 21),
  ('construccion', 'Mecanismo eléctrico', 'uds', 15.00, 21),
  ('construccion', 'Tubería de cobre', 'ml', 18.00, 21),
  ('construccion', 'Desagüe PVC', 'ml', 12.00, 21),
  ('construccion', 'Grifo monomando baño', 'uds', 45.00, 21),
  ('construccion', 'Mano de obra', 'h', 35.00, 21),
  ('construccion', 'Enfoscado de paredes', 'm²', 14.00, 21),
  ('construccion', 'Alicatado baño', 'm²', 25.00, 21),
  ('construccion', 'Pintura blanca', 'm²', 8.00, 21),
  ('construccion', 'Falso techo escayola', 'm²', 18.00, 21),
  ('construccion', 'Colocación puerta', 'uds', 60.00, 21),
  ('construccion', 'Colocación ventana', 'uds', 80.00, 21),
  ('construccion', 'Rodapié', 'ml', 6.00, 21),
  ('construccion', 'Albañilería', 'h', 35.00, 21),
  ('construccion', 'Material de obra', 'paq', 50.00, 21),
  ('construccion', 'Transporte de materiales', 'viaje', 40.00, 21),
  ('construccion', 'Limpieza final de obra', 'uds', 60.00, 21)
on conflict do nothing;

-- RLS: solo lectura pública
alter table public.common_items enable row level security;

create policy "common_items public read"
  on public.common_items for select
  to anon, authenticated
  using (true);

grant all on public.common_items to anon, authenticated;
