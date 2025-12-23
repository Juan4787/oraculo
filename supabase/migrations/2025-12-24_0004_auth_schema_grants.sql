-- Allow security definer functions owned by oracle_backend to use auth schema helpers
grant usage on schema auth to oracle_backend;
grant execute on function auth.uid() to oracle_backend;
