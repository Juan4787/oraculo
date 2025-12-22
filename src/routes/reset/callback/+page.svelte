<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { createClient, type SupabaseClient } from '@supabase/supabase-js';
	import { env } from '$env/dynamic/public';

	let status = $state<'loading' | 'ready' | 'success' | 'error'>('loading');
	let message = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let supabase: SupabaseClient | null = null;

	const initSessionFromHash = async () => {
		if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) {
			status = 'error';
			message = 'Falta configurar PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.';
			return;
		}

		const hash = window.location.hash.replace(/^#/, '');
		const params = new URLSearchParams(hash);
		const accessToken = params.get('access_token');
		const refreshToken = params.get('refresh_token');
		const type = params.get('type');

		if (!accessToken || !refreshToken) {
			status = 'error';
			message = 'El enlace es inválido o expiró. Volvé a solicitarlo.';
			return;
		}
		if (type && type !== 'recovery') {
			status = 'error';
			message = 'El enlace de recuperación no es válido.';
			return;
		}

		supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
			auth: {
				persistSession: false,
				autoRefreshToken: false
			}
		});

		const { error } = await supabase.auth.setSession({
			access_token: accessToken,
			refresh_token: refreshToken
		});

		if (error) {
			status = 'error';
			message = 'No pudimos validar el enlace. Pedí uno nuevo.';
			return;
		}

		window.history.replaceState({}, '', window.location.pathname);
		status = 'ready';
	};

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		if (!supabase) {
			status = 'error';
			message = 'No pudimos iniciar la sesión de recuperación.';
			return;
		}
		if (!password || password.length < 6) {
			message = 'La contraseña debe tener al menos 6 caracteres.';
			return;
		}
		if (password !== confirmPassword) {
			message = 'Las contraseñas no coinciden.';
			return;
		}

		const { error } = await supabase.auth.updateUser({ password });
		if (error) {
			const msg = error.message?.toLowerCase() ?? '';
			if (
				msg.includes('same password') ||
				msg.includes('same as the old password') ||
				msg.includes('new password should be different') ||
				msg.includes('password should be different')
			) {
				await supabase.auth.signOut();
				status = 'success';
				return;
			}
			message = 'No pudimos actualizar la contraseña. Intentá de nuevo.';
			return;
		}

		await supabase.auth.signOut();
		status = 'success';
	};

	onMount(async () => {
		if (!browser) return;
		await initSessionFromHash();
	});
</script>

<main class="container-app flex min-h-dvh items-center justify-center py-10">
	<section class="surface w-full max-w-md p-6 sm:p-8">
		<header class="space-y-2 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Nueva clave</p>
			<h1 class="text-2xl font-semibold tracking-tight">Restablecer contraseña</h1>
			<p class="text-sm text-zinc-600">Elegí una nueva contraseña para tu cuenta.</p>
		</header>

		{#if status === 'loading'}
			<p class="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
				Validando enlace...
			</p>
		{:else if status === 'error'}
			<div class="mt-6 space-y-3">
				<p class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
					{message}
				</p>
				<a class="text-sm font-semibold text-zinc-700 hover:underline" href="/reset">
					Volver a recuperar contraseña
				</a>
			</div>
		{:else if status === 'success'}
			<div class="mt-6 space-y-4">
				<p class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
					Contraseña actualizada correctamente.
				</p>
				<a class="cta-glow inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-semibold" href="/login">
					Volver a ingresar
				</a>
			</div>
		{:else}
			<form class="mt-6 space-y-4" onsubmit={handleSubmit}>
				<div class="space-y-2">
					<label class="text-sm font-medium text-zinc-800" for="password">Nueva contraseña</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-16 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
							placeholder="Mínimo 6 caracteres"
							bind:value={password}
							autocomplete="new-password"
							required
						/>
						<button
							type="button"
							class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
							onclick={() => (showPassword = !showPassword)}
						>
							{showPassword ? 'Ocultar' : 'Ver'}
						</button>
					</div>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-zinc-800" for="confirm">Confirmar contraseña</label>
					<input
						id="confirm"
						type={showPassword ? 'text' : 'password'}
						class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
						placeholder="Repetí tu contraseña"
						bind:value={confirmPassword}
						autocomplete="new-password"
						required
					/>
				</div>

				{#if message}
					<p class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
						{message}
					</p>
				{/if}

				<button class="cta-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold" type="submit">
					Guardar nueva contraseña
				</button>
			</form>
		{/if}
	</section>
</main>
