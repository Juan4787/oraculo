import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');

	const { data: memberships, error } = await locals.supabase
		.from('workspace_members')
		.select('workspace_id')
		.eq('user_id', user.id)
		.limit(1);

	if (error) throw error;
	if (memberships?.length) redirect(303, '/app');
};

export const actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const accessCode = String(form.get('access_code') ?? '').trim();

		if (!accessCode) return fail(400, { message: 'Ingresá un código de acceso.' });

		const { data, error } = await locals.supabase.rpc('redeem_access_code', {
			access_code: accessCode
		});

		if (error) return fail(400, { message: error.message });
		if (!data?.length) return fail(400, { message: 'Código inválido.' });

		redirect(303, '/app');
	}
};

