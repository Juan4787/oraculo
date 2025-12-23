import { env as privateEnv } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';

type DeckRow = {
	id: string;
	name: string;
	description: string | null;
	status: 'draft' | 'published';
	created_at: string;
};

export const load = async ({ locals }) => {
	if (privateEnv.DEMO_MODE === '1') {
		return { decks: [] };
	}

	if (!locals.workspaceId) redirect(303, '/app');

	const { data: decks, error: decksError } = await locals.supabase
		.from('decks')
		.select('id, name, description, status, created_at')
		.eq('workspace_id', locals.workspaceId)
		.order('created_at', { ascending: false })
		.returns<DeckRow[]>();

	if (decksError) throw error(500, decksError.message);

	return { decks: decks ?? [] };
};

export const actions = {
	create: async ({ locals, request }) => {
		if (privateEnv.DEMO_MODE === '1') {
			return fail(400, { message: 'Modo demo: no se guardan mazos.' });
		}

		if (!locals.workspaceId) redirect(303, '/app');

		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const status = (String(form.get('status') ?? 'draft') as 'draft' | 'published') || 'draft';

		if (!name) return fail(400, { message: 'El nombre del mazo es obligatorio.' });

		const { error: insertError } = await locals.supabase.from('decks').insert({
			workspace_id: locals.workspaceId,
			name,
			description: description || null,
			status
		});

		if (insertError) return fail(400, { message: insertError.message });
		return { ok: true };
	},
	toggle: async ({ locals, request }) => {
		if (privateEnv.DEMO_MODE === '1') {
			return fail(400, { message: 'Modo demo: no se guardan cambios.' });
		}

		if (!locals.workspaceId) redirect(303, '/app');

		const form = await request.formData();
		const deckId = String(form.get('deck_id') ?? '').trim();
		const nextStatus = String(form.get('next_status') ?? '').trim() as 'draft' | 'published';

		if (!deckId || (nextStatus !== 'draft' && nextStatus !== 'published')) {
			return fail(400, { message: 'Acción inválida.' });
		}

		const { error: updateError } = await locals.supabase
			.from('decks')
			.update({ status: nextStatus })
			.eq('workspace_id', locals.workspaceId)
			.eq('id', deckId);

		if (updateError) return fail(400, { message: updateError.message });
		return { ok: true };
	}
};
