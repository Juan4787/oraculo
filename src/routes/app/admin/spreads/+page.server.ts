import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

type SpreadRow = {
	id: string;
	name: string;
	card_count: number;
	status: 'draft' | 'published';
};

type PositionRow = {
	spread_id: string;
	position_index: number;
	title: string;
};

export const load = async ({ locals }) => {
	if (privateEnv.DEMO_MODE === '1') {
		return {
			spreads: [
				{ id: 'spread-1', name: '1 carta', card_count: 1, status: 'published' },
				{ id: 'spread-3', name: '3 cartas', card_count: 3, status: 'published' }
			],
			positionsBySpread: {
				'spread-1': [{ spread_id: 'spread-1', position_index: 1, title: 'Mensaje' }],
				'spread-3': [
					{ spread_id: 'spread-3', position_index: 1, title: 'Pasado' },
					{ spread_id: 'spread-3', position_index: 2, title: 'Presente' },
					{ spread_id: 'spread-3', position_index: 3, title: 'Futuro' }
				]
			}
		};
	}

	if (!locals.workspaceId) redirect(303, '/app');

	const { data: spreads, error: spreadsError } = await locals.supabase
		.from('spreads')
		.select('id, name, card_count, status')
		.eq('workspace_id', locals.workspaceId)
		.order('card_count', { ascending: true })
		.returns<SpreadRow[]>();

	if (spreadsError) throw error(500, spreadsError.message);

	const spreadIds = (spreads ?? []).map((s) => s.id);
	let positions: PositionRow[] = [];

	if (spreadIds.length) {
		const { data: posData, error: posError } = await locals.supabase
			.from('spread_positions')
			.select('spread_id, position_index, title')
			.in('spread_id', spreadIds)
			.order('position_index', { ascending: true })
			.returns<PositionRow[]>();

		if (posError) throw error(500, posError.message);
		positions = posData ?? [];
	}

	const positionsBySpread: Record<string, PositionRow[]> = {};
	for (const p of positions) {
		positionsBySpread[p.spread_id] ??= [];
		positionsBySpread[p.spread_id].push(p);
	}

	return { spreads: spreads ?? [], positionsBySpread };
};
