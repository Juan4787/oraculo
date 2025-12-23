import { isMasterEmail } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) redirect(303, '/login');

	const isMaster = isMasterEmail(user.email);

	return {
		user: { id: user.id, email: user.email ?? '' },
		workspace: locals.workspace ?? null,
		role: locals.workspaceRole ?? null,
		isMaster
	};
};
