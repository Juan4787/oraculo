-- Oracle app (multi-tenant) schema + RLS

-- Extensions
create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- Roles (used to own security-definer RPCs without bypassing RLS as superuser)
do $$
begin
	if not exists (select 1 from pg_roles where rolname = 'oracle_backend') then
		create role oracle_backend noinherit;
	end if;
end $$;

-- Enums
do $$
begin
	if not exists (select 1 from pg_type where typname = 'workspace_role') then
		create type public.workspace_role as enum ('owner', 'staff', 'client');
	end if;
	if not exists (select 1 from pg_type where typname = 'content_status') then
		create type public.content_status as enum ('draft', 'published');
	end if;
	if not exists (select 1 from pg_type where typname = 'reading_owner_type') then
		create type public.reading_owner_type as enum ('user', 'person');
	end if;
end $$;

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create or replace function public.hash_access_code(code text)
returns text
language sql
stable
as $$
	select encode(extensions.digest(trim(code), 'sha256'), 'hex');
$$;

-- Core: workspaces + membership
create table if not exists public.workspaces (
	id uuid primary key default extensions.gen_random_uuid(),
	name text not null,
	slug text unique,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create trigger trg_workspaces_updated_at
before update on public.workspaces
for each row
execute procedure public.set_updated_at();

create table if not exists public.workspace_members (
	workspace_id uuid not null references public.workspaces(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	role public.workspace_role not null default 'client',
	created_at timestamptz not null default now(),
	primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);

-- Access codes (join workspace after purchase / invite)
create table if not exists public.workspace_access_codes (
	id uuid primary key default extensions.gen_random_uuid(),
	workspace_id uuid not null references public.workspaces(id) on delete cascade,
	code_hash text not null unique,
	role public.workspace_role not null default 'client',
	max_uses int,
	uses_count int not null default 0,
	enabled boolean not null default true,
	expires_at timestamptz,
	created_at timestamptz not null default now()
);

create index if not exists idx_workspace_access_codes_workspace_id on public.workspace_access_codes(workspace_id);

-- Content
create table if not exists public.decks (
	id uuid primary key default extensions.gen_random_uuid(),
	workspace_id uuid not null references public.workspaces(id) on delete cascade,
	name text not null,
	description text,
	status public.content_status not null default 'draft',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_decks_workspace_id on public.decks(workspace_id);

create trigger trg_decks_updated_at
before update on public.decks
for each row
execute procedure public.set_updated_at();

create table if not exists public.cards (
	id uuid primary key default extensions.gen_random_uuid(),
	workspace_id uuid not null references public.workspaces(id) on delete cascade,
	deck_id uuid references public.decks(id) on delete set null,
	name text not null,
	image_path text,
	short_message text not null,
	meaning text not null,
	meaning_extended text,
	status public.content_status not null default 'draft',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_cards_workspace_id on public.cards(workspace_id);
create index if not exists idx_cards_deck_id on public.cards(deck_id);
create index if not exists idx_cards_status on public.cards(status);

create trigger trg_cards_updated_at
before update on public.cards
for each row
execute procedure public.set_updated_at();

create or replace function public.ensure_card_deck_workspace_match()
returns trigger
language plpgsql
as $$
declare
	deck_workspace_id uuid;
begin
	if new.deck_id is null then
		return new;
	end if;

	select d.workspace_id into deck_workspace_id
	from public.decks d
	where d.id = new.deck_id;

	if deck_workspace_id is null then
		raise exception 'Deck no existe';
	end if;

	if deck_workspace_id <> new.workspace_id then
		raise exception 'El mazo no pertenece al workspace';
	end if;

	return new;
end;
$$;

create trigger trg_cards_deck_workspace_match
before insert or update on public.cards
for each row
execute procedure public.ensure_card_deck_workspace_match();

create table if not exists public.spreads (
	id uuid primary key default extensions.gen_random_uuid(),
	workspace_id uuid not null references public.workspaces(id) on delete cascade,
	name text not null,
	card_count int not null check (card_count > 0 and card_count <= 12),
	status public.content_status not null default 'draft',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (workspace_id, name)
);

create index if not exists idx_spreads_workspace_id on public.spreads(workspace_id);
create index if not exists idx_spreads_status on public.spreads(status);

create trigger trg_spreads_updated_at
before update on public.spreads
for each row
execute procedure public.set_updated_at();

create table if not exists public.spread_positions (
	id uuid primary key default extensions.gen_random_uuid(),
	spread_id uuid not null references public.spreads(id) on delete cascade,
	position_index int not null check (position_index >= 1),
	title text not null,
	description text,
	created_at timestamptz not null default now(),
	unique (spread_id, position_index)
);

create index if not exists idx_spread_positions_spread_id on public.spread_positions(spread_id);

-- Professional: persons/patients (internal profiles)
create table if not exists public.persons (
	id uuid primary key default extensions.gen_random_uuid(),
	workspace_id uuid not null references public.workspaces(id) on delete cascade,
	created_by_user_id uuid not null references auth.users(id),
	name text not null,
	notes text,
	tags text[] not null default '{}',
	archived boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_persons_workspace_id on public.persons(workspace_id);
create index if not exists idx_persons_archived on public.persons(archived);

create trigger trg_persons_updated_at
before update on public.persons
for each row
execute procedure public.set_updated_at();

-- Readings + snapshot items
create table if not exists public.readings (
	id uuid primary key default extensions.gen_random_uuid(),
	workspace_id uuid not null references public.workspaces(id) on delete cascade,
	owner_type public.reading_owner_type not null,
	owner_user_id uuid references auth.users(id) on delete set null,
	owner_person_id uuid references public.persons(id) on delete set null,
	created_by_user_id uuid references auth.users(id) on delete set null,
	spread_id uuid not null references public.spreads(id) on delete restrict,
	selected_deck_ids uuid[],
	random_seed text not null,
	note text,
	created_at timestamptz not null default now(),
	constraint readings_owner_check check (
		(owner_type = 'user' and owner_user_id is not null and owner_person_id is null)
		or (owner_type = 'person' and owner_person_id is not null and owner_user_id is null)
	),
	constraint readings_created_by_check check (
		(owner_type = 'user' and (created_by_user_id is null or created_by_user_id = owner_user_id))
		or (owner_type = 'person' and created_by_user_id is not null)
	)
);

create index if not exists idx_readings_workspace_id on public.readings(workspace_id);
create index if not exists idx_readings_owner_user_id on public.readings(owner_user_id);
create index if not exists idx_readings_owner_person_id on public.readings(owner_person_id);
create index if not exists idx_readings_created_at on public.readings(created_at desc);

create table if not exists public.reading_items (
	id uuid primary key default extensions.gen_random_uuid(),
	reading_id uuid not null references public.readings(id) on delete cascade,
	position_index int not null check (position_index >= 1),
	card_id uuid not null references public.cards(id) on delete restrict,
	snapshot jsonb not null,
	created_at timestamptz not null default now(),
	unique (reading_id, position_index)
);

create index if not exists idx_reading_items_reading_id on public.reading_items(reading_id);

-- Default spreads per workspace
create or replace function public.bootstrap_default_spreads()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	spread_1 uuid;
	spread_3 uuid;
begin
	insert into public.spreads (workspace_id, name, card_count, status)
	values (new.id, '1 carta', 1, 'published')
	returning id into spread_1;

	insert into public.spread_positions (spread_id, position_index, title)
	values (spread_1, 1, 'Mensaje');

	insert into public.spreads (workspace_id, name, card_count, status)
	values (new.id, '3 cartas', 3, 'published')
	returning id into spread_3;

	insert into public.spread_positions (spread_id, position_index, title)
	values
		(spread_3, 1, 'Pasado'),
		(spread_3, 2, 'Presente'),
		(spread_3, 3, 'Futuro');

	return new;
end;
$$;

drop trigger if exists trg_workspaces_bootstrap_spreads on public.workspaces;
create trigger trg_workspaces_bootstrap_spreads
after insert on public.workspaces
for each row
execute procedure public.bootstrap_default_spreads();

-- RPC: redeem access code -> create membership
create or replace function public.redeem_access_code(access_code text)
returns table (workspace_id uuid, role public.workspace_role)
language plpgsql
security definer
set search_path = public
as $$
declare
	code_hash text;
	row public.workspace_access_codes%rowtype;
	existing_role public.workspace_role;
begin
	if auth.uid() is null then
		raise exception 'No autenticado';
	end if;

	code_hash := public.hash_access_code(access_code);

	select * into row
	from public.workspace_access_codes c
	where c.code_hash = code_hash
		and c.enabled is true
		and (c.expires_at is null or c.expires_at > now());

	if row.id is null then
		raise exception 'Código inválido o expirado';
	end if;

	if row.max_uses is not null and row.uses_count >= row.max_uses then
		raise exception 'Este código ya fue usado el máximo permitido';
	end if;

	select wm.role into existing_role
	from public.workspace_members wm
	where wm.workspace_id = row.workspace_id and wm.user_id = auth.uid();

	if existing_role is not null then
		workspace_id := row.workspace_id;
		role := existing_role;
		return next;
		return;
	end if;

	insert into public.workspace_members (workspace_id, user_id, role)
	values (row.workspace_id, auth.uid(), row.role);

	update public.workspace_access_codes
	set uses_count = uses_count + 1
	where id = row.id;

	workspace_id := row.workspace_id;
	role := row.role;
	return next;
end;
$$;

alter function public.redeem_access_code(text) owner to oracle_backend;

-- RPC: create reading (random + snapshot)
create or replace function public.create_reading(
	workspace_id uuid,
	spread_id uuid,
	owner_type public.reading_owner_type,
	owner_person_id uuid default null,
	selected_deck_ids uuid[] default null
)
returns table (reading_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
	caller_id uuid;
	caller_role public.workspace_role;
	card_n int;
	seed text;
	new_reading_id uuid;
	selected_card_ids uuid[];
	i int;
	position_title text;
begin
	caller_id := auth.uid();
	if caller_id is null then
		raise exception 'No autenticado';
	end if;

	select wm.role into caller_role
	from public.workspace_members wm
	where wm.workspace_id = create_reading.workspace_id
		and wm.user_id = caller_id;

	if caller_role is null then
		raise exception 'Sin acceso al workspace';
	end if;

	select s.card_count into card_n
	from public.spreads s
	where s.id = create_reading.spread_id
		and s.workspace_id = create_reading.workspace_id
		and s.status = 'published';

	if card_n is null then
		raise exception 'Tirada inválida o no publicada';
	end if;

	if owner_type = 'person' then
		if caller_role not in ('owner', 'staff') then
			raise exception 'No autorizado';
		end if;

		if owner_person_id is null then
			raise exception 'Falta person_id';
		end if;

		if not exists (
			select 1
			from public.persons p
			where p.id = create_reading.owner_person_id
				and p.workspace_id = create_reading.workspace_id
		) then
			raise exception 'Persona inválida';
		end if;
	else
		owner_person_id := null;
	end if;

	seed := encode(extensions.gen_random_bytes(16), 'hex');

	with eligible as (
		select c.id
		from public.cards c
		where c.workspace_id = create_reading.workspace_id
			and c.status = 'published'
			and (
				create_reading.selected_deck_ids is null
				or cardinality(create_reading.selected_deck_ids) = 0
				or c.deck_id = any(create_reading.selected_deck_ids)
			)
	),
	ordered as (
		select
			e.id,
			extensions.digest(seed || e.id::text, 'sha256') as sort_key
		from eligible e
		order by sort_key
		limit card_n
	)
	select array_agg(id order by sort_key) into selected_card_ids from ordered;

	if selected_card_ids is null or array_length(selected_card_ids, 1) < card_n then
		raise exception 'No hay suficientes cartas publicadas para esta tirada';
	end if;

	insert into public.readings (
		workspace_id,
		owner_type,
		owner_user_id,
		owner_person_id,
		created_by_user_id,
		spread_id,
		selected_deck_ids,
		random_seed
	)
	values (
		create_reading.workspace_id,
		create_reading.owner_type,
		case when create_reading.owner_type = 'user' then caller_id else null end,
		case when create_reading.owner_type = 'person' then create_reading.owner_person_id else null end,
		case when create_reading.owner_type = 'person' then caller_id else null end,
		create_reading.spread_id,
		create_reading.selected_deck_ids,
		seed
	)
	returning id into new_reading_id;

	for i in 1..card_n loop
		select sp.title into position_title
		from public.spread_positions sp
		where sp.spread_id = create_reading.spread_id
			and sp.position_index = i;

		if position_title is null then
			position_title := 'Carta ' || i::text;
		end if;

		insert into public.reading_items (reading_id, position_index, card_id, snapshot)
		select
			new_reading_id,
			i,
			c.id,
			jsonb_build_object(
				'position',
				jsonb_build_object('index', i, 'title', position_title),
				'card',
				jsonb_build_object(
					'id', c.id,
					'name', c.name,
					'image_path', c.image_path,
					'short_message', c.short_message,
					'meaning', c.meaning,
					'meaning_extended', c.meaning_extended
				),
				'deck',
				case when d.id is null
					then null
					else jsonb_build_object('id', d.id, 'name', d.name)
				end
			)
		from public.cards c
		left join public.decks d on d.id = c.deck_id
		where c.id = selected_card_ids[i];
	end loop;

	reading_id := new_reading_id;
	return next;
end;
$$;

alter function public.create_reading(uuid, uuid, public.reading_owner_type, uuid, uuid[]) owner to oracle_backend;

-- Storage buckets (private)
insert into storage.buckets (id, name, public)
values
	('card_images', 'card_images', false),
	('reading_pdfs', 'reading_pdfs', false)
on conflict (id) do nothing;

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_access_codes enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.spreads enable row level security;
alter table public.spread_positions enable row level security;
alter table public.persons enable row level security;
alter table public.readings enable row level security;
alter table public.reading_items enable row level security;

-- Workspaces: members can read
drop policy if exists workspaces_select_members on public.workspaces;
create policy workspaces_select_members
on public.workspaces
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
	)
);

-- Workspace members: users can read their own membership row
drop policy if exists workspace_members_select_self on public.workspace_members;
create policy workspace_members_select_self
on public.workspace_members
for select
to authenticated, oracle_backend
using (user_id = auth.uid());

drop policy if exists workspace_members_insert_self on public.workspace_members;
create policy workspace_members_insert_self
on public.workspace_members
for insert
to oracle_backend
with check (user_id = auth.uid());

-- Access codes: admin-only
drop policy if exists workspace_access_codes_admin_all on public.workspace_access_codes;
create policy workspace_access_codes_admin_all
on public.workspace_access_codes
for all
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = workspace_access_codes.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = workspace_access_codes.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

-- Decks: published for members; all for admin
drop policy if exists decks_select on public.decks;
create policy decks_select
on public.decks
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = decks.workspace_id
			and wm.user_id = auth.uid()
			and (wm.role in ('owner', 'staff') or decks.status = 'published')
	)
);

drop policy if exists decks_write_admin on public.decks;
create policy decks_write_admin
on public.decks
for insert, update, delete
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = decks.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = decks.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

-- Cards: published for members; all for admin
drop policy if exists cards_select on public.cards;
create policy cards_select
on public.cards
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = cards.workspace_id
			and wm.user_id = auth.uid()
			and (wm.role in ('owner', 'staff') or cards.status = 'published')
	)
);

