import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	if (privateEnv.DEMO_MODE === '1') {
		return { person: null, readings: [] };
	}

	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');
	if (!locals.workspaceId) redirect(303, '/app');

	console.log('[profile detail] Loading person:', params.personId, 'workspace:', locals.workspaceId, 'user:', user.id);

	const { data: person, error: personError } = await locals.supabase
		.from('persons')
		.select('id, name, tags, notes, created_at')
		.eq('id', params.personId)
		.eq('workspace_id', locals.workspaceId)
		.eq('created_by_user_id', user.id)
		.single();

	console.log('[profile detail] Result:', person?.name ?? 'NOT FOUND', 'error:', personError?.message ?? 'none');

	if (personError || !person) throw error(404, 'Perfil no encontrado');

	const { data: readings, error: readingsError } = await locals.supabase
		.from('readings')
		.select('id, created_at, spreads(name, card_count)')
		.eq('owner_person_id', params.personId)
		.order('created_at', { ascending: false })
		.limit(30);

	if (readingsError) throw error(500, readingsError.message);

	return { person, readings: readings ?? [] };
};

export const actions = {
	delete: async ({ locals, params }) => {
		if (privateEnv.DEMO_MODE === '1') {
			redirect(303, '/app/profiles');
		}

		const { user } = await locals.safeGetSession();
		if (!user) redirect(303, '/login');
		if (!locals.workspaceId) redirect(303, '/app');

		await locals.supabase
			.from('persons')
			.update({ archived: true })
			.eq('id', params.personId)
			.eq('workspace_id', locals.workspaceId)
			.eq('created_by_user_id', user.id);

		redirect(303, '/app/profiles');
	}
};
