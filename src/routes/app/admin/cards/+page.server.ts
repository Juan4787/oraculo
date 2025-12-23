import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
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

	if (!locals.workspaceId) redirect(303, '/app');

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
