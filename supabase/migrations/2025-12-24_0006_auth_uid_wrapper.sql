-- Create a wrapper function for auth.uid() that can be used in RLS policies
-- This avoids permission issues with the auth schema
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid()
$$;

-- Grant execute to all roles that need it
grant execute on function public.current_user_id() to anon, authenticated, service_role, oracle_backend;
