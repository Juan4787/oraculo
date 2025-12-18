import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { createSignedUrlMap } from '$lib/server/storage';
import { demoCards, makeDemoSignedUrls, pickRandomUniqueWithSeed } from '$lib/demo-cards';

type ReadingListRow = {
	id: string;
	created_at: string;
	spreads: { name: string; card_count: number } | null;
	reading_items: Array<{ position_index: number; snapshot: unknown }> | null;
};

export const load = async ({ locals, url }) => {
	if (privateEnv.DEMO_MODE === '1') {
		const cardCount = Math.max(1, Math.min(3, demoCards.length));
		const readingId = crypto.randomUUID();
		const preview = pickRandomUniqueWithSeed(demoCards, cardCount, readingId);
		const reading_items = preview.map((card, idx) => ({
			position_index: idx + 1,
			snapshot: { card: { name: card.name, short_message: card.short_message, image_path: card.image_path } }
		}));
		const signedUrls = makeDemoSignedUrls(reading_items.map((it) => it.snapshot?.card?.image_path ?? null));

		return {
			readings: [
				{
					id: readingId,
					created_at: new Date().toISOString(),
					spreads: {
						name: cardCount === 1 ? '1 carta' : `${cardCount} cartas`,
						card_count: cardCount
					},
					reading_items
				}
			],
			signedUrls,
			nextCursor: null
		};
	}

	if (!locals.workspaceId) redirect(303, '/app/join');

	const before = url.searchParams.get('before');
	const limit = 20;

	let query = locals.supabase
		.from('readings')
		.select('id, created_at, spreads(name, card_count), reading_items(position_index, snapshot)')
		.eq('owner_type', 'user');

	if (before) query = query.lt('created_at', before);

	const { data: readings, error: readingsError } = await query
		.order('created_at', { ascending: false })
		.limit(limit)
		.returns<ReadingListRow[]>();
	if (readingsError) throw error(500, readingsError.message);

	const imagePaths: Array<string | null> = [];
	for (const reading of readings ?? []) {
		const items = reading.reading_items ?? [];
		for (const item of items) {
			const snapshot = item.snapshot as any;
			imagePaths.push(snapshot?.card?.image_path ?? null);
		}
	}

	const signedUrls = await createSignedUrlMap(locals.supabase, 'card_images', imagePaths);
	const nextCursor = readings?.length ? readings[readings.length - 1].created_at : null;

	return {
		readings: readings ?? [],
		signedUrls,
		nextCursor
	};
};
