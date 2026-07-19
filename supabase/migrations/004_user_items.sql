-- ============================================================
-- MIGRATION 004: user_items — partidas aprendidas del usuario
-- ============================================================

create table if not exists public.user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  description text not null,
  unit text not null default 'uds',
  unit_price numeric(12,2) not null default 0,
  tax_pct numeric(5,2) not null default 21,
  frequency integer not null default 1,
  last_used_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, description)
);

create index if not exists user_items_user_id_idx on public.user_items(user_id);

-- RLS: propietario
alter table public.user_items enable row level security;

create policy "user_items user select"
  on public.user_items for select
  using (auth.uid() = user_id);

create policy "user_items user insert"
  on public.user_items for insert
  with check (auth.uid() = user_id);

create policy "user_items user update"
  on public.user_items for update
  using (auth.uid() = user_id);

grant all on public.user_items to authenticated;

-- Función upsert: si existe description, incrementa frequency y actualiza precio
create or replace function public.upsert_user_item(
  p_user_id uuid,
  p_description text,
  p_unit text,
  p_unit_price numeric(12,2),
  p_tax_pct numeric(5,2)
)
returns void
language plpgsql security definer
as $$
begin
  insert into public.user_items (user_id, description, unit, unit_price, tax_pct, frequency, last_used_at)
  values (p_user_id, p_description, p_unit, p_unit_price, p_tax_pct, 1, now())
  on conflict (user_id, description)
  do update set
    unit = p_unit,
    unit_price = p_unit_price,
    tax_pct = p_tax_pct,
    frequency = public.user_items.frequency + 1,
    last_used_at = now();
end;
$$;

