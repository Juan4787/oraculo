-- Update all RLS policies to use public.current_user_id() instead of auth.uid()

-- Workspaces
drop policy if exists workspaces_select_members on public.workspaces;
create policy workspaces_select_members
on public.workspaces
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = workspaces.id and wm.user_id = public.current_user_id()
	)
);

-- Workspace members
drop policy if exists workspace_members_select_self on public.workspace_members;
create policy workspace_members_select_self
on public.workspace_members
for select
to authenticated, oracle_backend
using (user_id = public.current_user_id());

drop policy if exists workspace_members_insert_self on public.workspace_members;
create policy workspace_members_insert_self
on public.workspace_members
for insert
to oracle_backend
with check (user_id = public.current_user_id());

-- Access codes
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
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = workspace_access_codes.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
);

-- Decks
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
			and wm.user_id = public.current_user_id()
			and (wm.role in ('owner', 'staff') or decks.status = 'published')
	)
);

drop policy if exists decks_write_admin on public.decks;
create policy decks_write_admin
on public.decks
for all
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = decks.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = decks.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
);

-- Cards
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
			and wm.user_id = public.current_user_id()
			and (wm.role in ('owner', 'staff') or cards.status = 'published')
	)
);

drop policy if exists cards_write_admin on public.cards;
create policy cards_write_admin
on public.cards
for all
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = cards.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = cards.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
);

-- Spreads
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
			and wm.user_id = public.current_user_id()
			and (wm.role in ('owner', 'staff') or spreads.status = 'published')
	)
);

drop policy if exists spreads_write_admin on public.spreads;
create policy spreads_write_admin
on public.spreads
for all
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = spreads.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = spreads.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
);

-- Spread positions
drop policy if exists spread_positions_select on public.spread_positions;
create policy spread_positions_select
on public.spread_positions
for select
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.spreads s
		join public.workspace_members wm on wm.workspace_id = s.workspace_id and wm.user_id = public.current_user_id()
		where s.id = spread_positions.spread_id
			and (wm.role in ('owner', 'staff') or s.status = 'published')
	)
);

drop policy if exists spread_positions_write_admin on public.spread_positions;
create policy spread_positions_write_admin
on public.spread_positions
for all
to authenticated, oracle_backend
using (
	exists (
		select 1
		from public.spreads s
		join public.workspace_members wm on wm.workspace_id = s.workspace_id and wm.user_id = public.current_user_id()
		where s.id = spread_positions.spread_id
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.spreads s
		join public.workspace_members wm on wm.workspace_id = s.workspace_id and wm.user_id = public.current_user_id()
		where s.id = spread_positions.spread_id
			and wm.role in ('owner', 'staff')
	)
);

-- Persons
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
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = persons.workspace_id
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
);

-- Readings
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
			and wm.user_id = public.current_user_id()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = public.current_user_id())
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
			and wm.user_id = public.current_user_id()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = public.current_user_id())
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
			and wm.user_id = public.current_user_id()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = public.current_user_id())
			)
	)
)
with check (
	exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id = readings.workspace_id
			and wm.user_id = public.current_user_id()
			and (
				wm.role in ('owner', 'staff')
				or (readings.owner_type = 'user' and readings.owner_user_id = public.current_user_id())
			)
	)
);

-- Reading items
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
					and wm.user_id = public.current_user_id()
					and (
						wm.role in ('owner', 'staff')
						or (r.owner_type = 'user' and r.owner_user_id = public.current_user_id())
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
					and wm.user_id = public.current_user_id()
					and (
						wm.role in ('owner', 'staff')
						or (r.owner_type = 'user' and r.owner_user_id = public.current_user_id())
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
			and wm.user_id = public.current_user_id()
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
			and wm.user_id = public.current_user_id()
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
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
)
with check (
	bucket_id = 'card_images'
	and exists (
		select 1
		from public.workspace_members wm
		where wm.workspace_id::text = split_part(name, '/', 2)
			and wm.user_id = public.current_user_id()
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
			and wm.user_id = public.current_user_id()
			and wm.role in ('owner', 'staff')
	)
);
