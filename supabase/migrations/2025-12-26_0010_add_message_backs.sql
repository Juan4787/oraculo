-- Seed new message backs for existing arcangel cards (skip if already present)
insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-rafael-4.png', 'published'
from public.cards c
where lower(c.name) like '%rafael%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-rafael-4.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-rafael-5.png', 'published'
from public.cards c
where lower(c.name) like '%rafael%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-rafael-5.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-rafael-6.png', 'published'
from public.cards c
where lower(c.name) like '%rafael%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-rafael-6.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-gabriel-2.png', 'published'
from public.cards c
where lower(c.name) like '%gabriel%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-gabriel-2.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-gabriel-3.png', 'published'
from public.cards c
where lower(c.name) like '%gabriel%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-gabriel-3.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-miguel-1.png', 'published'
from public.cards c
where lower(c.name) like '%miguel%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-miguel-1.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-miguel-2.png', 'published'
from public.cards c
where lower(c.name) like '%miguel%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-miguel-2.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-uriel-3.png', 'published'
from public.cards c
where lower(c.name) like '%uriel%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-uriel-3.png'
	);

insert into public.card_backs (card_id, workspace_id, back_image_path, status)
select c.id, c.workspace_id, '/cards/message-metatron-1.png', 'published'
from public.cards c
where lower(c.name) like '%metatron%'
	and not exists (
		select 1 from public.card_backs cb
		where cb.card_id = c.id and cb.back_image_path = '/cards/message-metatron-1.png'
	);
