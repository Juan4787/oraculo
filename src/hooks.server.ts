import type { Database } from '$lib/database.types';
import { getSupabaseAdminClient } from '$lib/server/supabase-admin';
import type { Workspace, WorkspaceRole } from '$lib/types';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env } from '$env/dynamic/public';

type MembershipRow = {
	workspace_id: string;
	role: WorkspaceRole;
	workspaces: Workspace | null;
};

export const handle: Handle = async ({ event, resolve }) => {
	const supabaseUrl = env.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Faltan env vars PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY. Copiá `.env.example` a `.env` y completalo.'
		);
	}

	event.locals.supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session },
			error
		} = await event.locals.supabase.auth.getSession();

		if (error || !session) return { session: null, user: null };
		return { session, user: session.user };
	};

	event.locals.workspaceId = null;
	event.locals.workspaceRole = null;
	event.locals.workspace = null;

	// Demo mode: bypass auth + workspace when DEMO_MODE=1 (solo para ver la UI sin Supabase)
	if (privateEnv.DEMO_MODE === '1') {
		event.locals.workspaceId = 'demo-workspace';
		event.locals.workspaceRole = 'owner';
		event.locals.workspace = { id: 'demo-workspace', name: 'Oráculo Demo', slug: 'demo' };
		event.locals.safeGetSession = async () => ({
			session: { user: { id: 'demo-user' } } as any,
			user: { id: 'demo-user', email: 'demo@demo.com' } as any
		});
	} else if (event.url.pathname.startsWith('/app')) {
		const { session, user } = await event.locals.safeGetSession();
		if (session && user) {
			let { data: memberships, error } = await event.locals.supabase
				.from('workspace_members')
				.select('workspace_id, role, workspaces(id, name, slug)')
				.eq('user_id', user.id)
				.returns<MembershipRow[]>();

			if (error) throw error;

			const isMasterRoute = event.url.pathname.startsWith('/app/master');
			if (!memberships?.length && !isMasterRoute) {
				const admin = getSupabaseAdminClient();
				const { data: workspace, error: workspaceError } = await admin
					.from('workspaces')
					.insert({ name: 'Oráculo' })
					.select('id, name, slug')
					.single();

				if (workspaceError || !workspace) {
					throw workspaceError ?? new Error('No se pudo crear el workspace.');
				}

				const { error: memberError } = await admin.from('workspace_members').insert({
					workspace_id: workspace.id,
					user_id: user.id,
					role: 'owner'
				});

				if (memberError) throw memberError;

				memberships = [
					{
						workspace_id: workspace.id,
						role: 'owner',
						workspaces: workspace
					}
				];

				event.cookies.set('active_workspace_id', workspace.id, {
					path: '/',
					sameSite: 'lax'
				});
			}

			const activeWorkspaceId = event.cookies.get('active_workspace_id') ?? null;
			const activeMembership =
				(memberships?.find((m) => m.workspace_id === activeWorkspaceId) ?? memberships?.[0]) ?? null;

			const resolvedWorkspaceId = activeMembership?.workspace_id ?? null;
			if (resolvedWorkspaceId && resolvedWorkspaceId !== activeWorkspaceId) {
				event.cookies.set('active_workspace_id', resolvedWorkspaceId, {
					path: '/',
					sameSite: 'lax'
				});
			}

			event.locals.workspaceId = resolvedWorkspaceId;
			event.locals.workspaceRole = activeMembership?.role ?? null;
			event.locals.workspace = activeMembership?.workspaces ?? null;
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};
