import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { demoBackPool, demoDeck } from '$lib/demo-cards';

export const load = async ({ locals, url }) => {
	if (privateEnv.DEMO_MODE === '1') {
		return {
			person: null,
			spreads: [
				{ id: 'spread-1', name: '1 carta', card_count: 1 },
				{ id: 'spread-3', name: '3 cartas', card_count: 3 }
			],
			decks: [{ id: demoDeck.id, name: demoDeck.name }],
			role: 'owner' as const
		};
	}

	if (!locals.workspaceId) redirect(303, '/app');

	const personId = url.searchParams.get('personId');
	const isAdmin = locals.workspaceRole === 'owner' || locals.workspaceRole === 'staff';

	let person: { id: string; name: string } | null = null;
	if (personId) {
		if (!isAdmin) redirect(303, '/app');

		const { data, error: personError } = await locals.supabase
			.from('persons')
			.select('id, name')
			.eq('id', personId)
			.eq('workspace_id', locals.workspaceId)
			.eq('archived', false)
			.maybeSingle();

		if (personError) throw error(500, personError.message);
		if (!data) throw error(404, 'Persona no encontrada');
		person = data;
	}

	const { data: spreads, error: spreadsError } = await locals.supabase
		.from('spreads')
		.select('id, name, card_count')
		.eq('workspace_id', locals.workspaceId)
		.eq('status', 'published')
		.order('card_count', { ascending: true });

	if (spreadsError) throw error(500, spreadsError.message);

	const { data: decks, error: decksError } = await locals.supabase
		.from('decks')
		.select('id, name')
		.eq('workspace_id', locals.workspaceId)
		.eq('status', 'published')
		.order('name', { ascending: true });

	if (decksError) throw error(500, decksError.message);

	return {
		person,
		spreads: spreads ?? [],
		decks: decks ?? [],
		role: locals.workspaceRole
	};
};
