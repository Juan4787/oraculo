import { env as privateEnv } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';
import { addDemoPerson } from '$lib/demo-data';

export const actions = {
	default: async ({ locals, request }) => {
		if (privateEnv.DEMO_MODE === '1') {
			const form = await request.formData();
			const name = String(form.get('name') ?? '').trim();
			const notes = String(form.get('notes') ?? '').trim();
			const tagsRaw = String(form.get('tags') ?? '').trim();

			if (!name) return fail(400, { message: 'El nombre/alias es obligatorio.' });

			const tags = tagsRaw
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)
				.slice(0, 20);

			const person = addDemoPerson({ name, notes: notes || null, tags });
			redirect(303, `/app/admin/persons/${person.id}`);
		}

		if (!locals.workspaceId) redirect(303, '/app/join');

		const { user } = await locals.safeGetSession();
		if (!user) redirect(303, '/login');

		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const notes = String(form.get('notes') ?? '').trim();
		const tagsRaw = String(form.get('tags') ?? '').trim();

		if (!name) return fail(400, { message: 'El nombre/alias es obligatorio.' });

		const tags = tagsRaw
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
			.slice(0, 20);

		const { data, error: insertError } = await locals.supabase
			.from('persons')
			.insert({
				workspace_id: locals.workspaceId,
				created_by_user_id: user.id,
				name,
				notes: notes || null,
				tags
			})
			.select('id')
			.maybeSingle();

		if (insertError) return fail(400, { message: insertError.message });
		if (!data?.id) throw error(500, 'No se pudo crear la persona');

		redirect(303, `/app/admin/persons/${data.id}`);
	}
};