drop policy if exists cards_write_admin on public.cards;
create policy cards_write_admin
on public.cards
for insert, update, delete
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = cards.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = cards.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

-- Spreads: published for members; all for admin
drop policy if exists spreads_select on public.spreads;
create policy spreads_select
on public.spreads
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = spreads.workspace_id
			and wm.user_id = auth.uid()
			and (wm.role in ('owner', 'staff') or spreads.status = 'published')
	)
);

drop policy if exists spreads_write_admin on public.spreads;
create policy spreads_write_admin
on public.spreads
for insert, update, delete
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = spreads.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = spreads.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

-- Spread positions: same as parent spread visibility
drop policy if exists spread_positions_select on public.spread_positions;
create policy spread_positions_select
on public.spread_positions
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.spreads s
		join public.workspace_members wm on wm.workspace_id = s.workspace_id and wm.user_id = auth.uid()
		where s.id = spread_positions.spread_id
			and (wm.role in ('owner', 'staff') or s.status = 'published')
	)
);

drop policy if exists spread_positions_write_admin on public.spread_positions;
create policy spread_positions_write_admin
on public.spread_positions
for insert, update, delete
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.spreads s
		join public.workspace_members wm on wm.workspace_id = s.workspace_id and wm.user_id = auth.uid()
		where s.id = spread_positions.spread_id
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.spreads s
		join public.workspace_members wm on wm.workspace_id = s.workspace_id and wm.user_id = auth.uid()
		where s.id = spread_positions.spread_id
			and wm.role in ('owner', 'staff')
	)
);

