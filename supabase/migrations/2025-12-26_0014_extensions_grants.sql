-- Allow security definer functions owned by oracle_backend to call extensions helpers
grant usage on schema extensions to oracle_backend;
grant execute on function extensions.gen_random_bytes(integer) to oracle_backend;
grant execute on function extensions.digest(text, text) to oracle_backend;
grant execute on function extensions.digest(bytea, text) to oracle_backend;
