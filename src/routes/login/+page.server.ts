import { env as privateEnv } from '$env/dynamic/private';
import { isEmailEnabled } from '$lib/server/allowed-emails';
import { isMasterEmail, MASTER_EMAIL } from '$lib/server/auth';
import { getSupabaseAdminClient } from '$lib/server/supabase-admin';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (session) redirect(303, '/app');
	return {};
};

const validateEmailAccess = async (locals: App.Locals, email: string, intent: string) => {
	if (isMasterEmail(email)) return { allowed: true };

	try {
		const allowed = await isEmailEnabled(locals.supabase, email);
		if (!allowed) {
			return {
				allowed: false,
				result: fail(403, {
					intent,
					email,
					message: 'Este email no está habilitado. Pedile acceso al administrador.'
				})
			};
		}
		return { allowed: true };
	} catch (error) {
		console.error('Error validando email habilitado', error);
		return {
			allowed: false,
			result: fail(500, {
				intent,
				email,
				message: 'Falta configurar el control de emails habilitados en Supabase.'
			})
		};
	}
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		if (privateEnv.DEMO_MODE === '1') {
			redirect(303, '/app');
		}

		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { intent: 'login', message: 'Completá email y contraseña', email });
		}

		const access = await validateEmailAccess(locals, email, 'login');
		if (!access.allowed) return access.result;

		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error || !data.session) {
			console.error('Error login Supabase', { email, error });
			const msg = error?.message?.toLowerCase() ?? '';
			if ((error as any)?.code === 'email_provider_disabled' || msg.includes('email logins are disabled')) {
				return fail(400, {
					intent: 'login',
					message:
						'En Supabase está desactivado el login por email. Activá "Email" en Authentication → Providers → Email.',
					email
				});
			}
			if (msg.includes('email not confirmed')) {
				return fail(400, {
					intent: 'login',
					message:
						'Tu email no está confirmado en Supabase. Confirmalo o desactivá la confirmación de email.',
					email
				});
			}
			if (msg.includes('invalid api key') || msg.includes('invalid jwt') || msg.includes('jwt')) {
				return fail(400, {
					intent: 'login',
					message: 'Configuración de Supabase inválida. Revisá URL y ANON KEY.',
					email
				});
			}
			return fail(400, { intent: 'login', message: 'Credenciales inválidas', email });
		}

		if (isMasterEmail(email)) {
			redirect(303, '/app/master');
		}

		redirect(303, '/app');
	},
	register: async ({ request, locals }) => {
		if (privateEnv.DEMO_MODE === '1') {
			return fail(400, { intent: 'register', message: 'Registro no disponible en modo demo' });
		}

		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { intent: 'register', message: 'Completá email y contraseña', email });
		}
		if (password.length < 6) {
			return fail(400, {
				intent: 'register',
				message: 'La contraseña debe tener al menos 6 caracteres',
				email
			});
		}
		if (isMasterEmail(email)) {
			return fail(400, {
				intent: 'register',
				message: `El email maestro (${MASTER_EMAIL || 'no configurado'}) no se registra acá.`,
				email
			});
		}

		const access = await validateEmailAccess(locals, email, 'register');
		if (!access.allowed) return access.result;

		let adminClient;
		try {
			adminClient = getSupabaseAdminClient();
		} catch (error) {
			console.error('Admin client no configurado', error);
			return fail(500, {
				intent: 'register',
				message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para crear cuentas.',
				email
			});
		}

		const { error: createError } = await adminClient.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (createError) {
			console.error('Error registro Supabase (admin)', { email, createError });
			const msg = createError.message?.toLowerCase() ?? '';
			if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
				return fail(400, {
					intent: 'register',
					message: 'El email ya está registrado. Ingresá con tu contraseña.',
					email
				});
			}
			return fail(400, {
				intent: 'register',
				message: 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.',
				email
			});
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error || !data.session) {
			console.error('Error login post-registro', { email, error });
			return fail(400, {
				intent: 'register',
				message: 'La cuenta se creó pero no pudimos iniciar sesión automáticamente.',
				email
			});
		}

		redirect(303, '/app');
	}
};
