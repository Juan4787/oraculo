<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';

	let email = $state('');
	let password = $state('');
	let mode = $state<'signin' | 'signup'>('signin');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function submit() {
		loading = true;
		error = null;

		try {
			if (mode === 'signup') {
				const { error: signUpError } = await supabase.auth.signUp({ email, password });
				if (signUpError) throw signUpError;
			} else {
				const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
				if (signInError) throw signInError;
			}

			await goto('/app');
		} catch (e) {
			error = e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
		} finally {
			loading = false;
		}
	}
</script>

<main class="container-app flex min-h-dvh items-center justify-center py-10">
	<section class="surface w-full max-w-md p-6 sm:p-8">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold tracking-tight">Entrar</h1>
			<p class="text-sm text-zinc-600">Accedé a tu oráculo y a tu historial privado.</p>
		</header>

		<form
			class="mt-6 space-y-4"
			onsubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			<div class="space-y-2">
				<label class="text-sm font-medium text-zinc-800" for="email">Email</label>
				<input
					id="email"
					class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
				/>
			</div>

			<div class="space-y-2">
				<label class="text-sm font-medium text-zinc-800" for="password">Contraseña</label>
				<input
					id="password"
					class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
					type="password"
					autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
					minlength="6"
					required
					bind:value={password}
				/>
			</div>

			{#if error}
				<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
					{error}
				</div>
			{/if}

			<button
				class="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-soft outline-none transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-60"
				disabled={loading}
				type="submit"
			>
				{loading ? 'Ingresando…' : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
			</button>
		</form>

		<div class="mt-5 flex items-center justify-between text-sm">
			<button
				class="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
				type="button"
				onclick={() => {
					mode = mode === 'signin' ? 'signup' : 'signin';
					error = null;
				}}
			>
				{mode === 'signin' ? '¿No tenés cuenta? Creala' : '¿Ya tenés cuenta? Entrá'}
			</button>

			<a class="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline" href="/">
				Inicio
			</a>
		</div>
	</section>
</main>
