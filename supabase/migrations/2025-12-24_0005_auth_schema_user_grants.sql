-- Allow application roles to use auth schema helpers in RLS + RPCs
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
