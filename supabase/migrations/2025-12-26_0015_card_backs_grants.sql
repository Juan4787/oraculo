-- Allow security definer functions owned by oracle_backend to read card_backs
grant select on table public.card_backs to oracle_backend;
