import { env as privateEnv } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { createSignedUrlMap } from '$lib/server/storage';
import { demoCards, makeDemoSignedUrls, pickRandomUniqueWithSeed } from '$lib/demo-cards';

type ReadingRow = {
	id: string;
	created_at: string;
	owner_type: 'user' | 'person';
	owner_person_id: string | null;
	spreads: { name: string; card_count: number } | null;
	persons: { name: string } | null;
	reading_items: Array<{ position_index: number; snapshot: any }> | null;
};

export const load = async ({ locals, params, url }) => {
	if (privateEnv.DEMO_MODE === '1') {
		const requestedCount = Number(url.searchParams.get('cards') ?? '');
		const cardCount = Math.max(
			1,
			Math.min(demoCards.length, Number.isFinite(requestedCount) ? Math.floor(requestedCount) : 3)
		);
		const spreadName =
			url.searchParams.get('spread') || (cardCount === 1 ? '1 carta' : `${cardCount} cartas`);

		const positionTitles =
			cardCount === 1
				? ['Mensaje']
				: cardCount === 3
					? ['Pasado', 'Presente', 'Futuro']
					: Array.from({ length: cardCount }, (_, idx) => `Carta ${idx + 1}`);

		const selectedCards = pickRandomUniqueWithSeed(demoCards, cardCount, params.readingId);
		const reading_items = selectedCards.map((card, idx) => ({
			position_index: idx + 1,
			snapshot: { position: { title: positionTitles[idx] || `Carta ${idx + 1}` }, card }
		}));

		const signedUrls = makeDemoSignedUrls(reading_items.map((it) => it.snapshot?.card?.image_path ?? null));

		return {
			reading: {
				id: params.readingId,
				created_at: new Date().toISOString(),
				owner_type: 'user',
				owner_person_id: null,
				spreads: { name: spreadName, card_count: cardCount },
				persons: null,
				reading_items
			},
			signedUrls
		};
	}

	const { data: reading, error: readingError } = await locals.supabase
		.from('readings')
		.select(
			'id, created_at, owner_type, owner_person_id, spreads(name, card_count), persons(name), reading_items(position_index, snapshot)'
		)
		.eq('id', params.readingId)
		.order('position_index', { foreignTable: 'reading_items', ascending: true })
		.maybeSingle()
		.returns<ReadingRow>();

	if (readingError) throw error(500, readingError.message);
	if (!reading) throw error(404, 'Lectura no encontrada');

	const imagePaths = (reading.reading_items ?? []).map((it) => it.snapshot?.card?.image_path ?? null);
	const signedUrls = await createSignedUrlMap(locals.supabase, 'card_images', imagePaths, 10 * 60);

	return { reading, signedUrls };
};
