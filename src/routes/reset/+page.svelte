<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<main class="container-app flex min-h-dvh items-center justify-center py-10">
	<section class="surface w-full max-w-md p-6 sm:p-8">
		<header class="space-y-2 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Recuperación</p>
			<h1 class="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
			<p class="text-sm text-zinc-600">Te enviamos un enlace para restablecer tu clave.</p>
		</header>

		{#if form?.success}
			<div class="mt-6 space-y-4">
				<div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
					Revisá tu correo: Supabase Auth te envió el email para recuperar la contraseña.
				</div>
				<a
					class="cta-glow inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold"
					href="/login"
				>
					Volver a ingresar
				</a>
			</div>
		{:else}
			<form class="mt-6 space-y-4" method="post" use:enhance>
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

				{#if form?.message}
					<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
						{form.message}
					</div>
				{/if}

				<button
					class="cta-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-soft"
					type="submit"
				>
					Enviar enlace
				</button>

				<div class="text-center text-sm text-zinc-600">
					<a class="hover:underline" href="/login">Volver al login</a>
				</div>
			</form>
		{/if}
	</section>
</main>
