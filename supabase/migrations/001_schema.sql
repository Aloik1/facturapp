-- 001_schema.sql
-- Phase 1: Facturas Recibidas (reception-first)

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scanned_at timestamptz not null default now(),

  -- Emisor (proveedor)
  emisor_nif text not null,
  emisor_razon_social text not null,
  emisor_domicilio text,

  -- Factura
  factura_numero text not null,
  fecha_emision date not null,
  fecha_operacion date,

  -- Importes
  base_imponible numeric(12, 2) not null,
  tipo_iva numeric(5, 2) not null,
  cuota_iva numeric(12, 2) not null,
  porcentaje_retencion_irpf numeric(5, 2),
  importe_retencion_irpf numeric(12, 2),
  importe_total numeric(12, 2) not null,

  -- Metadata
  concepto text not null,
  categoria text,
  pagada boolean not null default false,
  fecha_pago date,

  -- Adjuntos
  imagen_url text,

  -- Notas del usuario
  notas text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.invoices enable row level security;

-- Grant base access to Supabase roles (RLS handles row-level filtering)
grant all on public.invoices to anon, authenticated;

-- Políticas: cada usuario solo ve sus propias facturas
create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "Users can delete own invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

-- Índices
create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_fecha_emision_idx on public.invoices(fecha_emision);
create index if not exists invoices_emisor_nif_idx on public.invoices(emisor_nif);
create index if not exists invoices_pagada_idx on public.invoices(pagada);
