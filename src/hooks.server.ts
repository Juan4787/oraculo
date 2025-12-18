import type { Database } from '$lib/database.types';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env } from '$env/dynamic/public';

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

	// Demo mode: bypass auth + workspace when DEMO_MODE=1 (solo para ver la UI sin Supabase)
	if (privateEnv.DEMO_MODE === '1') {
		event.locals.workspaceId = 'demo-workspace';
		event.locals.workspaceRole = 'owner';
		event.locals.safeGetSession = async () => ({
			session: { user: { id: 'demo-user' } } as any,
			user: { id: 'demo-user', email: 'demo@demo.com' } as any
		});
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};
