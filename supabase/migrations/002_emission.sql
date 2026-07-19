-- 002_emission.sql
-- Phase 1: Emisión de facturas + viral loop
-- Reemplaza schema de recepción (001_schema.sql)

-- Drop old reception table
drop table if exists public.invoices cascade;

-- ============================================================
-- PROFILES (datos fiscales del autónomo, 1:1 con auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  business_name text not null default '',
  business_nif text not null default '',
  address text,
  logo_url text,
  phone text,
  default_footer text,
  plan text not null default 'free' check (plan in ('free', 'premium', 'pro')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CLIENTS (clientes del autónomo)
-- ============================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  nif text not null,
  email text,
  phone text,
  address text,
  default_tax_pct numeric(5, 2),
  default_payment_days integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INVOICES (facturas emitidas)
-- ============================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_nif text not null,
  client_address text,
  issue_date date not null default current_date,
  due_date date,
  items jsonb not null default '[]'::jsonb,
  base_amount numeric(12, 2) not null,
  tax_amount numeric(12, 2) not null,
  irpf_applies boolean not null default false,
  irpf_percent numeric(5, 2),
  irpf_amount numeric(12, 2),
  total_amount numeric(12, 2) not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'cancelled')),
  notes text,
  payment_method text,
  paid_at timestamptz,
  share_token text unique,
  share_expires_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_user_name_idx on public.clients(user_id, name);
create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_user_number_idx on public.invoices(user_id, invoice_number);
create index if not exists invoices_issue_date_idx on public.invoices(user_id, issue_date);
create index if not exists invoices_share_token_idx on public.invoices(share_token);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;

grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.clients to anon, authenticated;
grant all on public.invoices to anon, authenticated;

-- Profiles: user owns their profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Clients: user owns their clients
create policy "Users can view own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can insert own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users can delete own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

-- Invoices: user owns their invoices
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

-- ============================================================
-- PUBLIC RPC: get shared invoice by token (no auth required)
-- ============================================================
create or replace function public.get_shared_invoice(p_token text)
returns table(
  client_name text,
  client_nif text,
  client_address text,
  items jsonb,
  base_amount numeric,
  tax_amount numeric,
  irpf_applies boolean,
  irpf_percent numeric,
  irpf_amount numeric,
  total_amount numeric,
  issue_date date,
  due_date date,
  invoice_number text,
  status text,
  notes text,
  business_name text,
  business_nif text,
  business_address text,
  logo_url text,
  default_footer text
)
language sql stable security definer
as $$
  select
    i.client_name, i.client_nif, i.client_address,
    i.items, i.base_amount, i.tax_amount,
    i.irpf_applies, i.irpf_percent, i.irpf_amount, i.total_amount,
    i.issue_date, i.due_date, i.invoice_number, i.status, i.notes,
    p.business_name, p.business_nif, p.address, p.logo_url, p.default_footer
  from public.invoices i
  join public.profiles p on p.user_id = i.user_id
  where i.share_token = p_token
    and (i.share_expires_at is null or i.share_expires_at > now());
$$;

-- ============================================================
-- PUBLIC RPC: increment view count (no auth required)
-- ============================================================
create or replace function public.increment_view_count(p_token text)
returns void
language sql security definer
as $$
  update public.invoices
  set view_count = view_count + 1
  where share_token = p_token;
$$;

-- ============================================================
-- TRIGGER: auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (user_id, business_name, business_nif, plan)
  values (new.id, '', '', 'free');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
