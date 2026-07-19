-- ============================================================
-- MIGRATION 005: sector + phone en profiles + user_id unique
-- ============================================================

alter table public.profiles add column if not exists sector text;
alter table public.profiles add column if not exists phone text;

-- Añadir unique constraint en user_id para que upsert() funcione
alter table public.profiles add constraint profiles_user_id_unique unique (user_id);

-- Backfill: usuarios existentes sin sector → 'otro'
update public.profiles set sector = 'otro' where sector is null;

-- Actualizar trigger para que cree perfil con sector null (se rellena en onboarding)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (user_id, business_name, business_nif, plan, sector)
  values (new.id, '', '', 'free', null);
  return new;
end;
$$;
