import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { getDemoPersons } from '$lib/demo-data';

type PersonRow = {
	id: string;
	name: string;
	tags: string[];
	archived: boolean;
	created_at: string;
};

export const load = async ({ locals, url }) => {
	if (privateEnv.DEMO_MODE === '1') {
		const q = url.searchParams.get('q')?.trim() ?? '';
		const persons = getDemoPersons().filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
		return { persons, q };
	}

	if (!locals.workspaceId) redirect(303, '/app/join');

	const q = url.searchParams.get('q')?.trim() ?? '';

	let query = locals.supabase
		.from('persons')
		.select('id, name, tags, archived, created_at')
		.eq('workspace_id', locals.workspaceId)
		.eq('archived', false)
		.order('created_at', { ascending: false });

	if (q) query = query.ilike('name', `%${q}%`);

	const { data, error: personsError } = await query.returns<PersonRow[]>();
	if (personsError) throw error(500, personsError.message);

	return { persons: data ?? [], q };
};
