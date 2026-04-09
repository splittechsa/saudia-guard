-- Core data wiring repair (profiles, roles, subscriptions, stores, dashboards)
-- Run this in Supabase SQL Editor once.

begin;

-- 1) Ensure role helper exists.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- 2) Ensure signup trigger exists and auto-creates profile + default merchant role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'merchant')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3) Backfill existing auth users missing profile/role rows.
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.user_roles (user_id, role)
select u.id, 'merchant'::public.app_role
from auth.users u
left join public.user_roles r on r.user_id = u.id
where r.user_id is null;

-- 4) Ensure RLS enabled on core tables.
alter table if exists public.profiles enable row level security;
alter table if exists public.user_roles enable row level security;
alter table if exists public.subscriptions enable row level security;
alter table if exists public.stores enable row level security;
alter table if exists public.support_tickets enable row level security;
alter table if exists public.analytics_logs enable row level security;
alter table if exists public.security_alerts enable row level security;
alter table if exists public.system_logs enable row level security;
alter table if exists public.store_api_keys enable row level security;

-- 5) Profiles policies.
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins and support can view all profiles" on public.profiles;
drop policy if exists "IT support can view all profiles" on public.profiles;

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

-- 6) user_roles policies.
drop policy if exists "Users can view own roles" on public.user_roles;
drop policy if exists "Support can view all roles" on public.user_roles;
drop policy if exists "Super owners can manage roles" on public.user_roles;

create policy "Users can view own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create policy "Support can view all roles"
on public.user_roles for select to authenticated
using (
  public.has_role(auth.uid(), 'super_owner')
  or public.has_role(auth.uid(), 'it_support')
);

create policy "Super owners can manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

-- 7) stores/subscriptions/support policies required by admin + IT dashboards.
drop policy if exists "Super owners can update all subscriptions" on public.subscriptions;
drop policy if exists "Super owners can update all stores" on public.stores;
drop policy if exists "IT support can update all stores" on public.stores;
drop policy if exists "IT support can view all tickets" on public.support_tickets;
drop policy if exists "IT support can update all tickets" on public.support_tickets;

create policy "Super owners can update all subscriptions"
on public.subscriptions for update to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

create policy "Super owners can update all stores"
on public.stores for update to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

create policy "IT support can update all stores"
on public.stores for update to authenticated
using (public.has_role(auth.uid(), 'it_support'))
with check (public.has_role(auth.uid(), 'it_support'));

create policy "IT support can view all tickets"
on public.support_tickets for select to authenticated
using (public.has_role(auth.uid(), 'it_support'));

create policy "IT support can update all tickets"
on public.support_tickets for update to authenticated
using (public.has_role(auth.uid(), 'it_support'))
with check (public.has_role(auth.uid(), 'it_support'));

commit;

-- Verification (run separately):
-- select count(*) as auth_users from auth.users;
-- select count(*) as profiles_rows from public.profiles;
-- select count(*) as user_roles_rows from public.user_roles;
-- select user_id, role from public.user_roles order by role, user_id;
