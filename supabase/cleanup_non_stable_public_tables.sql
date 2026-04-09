-- Clean up public schema so it matches src/integrations/supabase/types.ts (stable commit)
-- Safe mode: keeps only the stable table set and drops all other public tables.
-- Review NOTICE logs in Supabase SQL editor output after running.

begin;

-- 1) Explicitly drop known polluted tables if they exist.
drop table if exists public.licenses cascade;
drop table if exists public.store_cameras cascade;
drop table if exists public.admin_commands cascade;
drop table if exists public.engine_status cascade;
drop table if exists public.tables cascade;

-- 2) Drop any public table not present in stable types.ts allowlist.
do $$
declare
  r record;
  stable_tables text[] := array[
    'analytics_logs',
    'analytics_logs_archive',
    'audit_trail',
    'broadcasts',
    'payments_history',
    'profiles',
    'security_alerts',
    'store_api_keys',
    'stores',
    'subscriptions',
    'support_tickets',
    'system_logs',
    'ticket_messages',
    'user_roles'
  ];
  protected_extension_tables text[] := array[
    'spatial_ref_sys'
  ];
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename <> all(stable_tables)
      and tablename <> all(protected_extension_tables)
  loop
    raise notice 'Dropping extra table: public.%', r.tablename;
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
end $$;

-- 3) Ensure core columns used by stable code exist (idempotent guards).
alter table if exists public.profiles
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists email text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.stores
  add column if not exists name text,
  add column if not exists user_id uuid,
  add column if not exists query_status text default 'pending',
  add column if not exists remote_command text default '',
  add column if not exists store_status text default 'inactive',
  add column if not exists custom_queries jsonb,
  add column if not exists operating_hours jsonb,
  add column if not exists hardware_choice text,
  add column if not exists rtsp_url text,
  add column if not exists camera_username text,
  add column if not exists camera_password text,
  add column if not exists debug_mode boolean default false,
  add column if not exists is_active boolean default true,
  add column if not exists interval_minutes integer,
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists it_review_notes text,
  add column if not exists whatsapp_enabled boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.analytics_logs
  add column if not exists store_id uuid,
  add column if not exists score numeric,
  add column if not exists status text,
  add column if not exists summary text,
  add column if not exists ai_reasoning text,
  add column if not exists confidence_score numeric,
  add column if not exists result jsonb,
  add column if not exists observations jsonb,
  add column if not exists client_environment jsonb,
  add column if not exists disputed boolean default false,
  add column if not exists created_at timestamptz default now();

commit;

-- Optional verification (run separately):
-- select tablename from pg_tables where schemaname = 'public' order by tablename;
