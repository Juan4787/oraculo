import { env } from '$env/dynamic/private';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

let adminClient: SupabaseClient<Database> | null = null;

export const getSupabaseAdminClient = () => {
	if (adminClient) return adminClient;

	const supabaseUrl = env.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error(
			'Faltan env vars PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para usar el admin client.'
		);
	}

	adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});

	return adminClient;
};
