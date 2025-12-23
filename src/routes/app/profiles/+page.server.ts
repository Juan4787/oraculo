import { env as privateEnv } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

type PersonRow = {
	id: string;
	name: string;
	tags: string[];
	archived: boolean;
	created_at: string;
	_count?: number;
};

export const load = async ({ locals, url }) => {
	if (privateEnv.DEMO_MODE === '1') {
		return { persons: [], q: '' };
	}

	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');
	if (!locals.workspaceId) redirect(303, '/app');

	console.log('[profiles] userId:', user.id, 'workspaceId:', locals.workspaceId);

	const q = url.searchParams.get('q')?.trim() ?? '';

	const { data: persons, error: personsError } = await locals.supabase
		.from('persons')
		.select('id, name, tags, archived, created_at')
		.eq('workspace_id', locals.workspaceId)
		.eq('created_by_user_id', user.id)
		.eq('archived', false)
		.order('created_at', { ascending: false });
	
	console.log('[profiles] query result:', persons?.length ?? 0, 'profiles, error:', personsError?.message ?? 'none');

	if (personsError) throw error(500, personsError.message);

	// Get reading counts for each person
	const personsWithCounts = await Promise.all(
		(persons ?? []).map(async (person: PersonRow) => {
			const { count } = await locals.supabase
				.from('readings')
				.select('*', { count: 'exact', head: true })
				.eq('owner_person_id', person.id);
			return { ...person, _count: count ?? 0 };
		})
	);

	return { persons: personsWithCounts, q };
};
