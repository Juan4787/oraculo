import { env as privateEnv } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (privateEnv.DEMO_MODE === '1') {
		return {};
	}
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');
	if (!locals.workspaceId) redirect(303, '/app');
	return {};
};

export const actions = {
	default: async ({ locals, request }) => {
		if (privateEnv.DEMO_MODE === '1') {
			return { success: true };
		}

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'No autenticado' });
		if (!locals.workspaceId) return fail(400, { message: 'Sin workspace' });

		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();

		if (!name) return fail(400, { message: 'El nombre es requerido' });

		// Check if name already exists for this user
		const { data: existing } = await locals.supabase
			.from('persons')
			.select('id')
			.eq('created_by_user_id', user.id)
			.eq('name', name)
			.eq('archived', false)
			.maybeSingle();

		if (existing) return fail(400, { message: 'Ya tenés un perfil con ese nombre' });

		const { data, error } = await locals.supabase
			.from('persons')
			.insert({
				workspace_id: locals.workspaceId,
				created_by_user_id: user.id,
				name,
				tags: []
			})
			.select('id')
			.single();

		if (error) return fail(500, { message: error.message });

		redirect(303, `/app/profiles/${data.id}`);
	}
};