-- Persons: admin only
drop policy if exists persons_admin_all on public.persons;
create policy persons_admin_all
on public.persons
for all
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = persons.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = persons.workspace_id
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

-- Readings: owners can read their own user-owned readings; admin can read all in workspace
drop policy if exists readings_select on public.readings;
create policy readings_select
on public.readings
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = readings.workspace_id
			and wm.user_id = auth.uid()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = auth.uid())
			)
	)
);

drop policy if exists readings_insert on public.readings;
create policy readings_insert
on public.readings
for insert
to oracle_backend
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = readings.workspace_id
			and wm.user_id = auth.uid()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = auth.uid())
			)
	)
);

drop policy if exists readings_update_note on public.readings;
create policy readings_update_note
on public.readings
for update
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = readings.workspace_id
			and wm.user_id = auth.uid()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = auth.uid())
			)
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = readings.workspace_id
			and wm.user_id = auth.uid()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = auth.uid())
			)
	)
);

-- Reading items: only readable through reading access; insert only by backend RPC
drop policy if exists reading_items_select on public.reading_items;
create policy reading_items_select
on public.reading_items
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.readings r
		where r.id = reading_items.reading_id
			and exists (
				select 1
				from public.workspace_members wm
				where wm.workspace_id = r.workspace_id
					and wm.user_id = auth.uid()
					and (
						wm.role in ('owner', 'staff')
						or (r.owner_type = 'user' and r.owner_user_id = auth.uid())
					)
			)
	)
);

