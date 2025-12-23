<script lang="ts">
import { enhance } from '$app/forms';

type ActionData = { message?: string } | null;
let { form } = $props<{ form: ActionData }>();

let loading = $state(false);
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-3">
		<a class="btn-back" href="/app/profiles">
			<span aria-hidden="true">←</span> Volver
		</a>
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Nuevo perfil</h1>
			<p class="text-sm text-zinc-600 dark:text-[hsl(var(--muted))]">
				Creá un perfil para organizar tus lecturas.
			</p>
		</div>
	</header>

	{#if form?.message}
		<div class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
			{form.message}
		</div>
	{/if}

	<form
		class="mt-6 space-y-4"
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		<div>
			<label class="block text-sm font-medium text-zinc-700 dark:text-[hsl(var(--text))]" for="name">
				Nombre del perfil
			</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsla(var(--accent)/0.3)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--surface))] dark:text-[hsl(var(--text))]"
				placeholder="Ej: Yo, Pareja, Cliente..."
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="cta-glow inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
		>
			{#if loading}
				Creando...
			{:else}
				Crear perfil
			{/if}
		</button>
	</form>
</section>
