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

	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');
	if (!locals.workspaceId) redirect(303, '/app');

	const personId = url.searchParams.get('personId');
	const isAdmin = locals.workspaceRole === 'owner' || locals.workspaceRole === 'staff';

	console.log('[new-reading] personId from URL:', personId, 'user:', user.id);

	let person: { id: string; name: string } | null = null;
	if (personId) {
		// Allow users to create readings for their own profiles
		const { data, error: personError } = await locals.supabase
			.from('persons')
			.select('id, name, created_by_user_id')
			.eq('id', personId)
			.eq('workspace_id', locals.workspaceId)
			.eq('archived', false)
			.maybeSingle();

		console.log('[new-reading] Person lookup result:', data?.name ?? 'NOT FOUND', 'created_by:', data?.created_by_user_id);

		if (personError) throw error(500, personError.message);
		if (!data) throw error(404, 'Persona no encontrada');
		
		// Check if user owns this profile or is admin
		const isOwner = data.created_by_user_id === user.id;
		console.log('[new-reading] isOwner:', isOwner, 'isAdmin:', isAdmin);
		if (!isOwner && !isAdmin) redirect(303, '/app');
		
		person = { id: data.id, name: data.name };
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
