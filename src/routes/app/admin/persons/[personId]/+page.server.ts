import { env as privateEnv } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';
import { createSignedUrlMap } from '$lib/server/storage';
import { archiveDemoPerson, findDemoPerson, updateDemoPerson } from '$lib/demo-data';

type PersonRow = {
	id: string;
	name: string;
	notes: string | null;
	tags: string[];
	archived: boolean;
};

type ReadingRow = {
	id: string;
	created_at: string;
	spreads: { name: string; card_count: number } | null;
	reading_items: Array<{ position_index: number; snapshot: any }> | null;
};

export const load = async ({ locals, params }) => {
	if (privateEnv.DEMO_MODE === '1') {
		const demo = findDemoPerson(params.personId) ?? {
			id: params.personId,
			name: 'Persona demo',
			notes: 'Notas privadas',
			tags: ['demo'],
			archived: false
		};
		return {
			person: demo,
			readings: [],
			signedUrls: {}
		};
	}

	if (!locals.workspaceId) redirect(303, '/app/join');

	const { data: person, error: personError } = await locals.supabase
		.from('persons')
		.select('id, name, notes, tags, archived')
		.eq('workspace_id', locals.workspaceId)
		.eq('id', params.personId)
		.maybeSingle()
		.returns<PersonRow>();

	if (personError) throw error(500, personError.message);
	if (!person) throw error(404, 'Persona no encontrada');

	const { data: readings, error: readingsError } = await locals.supabase
		.from('readings')
		.select('id, created_at, spreads(name, card_count), reading_items(position_index, snapshot)')
		.eq('owner_type', 'person')
		.eq('owner_person_id', person.id)
		.order('created_at', { ascending: false })
		.limit(20)
		.returns<ReadingRow[]>();

	if (readingsError) throw error(500, readingsError.message);

	const imagePaths: Array<string | null> = [];
	for (const reading of readings ?? []) {
		for (const item of reading.reading_items ?? []) {
			imagePaths.push(item.snapshot?.card?.image_path ?? null);
		}
	}
	const signedUrls = await createSignedUrlMap(locals.supabase, 'card_images', imagePaths);

	return { person, readings: readings ?? [], signedUrls };
};

export const actions = {
	update: async ({ locals, params, request }) => {
		if (privateEnv.DEMO_MODE === '1') {
			const form = await request.formData();
			const name = String(form.get('name') ?? '').trim();
			const notes = String(form.get('notes') ?? '').trim();
			const tagsRaw = String(form.get('tags') ?? '').trim();
			if (!name) return fail(400, { message: 'El nombre/alias es obligatorio.' });
			const tags = tagsRaw
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)
				.slice(0, 20);
			updateDemoPerson(params.personId, { name, notes: notes || null, tags });
			return { ok: true };
		}

		if (!locals.workspaceId) redirect(303, '/app/join');
		const form = await request.formData();

		const name = String(form.get('name') ?? '').trim();
		const notes = String(form.get('notes') ?? '').trim();
		const tagsRaw = String(form.get('tags') ?? '').trim();

		if (!name) return fail(400, { message: 'El nombre/alias es obligatorio.' });

		const tags = tagsRaw
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
			.slice(0, 20);

		const { error: updateError } = await locals.supabase
			.from('persons')
			.update({ name, notes: notes || null, tags })
			.eq('workspace_id', locals.workspaceId)
			.eq('id', params.personId);

		if (updateError) return fail(400, { message: updateError.message });
		return { ok: true };
	},
	archive: async ({ locals, params }) => {
		if (privateEnv.DEMO_MODE === '1') {
			archiveDemoPerson(params.personId);
			redirect(303, '/app/admin/persons');
		}

		if (!locals.workspaceId) redirect(303, '/app/join');

		const { error: archiveError } = await locals.supabase
			.from('persons')
			.update({ archived: true })
			.eq('workspace_id', locals.workspaceId)
			.eq('id', params.personId);

		if (archiveError) return fail(400, { message: archiveError.message });
		redirect(303, '/app/admin/persons');
	}
};
