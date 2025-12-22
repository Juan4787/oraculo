-- Allowed emails gatekeeping

create table if not exists public.allowed_emails (
	id uuid primary key default extensions.gen_random_uuid(),
	email text not null,
	enabled boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create unique index if not exists allowed_emails_email_key on public.allowed_emails (lower(email));

create or replace function public.normalize_allowed_email()
returns trigger
language plpgsql
as $$
begin
	new.email := lower(trim(new.email));
	return new;
end;
$$;

drop trigger if exists trg_allowed_emails_normalize on public.allowed_emails;
create trigger trg_allowed_emails_normalize
before insert or update on public.allowed_emails
for each row
execute procedure public.normalize_allowed_email();

drop trigger if exists trg_allowed_emails_updated_at on public.allowed_emails;
create trigger trg_allowed_emails_updated_at
before update on public.allowed_emails
for each row
execute procedure public.set_updated_at();

create or replace function public.is_email_enabled(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select case
		when p_email is null then false
		else exists (
			select 1
			from public.allowed_emails
			where lower(email) = lower(trim(p_email))
				and enabled is true
		)
	end;
$$;

alter function public.is_email_enabled(text) owner to oracle_backend;

create or replace function public.enforce_allowed_email_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.email is null then
		return new;
	end if;

	if public.is_email_enabled(new.email) then
		return new;
	end if;

	raise exception 'Email no habilitado.';
end;
$$;

alter function public.enforce_allowed_email_on_signup() owner to oracle_backend;

drop trigger if exists trg_auth_users_allowed_email on auth.users;
create trigger trg_auth_users_allowed_email
before insert on auth.users
for each row
execute procedure public.enforce_allowed_email_on_signup();

-- RLS
alter table public.allowed_emails enable row level security;

drop policy if exists allowed_emails_read_backend on public.allowed_emails;
create policy allowed_emails_read_backend
on public.allowed_emails
for select
to oracle_backend
using (true);

drop policy if exists allowed_emails_write_backend on public.allowed_emails;
create policy allowed_emails_write_backend
on public.allowed_emails
for all
to oracle_backend
using (true)
with check (true);

-- Grants
grant select, insert, update, delete on public.allowed_emails to oracle_backend;
grant execute on function public.is_email_enabled(text) to anon, authenticated;
