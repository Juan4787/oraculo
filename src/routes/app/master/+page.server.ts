import { getSupabaseAdminClient } from '$lib/server/supabase-admin';
import { isMasterEmail } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const requireMaster = async (locals: App.Locals) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) redirect(303, '/login');
	if (!isMasterEmail(user.email)) redirect(303, '/app');
	return user.email ?? '';
};

export const load: PageServerLoad = async ({ locals }) => {
	const masterEmail = await requireMaster(locals);
	let admin;
	try {
		admin = getSupabaseAdminClient();
	} catch (error) {
		console.error('Admin client no configurado', error);
		return {
			emails: [],
			loadError: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para leer los emails.',
			masterEmail
		};
	}

	const { data, error } = await admin
		.from('allowed_emails')
		.select('id, email, enabled, created_at, updated_at')
		.order('email', { ascending: true });

	if (error) {
		console.error('Error cargando emails habilitados', error);
		return { emails: [], loadError: 'No se pudo cargar la lista. Revisá Supabase.', masterEmail };
	}

	return { emails: data ?? [], masterEmail, loadError: null };
};

export const actions: Actions = {
	add_email: async ({ request, locals }) => {
		await requireMaster(locals);
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();

		if (!email || !email.includes('@')) {
			return fail(400, { intent: 'add_email', message: 'Ingresá un email válido.', email });
		}

		let admin;
		try {
			admin = getSupabaseAdminClient();
		} catch (error) {
			console.error('Admin client no configurado', error);
			return fail(500, {
				intent: 'add_email',
				message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para guardar emails.',
				email
			});
		}
		const { error } = await admin.from('allowed_emails').insert({ email, enabled: true });

		if (error) {
			console.error('Error creando email habilitado', error);
			const msg = error.message?.toLowerCase() ?? '';
			if (msg.includes('duplicate') || msg.includes('unique')) {
				return fail(409, { intent: 'add_email', message: 'Ese email ya existe en la lista.', email });
			}
			return fail(500, { intent: 'add_email', message: 'No pudimos guardar el email.', email });
		}

		return { success: true, intent: 'add_email' };
	},
	enable_email: async ({ request, locals }) => {
		await requireMaster(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const email = String(form.get('email') ?? '').trim().toLowerCase();

		if (!id) {
			return fail(400, { intent: 'enable_email', message: 'Email inválido.' });
		}

		let admin;
		try {
			admin = getSupabaseAdminClient();
		} catch (error) {
			console.error('Admin client no configurado', error);
			return fail(500, {
				intent: 'enable_email',
				message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para actualizar emails.'
			});
		}
		const { error } = await admin.from('allowed_emails').update({ enabled: true }).eq('id', id);

		if (error) {
			console.error('Error habilitando email', error);
			return fail(500, { intent: 'enable_email', message: 'No pudimos habilitar el email.' });
		}

		return { success: true, intent: 'enable_email', id, email };
	},
	disable_email: async ({ request, locals }) => {
		await requireMaster(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const confirm = String(form.get('confirm') ?? '').trim().toLowerCase();

		if (!id) {
			return fail(400, { intent: 'disable_email', message: 'Email inválido.', id, email });
		}
		if (isMasterEmail(email)) {
			return fail(400, {
				intent: 'disable_email',
				message: 'No podés deshabilitar el email maestro desde acá.',
				id,
				email
			});
		}
		if (confirm !== 'deshabilitar') {
			return fail(400, {
				intent: 'disable_email',
				message: 'Escribí “deshabilitar” para confirmar.',
				id,
				email
			});
		}

		let admin;
		try {
			admin = getSupabaseAdminClient();
		} catch (error) {
			console.error('Admin client no configurado', error);
			return fail(500, {
				intent: 'disable_email',
				message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para actualizar emails.',
				id,
				email
			});
		}
		const { error } = await admin.from('allowed_emails').update({ enabled: false }).eq('id', id);

		if (error) {
			console.error('Error deshabilitando email', error);
			return fail(500, { intent: 'disable_email', message: 'No pudimos deshabilitar el email.', id, email });
		}

		return { success: true, intent: 'disable_email', id, email };
	},
	delete_email: async ({ request, locals }) => {
		await requireMaster(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const confirm = String(form.get('confirm') ?? '').trim().toLowerCase();

		if (!id) {
			return fail(400, { intent: 'delete_email', message: 'Email inválido.', id, email });
		}
		if (isMasterEmail(email)) {
			return fail(400, {
				intent: 'delete_email',
				message: 'No podés eliminar el email maestro desde acá.',
				id,
				email
			});
		}
		if (confirm !== 'eliminar') {
			return fail(400, {
				intent: 'delete_email',
				message: 'Escribí “eliminar” para confirmar.',
				id,
				email
			});
		}

		let admin;
		try {
			admin = getSupabaseAdminClient();
		} catch (error) {
			console.error('Admin client no configurado', error);
			return fail(500, {
				intent: 'delete_email',
				message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para eliminar emails.',
				id,
				email
			});
		}
		const { error } = await admin.from('allowed_emails').delete().eq('id', id);

		if (error) {
			console.error('Error eliminando email', error);
			return fail(500, { intent: 'delete_email', message: 'No pudimos eliminar el email.', id, email });
		}

		return { success: true, intent: 'delete_email', id, email };
	}
};
