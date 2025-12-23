-- Remove access code flow (no longer used)

drop function if exists public.redeem_access_code(text);
drop table if exists public.workspace_access_codes;
drop function if exists public.hash_access_code(text);
