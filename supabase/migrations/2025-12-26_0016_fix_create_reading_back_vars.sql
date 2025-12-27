-- Fix create_reading back vars to avoid ambiguity with columns
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
	v_back_image_path text;
	v_back_phrase text;
	reading_count int;
	oldest_reading_id uuid;
	person_creator_id uuid;
begin
	caller_id := public.current_user_id();
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

	if create_reading.owner_type = 'person' then
		if create_reading.owner_person_id is null then
			raise exception 'Falta person_id';
		end if;

		select p.created_by_user_id into person_creator_id
		from public.persons p
		where p.id = create_reading.owner_person_id
			and p.workspace_id = create_reading.workspace_id;

		if person_creator_id is null then
			raise exception 'Persona inválida';
		end if;

		if caller_role not in ('owner', 'staff') and person_creator_id != caller_id then
			raise exception 'No autorizado para crear lecturas para esta persona';
		end if;
	else
		owner_person_id := null;
	end if;

	if create_reading.owner_type = 'user' then
		select count(*) into reading_count
		from public.readings r
		where r.workspace_id = create_reading.workspace_id
			and r.owner_type = 'user'
			and r.owner_user_id = caller_id;

		while reading_count >= 30 loop
			select r.id into oldest_reading_id
			from public.readings r
			where r.workspace_id = create_reading.workspace_id
				and r.owner_type = 'user'
				and r.owner_user_id = caller_id
			order by r.created_at asc
			limit 1;

			delete from public.readings where id = oldest_reading_id;
			reading_count := reading_count - 1;
		end loop;
	elsif create_reading.owner_type = 'person' then
		select count(*) into reading_count
		from public.readings r
		where r.workspace_id = create_reading.workspace_id
			and r.owner_type = 'person'
			and r.owner_person_id = create_reading.owner_person_id;

		while reading_count >= 30 loop
			select r.id into oldest_reading_id
			from public.readings r
			where r.workspace_id = create_reading.workspace_id
				and r.owner_type = 'person'
				and r.owner_person_id = create_reading.owner_person_id
			order by r.created_at asc
			limit 1;

			delete from public.readings where id = oldest_reading_id;
			reading_count := reading_count - 1;
		end loop;
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
		caller_id,
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

		select cb.back_image_path, cb.phrase
		into v_back_image_path, v_back_phrase
		from public.card_backs cb
		where cb.workspace_id = create_reading.workspace_id
			and cb.card_id = selected_card_ids[i]
			and cb.status = 'published'
		order by extensions.digest(seed || cb.id::text || i::text, 'sha256')
		limit 1;

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
				'card_id', c.id,
				'card_name', c.name,
				'card_image_path', c.image_path,
				'back_image_path', v_back_image_path,
				'phrase', v_back_phrase,
				'short_message', c.short_message,
				'meaning', c.meaning,
				'meaning_extended', c.meaning_extended,
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
grant execute on function public.create_reading(uuid, uuid, public.reading_owner_type, uuid, uuid[]) to authenticated;
