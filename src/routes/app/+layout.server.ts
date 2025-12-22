import { env as privateEnv } from '$env/dynamic/private';
import { isMasterEmail } from '$lib/server/auth';
import type { WorkspaceRole } from '$lib/types';
import { redirect } from '@sveltejs/kit';

type MembershipRow = {
	workspace_id: string;
	role: WorkspaceRole;
	workspaces: { id: string; name: string; slug: string | null } | null;
};

export const load = async ({ locals, url, cookies }) => {
	if (privateEnv.DEMO_MODE === '1') {
		locals.workspaceId = 'demo-workspace';
		locals.workspaceRole = 'owner';
		return {
			user: { id: 'demo-user', email: 'demo@demo.com' },
			workspace: { id: 'demo-workspace', name: 'Oráculo Demo', slug: 'demo' },
			role: 'owner' as WorkspaceRole,
			isMaster: false
		};
	}

	const { session, user } = await locals.safeGetSession();
	if (!session || !user) redirect(303, '/login');

	const isMaster = isMasterEmail(user.email);

	const { data: memberships, error } = await locals.supabase
		.from('workspace_members')
		.select('workspace_id, role, workspaces(id, name, slug)')
		.eq('user_id', user.id)
		.returns<MembershipRow[]>();

	if (error) throw error;

	const activeWorkspaceId = cookies.get('active_workspace_id') ?? null;
	const activeMembership =
		memberships?.find((m) => m.workspace_id === activeWorkspaceId) ?? memberships?.[0] ?? null;

	const isMasterRoute = url.pathname.startsWith('/app/master');
	if (!activeMembership && url.pathname !== '/app/join' && !isMasterRoute) {
		redirect(303, '/app/join');
	}

	locals.workspaceId = activeMembership?.workspace_id ?? null;
	locals.workspaceRole = activeMembership?.role ?? null;

	return {
		user: { id: user.id, email: user.email ?? '' },
		workspace: activeMembership?.workspaces ?? null,
		role: activeMembership?.role ?? null,
		isMaster
	};
};
