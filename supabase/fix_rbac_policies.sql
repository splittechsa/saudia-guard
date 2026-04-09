-- RBAC policy repair for role visibility and admin/support access
-- Run in Supabase SQL Editor

begin;

-- Ensure role-check function exists and is secure
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

-- Ensure RLS is enabled
alter table if exists public.user_roles enable row level security;
alter table if exists public.profiles enable row level security;

-- Rebuild user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Support can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super owners can manage roles" ON public.user_roles;

create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Support can view all roles"
on public.user_roles
for select
to authenticated
using (
  public.has_role(auth.uid(), 'super_owner')
  or public.has_role(auth.uid(), 'it_support')
);

create policy "Super owners can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'super_owner'))
with check (public.has_role(auth.uid(), 'super_owner'));

-- Rebuild profiles read policy so admin/support can manage users
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and support can view all profiles" ON public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Admins and support can view all profiles"
on public.profiles
for select
to authenticated
using (
  public.has_role(auth.uid(), 'super_owner')
  or public.has_role(auth.uid(), 'it_support')
);

commit;

-- Optional checks (run separately):
-- select user_id, role from public.user_roles order by role, user_id;
-- select policyname, tablename from pg_policies where schemaname='public' and tablename in ('user_roles','profiles') order by tablename, policyname;
