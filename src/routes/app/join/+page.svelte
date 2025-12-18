<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-2">
		<h1 class="text-xl font-semibold tracking-tight">Activar acceso</h1>
		<p class="text-sm text-zinc-600">
			Ingresá tu código para asociar tu cuenta al oráculo.
		</p>
	</header>

	<form class="mt-6 max-w-md space-y-3" method="POST" use:enhance>
		<div class="space-y-2">
			<label class="text-sm font-medium text-zinc-800" for="access_code">Código de acceso</label>
			<input
				id="access_code"
				name="access_code"
				class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
				placeholder="Ej: ORACULO-XXXX"
				autocomplete="off"
				required
			/>
		</div>

		{#if form?.message}
			<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
				{form.message}
			</div>
		{/if}

		<button
			class="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-soft outline-none transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900/20"
			type="submit"
		>
			Continuar
		</button>
	</form>
</section>

