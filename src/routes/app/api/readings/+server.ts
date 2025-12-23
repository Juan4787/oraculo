import { env as privateEnv } from '$env/dynamic/private';
import { getSupabaseAdminClient } from '$lib/server/supabase-admin';
import { json } from '@sveltejs/kit';

export const POST = async ({ locals, request }) => {
	if (privateEnv.DEMO_MODE === '1') {
		return json({ readingId: crypto.randomUUID() });
	}

	const { user } = await locals.safeGetSession();
	if (!user) return json({ message: 'No autenticado' }, { status: 401 });
	if (!locals.workspaceId) return json({ message: 'Sin workspace' }, { status: 400 });

	const body = (await request.json().catch(() => null)) as
		| { spreadId?: string; deckId?: string | null; personId?: string | null }
		| null;

	const spreadId = body?.spreadId ?? null;
	if (!spreadId) return json({ message: 'Falta spreadId' }, { status: 400 });

	const deckId = body?.deckId ?? null;
	const personId = body?.personId ?? null;

	console.log('[readings API] personId received:', personId, 'spreadId:', spreadId);

	const isAdmin = locals.workspaceRole === 'owner' || locals.workspaceRole === 'staff';
	const ownerType = personId ? 'person' : 'user';

	// Verify user owns the profile if not admin
	if (ownerType === 'person' && !isAdmin) {
		const admin = getSupabaseAdminClient();
		const { data: person, error: personError } = await admin
			.from('persons')
			.select('created_by_user_id')
			.eq('id', personId)
			.single();

		console.log('[readings API] Ownership check - person:', person, 'error:', personError?.message, 'user.id:', user.id);

		if (!person || person.created_by_user_id !== user.id) {
			return json({ message: 'No autorizado para crear lecturas para personas' }, { status: 403 });
		}
	}

	console.log('[readings API] Calling create_reading RPC with:', { workspace_id: locals.workspaceId, spread_id: spreadId, owner_type: ownerType, owner_person_id: personId });

	const { data, error } = await locals.supabase.rpc('create_reading', {
		workspace_id: locals.workspaceId,
		spread_id: spreadId,
		owner_type: ownerType,
		owner_person_id: personId,
		selected_deck_ids: deckId ? [deckId] : null
	});

	console.log('[readings API] RPC result - data:', data, 'error:', error?.message);

	if (error) return json({ message: error.message }, { status: 400 });

	// La función devuelve UUID directo, no array
	const readingId = typeof data === 'string' ? data : data?.[0]?.reading_id ?? data;
	if (!readingId) return json({ message: 'No se pudo crear la lectura' }, { status: 500 });

	return json({ readingId });
};
