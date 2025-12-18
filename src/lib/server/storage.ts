import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

export async function createSignedUrlMap(
	supabase: SupabaseClient<Database>,
	bucket: string,
	paths: Array<string | null | undefined>,
	expiresInSeconds = 60 * 60
) {
	const uniquePaths = Array.from(
		new Set(paths.filter((p): p is string => typeof p === 'string' && p.trim().length > 0))
	);

	if (!uniquePaths.length) return {};

	const { data, error } = await supabase.storage.from(bucket).createSignedUrls(uniquePaths, expiresInSeconds);
	if (error || !data) return {};

	const result: Record<string, string> = {};
	for (const item of data) {
		if (item?.path && item?.signedUrl) result[item.path] = item.signedUrl;
	}

	return result;
}

