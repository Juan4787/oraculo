import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { createSignedUrlMap } from '$lib/server/storage';
import { demoBackPool, makeDemoSignedUrls, pickRandomDemoBacksWithSeed } from '$lib/demo-cards';

type ReadingListRow = {
	id: string;
	created_at: string;
	owner_type: 'user' | 'person';
	owner_person_id: string | null;
	spreads: { name: string; card_count: number } | null;
	persons: { name: string } | null;
	reading_items: Array<{ position_index: number; snapshot: unknown }> | null;
};

export const load = async ({ locals, url }) => {
	if (privateEnv.DEMO_MODE === '1') {
		const availableCount = demoBackPool.length;
		const cardCount = availableCount ? Math.min(3, availableCount) : 0;
		const readingId = crypto.randomUUID();
		const preview = pickRandomDemoBacksWithSeed(cardCount, readingId);
		const reading_items = preview.map((pick, idx) => ({
			position_index: idx + 1,
			snapshot: {
				card: {
					name: pick.card.name,
					short_message: pick.card.short_message,
					image_path: pick.card.image_path
				},
				back_image_path: pick.back_image_path
			}
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

	if (!locals.workspaceId) redirect(303, '/app');

	const before = url.searchParams.get('before');
	const limit = 20;

	console.log('[history] Loading readings for workspace:', locals.workspaceId);

	let query = locals.supabase
		.from('readings')
		.select('id, created_at, owner_type, owner_person_id, spreads(name, card_count), persons(name), reading_items(position_index, snapshot)')
		.eq('workspace_id', locals.workspaceId);

	if (before) query = query.lt('created_at', before);

	const { data: readings, error: readingsError } = await query
		.order('created_at', { ascending: false })
		.limit(limit)
		.returns<ReadingListRow[]>();

	console.log('[history] Query result:', readings?.length ?? 0, 'readings, error:', readingsError?.message);

	if (readingsError) throw error(500, readingsError.message);

	const imagePaths: Array<string | null> = [];
	for (const reading of readings ?? []) {
		const items = reading.reading_items ?? [];
		for (const item of items) {
			const snapshot = item.snapshot as any;
			// Soportar nuevo formato (card_image_path) y antiguo (card.image_path)
			imagePaths.push(snapshot?.card_image_path ?? snapshot?.card?.image_path ?? null);
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
