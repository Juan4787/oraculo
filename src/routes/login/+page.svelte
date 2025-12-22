<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let showPassword = $state(false);
	let mode = $state<'signin' | 'signup'>(form?.intent === 'register' ? 'signup' : 'signin');

	$effect(() => {
		if (form?.intent === 'register') mode = 'signup';
		if (form?.intent === 'login') mode = 'signin';
	});
</script>

<main class="container-app flex min-h-dvh items-center justify-center py-10">
	<section class="surface w-full max-w-md p-6 sm:p-8">
		<header class="space-y-2 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Acceso seguro</p>
			<h1 class="text-2xl font-semibold tracking-tight">Entrá a tu oráculo</h1>
			<p class="text-sm text-zinc-600">Solo los emails habilitados pueden crear cuenta.</p>
		</header>

		<div class="mt-6 flex items-center justify-center">
			<div class="flex rounded-full border border-zinc-200 bg-zinc-50 p-1 text-xs font-semibold text-zinc-500">
				<button
					type="button"
					class={`rounded-full px-4 py-2 transition ${mode === 'signin' ? 'bg-zinc-900 text-white shadow-sm' : 'hover:text-zinc-900'}`}
					onclick={() => (mode = 'signin')}
				>
					Ingresar
				</button>
				<button
					type="button"
					class={`rounded-full px-4 py-2 transition ${mode === 'signup' ? 'bg-zinc-900 text-white shadow-sm' : 'hover:text-zinc-900'}`}
					onclick={() => (mode = 'signup')}
				>
					Crear cuenta
				</button>
			</div>
		</div>

		<form
			method="post"
			action={mode === 'signup' ? '?/register' : '?/login'}
			use:enhance
			class="mt-6 space-y-4"
		>
			<div class="space-y-2">
				<label class="text-sm font-medium text-zinc-800" for="email">Email</label>
				<input
					id="email"
					name="email"
					class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</div>

			<div class="space-y-2">
				<label class="text-sm font-medium text-zinc-800" for="password">Contraseña</label>
				<div class="relative">
					<input
						id="password"
						name="password"
						class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-16 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
						type={showPassword ? 'text' : 'password'}
						autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
						minlength="6"
						required
					/>
					<button
						class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
						type="button"
						onclick={() => (showPassword = !showPassword)}
					>
						{showPassword ? 'Ocultar' : 'Ver'}
					</button>
				</div>
			</div>

			{#if form?.message}
				<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
					{form.message}
				</div>
			{/if}

			<button
				class="cta-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-soft outline-none transition focus:ring-2 focus:ring-zinc-900/20"
				type="submit"
			>
				{mode === 'signup' ? 'Crear cuenta' : 'Ingresar'}
			</button>

			{#if mode === 'signin'}
				<div class="text-right text-sm text-zinc-600">
					<a class="font-semibold hover:underline" href="/reset">¿Olvidaste tu contraseña?</a>
				</div>
			{:else}
				<div class="text-right text-sm text-zinc-600">
					<button
						type="button"
						class="font-semibold hover:underline"
						onclick={() => (mode = 'signin')}
					>
						¿Ya tenés cuenta? Entrá
					</button>
				</div>
			{/if}
		</form>
	</section>
</main>
