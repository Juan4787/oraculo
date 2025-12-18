import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from '$lib/database.types';

if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error(
		'Faltan env vars PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY. Copiá `.env.example` a `.env` y completalo.'
	);
}

export const supabase = createBrowserClient<Database>(
	env.PUBLIC_SUPABASE_URL,
	env.PUBLIC_SUPABASE_ANON_KEY
);
