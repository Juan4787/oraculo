import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const isAdmin = locals.workspaceRole === 'owner' || locals.workspaceRole === 'staff';
	if (!isAdmin) redirect(303, '/app');
};

