import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

export const isEmailEnabled = async (supabase: SupabaseClient<Database>, email: string) => {
	const normalized = email.trim().toLowerCase();
	const { data, error } = await supabase.rpc('is_email_enabled', { p_email: normalized });

	if (error) {
		throw error;
	}

	return Boolean(data);
};