drop policy if exists reading_items_insert on public.reading_items;
create policy reading_items_insert
on public.reading_items
for insert
to oracle_backend
with check (
	exists (
		select 1
		from public.readings r
		where r.id = reading_items.reading_id
			and exists (
				select 1
				from public.workspace_members wm
				where wm.workspace_id = r.workspace_id
					and wm.user_id = auth.uid()
					and (
						wm.role in ('owner', 'staff')
						or (r.owner_type = 'user' and r.owner_user_id = auth.uid())
					)
			)
	)
);

-- Storage policies (card images)
drop policy if exists card_images_select_members on storage.objects;
create policy card_images_select_members
on storage.objects
for select
to authenticated
using (
	bucket_id = 'card_images'
	and exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id::text = split_part(name, '/', 2)
			and wm.user_id = auth.uid()
	)
);

drop policy if exists card_images_insert_admin on storage.objects;
create policy card_images_insert_admin
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'card_images'
	and exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id::text = split_part(name, '/', 2)
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

drop policy if exists card_images_update_admin on storage.objects;
create policy card_images_update_admin
on storage.objects
for update
to authenticated
using (
	bucket_id = 'card_images'
	and exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id::text = split_part(name, '/', 2)
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	bucket_id = 'card_images'
	and exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id::text = split_part(name, '/', 2)
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

drop policy if exists card_images_delete_admin on storage.objects;
create policy card_images_delete_admin
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'card_images'
	and exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id::text = split_part(name, '/', 2)
			and wm.user_id = auth.uid()
			and wm.role in ('owner', 'staff')
	)
);

