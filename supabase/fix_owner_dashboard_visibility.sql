-- Fix owner/admin visibility for dashboard stats and user management
-- Run in Supabase SQL Editor

begin;

-- Ensure function exists
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Optional safety grants for authenticated reads/writes controlled by RLS
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update on public.stores to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, insert, update on public.support_tickets to authenticated;
grant select, insert, update on public.analytics_logs to authenticated;
grant select on public.security_alerts to authenticated;
grant select on public.system_logs to authenticated;
grant select, insert on public.store_api_keys to authenticated;

alter table if exists public.profiles enable row level security;
alter table if exists public.user_roles enable row level security;
alter table if exists public.stores enable row level security;
alter table if exists public.subscriptions enable row level security;
alter table if exists public.support_tickets enable row level security;
alter table if exists public.analytics_logs enable row level security;
alter table if exists public.security_alerts enable row level security;
alter table if exists public.system_logs enable row level security;
alter table if exists public.store_api_keys enable row level security;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and support can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "IT support can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super owners can view all profiles" ON public.profiles;

create policy "Users can view own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Admins and support can view all profiles"
on public.profiles for select to authenticated
using (
  public.has_role(auth.uid(), 'super_owner')
  or public.has_role(auth.uid(), 'it_support')
);

-- Stores visibility
DROP POLICY IF EXISTS "Users can view own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can update own stores" ON public.stores;
DROP POLICY IF EXISTS "Super owners can view all stores" ON public.stores;
DROP POLICY IF EXISTS "IT support can view all stores" ON public.stores;
DROP POLICY IF EXISTS "Super owners can update all stores" ON public.stores;
DROP POLICY IF EXISTS "IT support can update all stores" ON public.stores;

create policy "Users can view own stores"
on public.stores for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own stores"
on public.stores for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own stores"
on public.stores for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Super owners can view all stores"
on public.stores for select to authenticated
using (public.has_role(auth.uid(), 'super_owner'));

create policy "IT support can view all stores"
on public.stores for select to authenticated
using (public.has_role(auth.uid(), 'it_support'));

create policy "Super owners can update all stores"
on public.stores for update to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

create policy "IT support can update all stores"
on public.stores for update to authenticated
using (public.has_role(auth.uid(), 'it_support'))
with check (public.has_role(auth.uid(), 'it_support'));

-- Subscriptions visibility
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Super owners can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Super owners can update all subscriptions" ON public.subscriptions;

create policy "Users can view own subscription"
on public.subscriptions for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own subscription"
on public.subscriptions for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own subscription"
on public.subscriptions for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Super owners can view all subscriptions"
on public.subscriptions for select to authenticated
using (public.has_role(auth.uid(), 'super_owner'));

create policy "Super owners can update all subscriptions"
on public.subscriptions for update to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

-- Analytics visibility
DROP POLICY IF EXISTS "Users can view own store logs" ON public.analytics_logs;
DROP POLICY IF EXISTS "Super owners can view all logs" ON public.analytics_logs;
DROP POLICY IF EXISTS "IT support can view all logs" ON public.analytics_logs;

create policy "Users can view own store logs"
on public.analytics_logs for select to authenticated
using (
  exists (
    select 1 from public.stores
    where stores.id = analytics_logs.store_id
      and stores.user_id = auth.uid()
  )
);

create policy "Super owners can view all logs"
on public.analytics_logs for select to authenticated
using (public.has_role(auth.uid(), 'super_owner'));

create policy "IT support can view all logs"
on public.analytics_logs for select to authenticated
using (public.has_role(auth.uid(), 'it_support'));

-- Alerts / system logs
DROP POLICY IF EXISTS "Users can view own store alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Super owners can view all alerts" ON public.security_alerts;

create policy "Users can view own store alerts"
on public.security_alerts for select to authenticated
using (
  exists (
    select 1 from public.stores
    where stores.id = security_alerts.store_id
      and stores.user_id = auth.uid()
  )
);

create policy "Super owners can view all alerts"
on public.security_alerts for select to authenticated
using (public.has_role(auth.uid(), 'super_owner'));

DROP POLICY IF EXISTS "IT support can view system logs" ON public.system_logs;
DROP POLICY IF EXISTS "Super owners can view system logs" ON public.system_logs;

create policy "IT support can view system logs"
on public.system_logs for select to authenticated
using (public.has_role(auth.uid(), 'it_support'));

create policy "Super owners can view system logs"
on public.system_logs for select to authenticated
using (public.has_role(auth.uid(), 'super_owner'));

-- Support tickets (for admin stats)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Super owners can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Super owners can update all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "IT support can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "IT support can update all tickets" ON public.support_tickets;

create policy "Users can view own tickets"
on public.support_tickets for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own tickets"
on public.support_tickets for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own tickets"
on public.support_tickets for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Super owners can view all tickets"
on public.support_tickets for select to authenticated
using (public.has_role(auth.uid(), 'super_owner'));

create policy "Super owners can update all tickets"
on public.support_tickets for update to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

create policy "IT support can view all tickets"
on public.support_tickets for select to authenticated
using (public.has_role(auth.uid(), 'it_support'));

create policy "IT support can update all tickets"
on public.support_tickets for update to authenticated
using (public.has_role(auth.uid(), 'it_support'))
with check (public.has_role(auth.uid(), 'it_support'));

-- API keys (for admin panel)
DROP POLICY IF EXISTS "Super owners can manage api keys" ON public.store_api_keys;
DROP POLICY IF EXISTS "Store owners can view own api keys" ON public.store_api_keys;

create policy "Super owners can manage api keys"
on public.store_api_keys for all to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

create policy "Store owners can view own api keys"
on public.store_api_keys for select to authenticated
using (
  exists (
    select 1 from public.stores
    where stores.id = store_api_keys.store_id
      and stores.user_id = auth.uid()
  )
);

commit;

-- Verify current signed-in super owner can read data by running these as authenticated in SQL editor session:
-- select count(*) from public.stores;
-- select count(*) from public.subscriptions;
-- select count(*) from public.analytics_logs;
-- select count(*) from public.support_tickets;
