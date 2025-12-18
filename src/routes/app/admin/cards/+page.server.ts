import { env as privateEnv } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';
import { createSignedUrlMap } from '$lib/server/storage';
import { demoCards, demoDeck, makeDemoSignedUrls } from '$lib/demo-cards';

type DeckRow = { id: string; name: string };
type CardRow = {
	id: string;
	name: string;
	deck_id: string | null;
	status: 'draft' | 'published';
	image_path: string | null;
	short_message: string;
	created_at: string;
	decks: { name: string } | null;
};

function sanitizeFilename(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
}

export const load = async ({ locals }) => {
	if (privateEnv.DEMO_MODE === '1') {
		const cards: CardRow[] = demoCards.map((card, idx) => ({
			id: card.id,
			name: card.name,
			deck_id: demoDeck.id,
			status: 'published',
			image_path: card.image_path,
			short_message: card.short_message,
			created_at: new Date(Date.now() - idx * 1000).toISOString(),
			decks: { name: demoDeck.name }
		}));

		const signedUrls = makeDemoSignedUrls(cards.map((c) => c.image_path));

		return { decks: [{ id: demoDeck.id, name: demoDeck.name }], cards, signedUrls };
	}

	if (!locals.workspaceId) redirect(303, '/app/join');

	const { data: decks, error: decksError } = await locals.supabase
		.from('decks')
		.select('id, name')
		.eq('workspace_id', locals.workspaceId)
		.order('name', { ascending: true })
		.returns<DeckRow[]>();

	if (decksError) throw error(500, decksError.message);

	const { data: cards, error: cardsError } = await locals.supabase
		.from('cards')
		.select('id, name, deck_id, status, image_path, short_message, created_at, decks(name)')
		.eq('workspace_id', locals.workspaceId)
		.order('created_at', { ascending: false })
		.limit(100)
		.returns<CardRow[]>();

	if (cardsError) throw error(500, cardsError.message);

	const signedUrls = await createSignedUrlMap(
		locals.supabase,
		'card_images',
		(cards ?? []).map((c) => c.image_path)
	);

	return { decks: decks ?? [], cards: cards ?? [], signedUrls };
};

export const actions = {
	create: async ({ locals, request }) => {
		if (privateEnv.DEMO_MODE === '1') {
			return fail(400, { message: 'Modo demo: no se guardan cartas.' });
		}

		if (!locals.workspaceId) redirect(303, '/app/join');

		const form = await request.formData();

		const name = String(form.get('name') ?? '').trim();
		const deckIdRaw = String(form.get('deck_id') ?? '').trim();
		const status = (String(form.get('status') ?? 'draft') as 'draft' | 'published') || 'draft';
		const shortMessage = String(form.get('short_message') ?? '').trim();
		const meaning = String(form.get('meaning') ?? '').trim();
		const meaningExtended = String(form.get('meaning_extended') ?? '').trim();

		const image = form.get('image');
		if (!(image instanceof File) || image.size === 0) return fail(400, { message: 'Subí una imagen.' });
		if (!image.type.startsWith('image/')) return fail(400, { message: 'La imagen no es válida.' });

		if (!name) return fail(400, { message: 'El nombre de la carta es obligatorio.' });
		if (!shortMessage) return fail(400, { message: 'El mensaje corto es obligatorio.' });
		if (!meaning) return fail(400, { message: 'El significado es obligatorio.' });

		const cardId = crypto.randomUUID();
		const safeName = sanitizeFilename(image.name || 'carta.png') || 'carta.png';
		const objectPath = `workspaces/${locals.workspaceId}/cards/${cardId}/${Date.now()}-${safeName}`;

		const { error: uploadError } = await locals.supabase.storage
			.from('card_images')
			.upload(objectPath, image, { upsert: true, contentType: image.type });

		if (uploadError) return fail(400, { message: uploadError.message });

		const { error: insertError } = await locals.supabase.from('cards').insert({
			id: cardId,
			workspace_id: locals.workspaceId,
			deck_id: deckIdRaw || null,
			name,
			image_path: objectPath,
			short_message: shortMessage,
			meaning,
			meaning_extended: meaningExtended || null,
			status
		});

		if (insertError) {
			await locals.supabase.storage.from('card_images').remove([objectPath]).catch(() => {});
			return fail(400, { message: insertError.message });
		}

		return { ok: true };
	},
	toggle: async ({ locals, request }) => {
		if (privateEnv.DEMO_MODE === '1') {
			return fail(400, { message: 'Modo demo: no se guardan cambios.' });
		}

		if (!locals.workspaceId) redirect(303, '/app/join');

		const form = await request.formData();
		const cardId = String(form.get('card_id') ?? '').trim();
		const nextStatus = String(form.get('next_status') ?? '').trim() as 'draft' | 'published';

		if (!cardId || (nextStatus !== 'draft' && nextStatus !== 'published')) {
			return fail(400, { message: 'Acción inválida.' });
		}

		const { error: updateError } = await locals.supabase
			.from('cards')
			.update({ status: nextStatus })
			.eq('workspace_id', locals.workspaceId)
			.eq('id', cardId);

		if (updateError) return fail(400, { message: updateError.message });
		return { ok: true };
	}
};
