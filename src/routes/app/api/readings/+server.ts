import { env as privateEnv } from '$env/dynamic/private';
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

	const isAdmin = locals.workspaceRole === 'owner' || locals.workspaceRole === 'staff';
	const ownerType = personId ? 'person' : 'user';

	if (ownerType === 'person' && !isAdmin) return json({ message: 'No autorizado' }, { status: 403 });

	const { data, error } = await locals.supabase.rpc('create_reading', {
		workspace_id: locals.workspaceId,
		spread_id: spreadId,
		owner_type: ownerType,
		owner_person_id: personId,
		selected_deck_ids: deckId ? [deckId] : null
	});

	if (error) return json({ message: error.message }, { status: 400 });
	
	// La función devuelve UUID directo, no array
	const readingId = typeof data === 'string' ? data : data?.[0]?.reading_id ?? data;
	if (!readingId) return json({ message: 'No se pudo crear la lectura' }, { status: 500 });

	return json({ readingId });
};