-- Grants (PostgREST)
grant usage on schema public to authenticated;
grant usage on schema public to oracle_backend;
grant usage on schema extensions to authenticated;
grant usage on schema extensions to oracle_backend;

grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;

grant select, insert, update, delete on public.decks to authenticated;
grant select, insert, update, delete on public.cards to authenticated;
grant select, insert, update, delete on public.spreads to authenticated;
grant select, insert, update, delete on public.spread_positions to authenticated;
grant select, insert, update, delete on public.persons to authenticated;

-- Readings are created via RPC (no direct insert/delete)
revoke insert, delete on public.readings from authenticated;
revoke insert, update, delete on public.reading_items from authenticated;

grant select, update(note) on public.readings to authenticated;
grant select on public.reading_items to authenticated;

-- Backend role privileges
grant select on public.workspaces to oracle_backend;
grant select, insert on public.workspace_members to oracle_backend;
grant select on public.workspace_access_codes to oracle_backend;
grant select on public.decks to oracle_backend;
grant select on public.cards to oracle_backend;
grant select on public.spreads to oracle_backend;
grant select on public.spread_positions to oracle_backend;
grant select on public.persons to oracle_backend;
grant insert, select, update(note) on public.readings to oracle_backend;
grant insert, select on public.reading_items to oracle_backend;

grant execute on function public.redeem_access_code(text) to authenticated;
grant execute on function public.create_reading(uuid, uuid, public.reading_owner_type, uuid, uuid[]) to authenticated;
