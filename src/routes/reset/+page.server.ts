import { env as privateEnv } from '$env/dynamic/private';
import { isEmailEnabled } from '$lib/server/allowed-emails';
import { isMasterEmail } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		if (privateEnv.DEMO_MODE === '1') {
			return fail(400, { message: 'No disponible en modo demo' });
		}

		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();

		if (!email) {
			return fail(400, { message: 'Ingresá un email válido', email });
		}

		if (!isMasterEmail(email)) {
			try {
				const allowed = await isEmailEnabled(locals.supabase, email);
				if (!allowed) {
					return fail(400, {
						message: 'Ese email no está habilitado para recuperar contraseña.',
						email
					});
				}
			} catch (error) {
				console.error('Error validando email habilitado', error);
				return fail(500, {
					message: 'Falta configurar el control de emails habilitados en Supabase.',
					email
				});
			}
		}

		const redirectTo = privateEnv.PUBLIC_SITE_URL
			? `${privateEnv.PUBLIC_SITE_URL}/reset/callback`
			: `${url.origin}/reset/callback`;

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, { redirectTo });

		if (error) {
			console.error('Error reset password', error);
			return fail(500, { message: 'No pudimos enviar el correo. Intentá de nuevo.', email });
		}

		return { success: true, email };
	}
};
