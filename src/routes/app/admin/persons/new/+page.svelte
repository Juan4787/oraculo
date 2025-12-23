<script lang="ts">
	let { form } = $props();
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-4">
		<a
			class="btn-back"
			href="/app/admin/persons"
		>
			<span aria-hidden="true">←</span> Volver a Perfiles
		</a>
		<div class="space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight">Crear perfil</h1>
			<p class="text-sm text-zinc-600">Separá lecturas por persona, cliente o tema.</p>
		</div>
	</header>

	<form class="mt-6 max-w-xl space-y-4" method="POST">
		<div class="space-y-2">
			<label class="text-sm font-medium text-zinc-800" for="name">Nombre o alias</label>
			<input
				id="name"
				name="name"
				class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
				required
			/>
		</div>

		<div class="space-y-2">
			<label class="text-sm font-medium text-zinc-800" for="tags">Etiquetas (opcional)</label>
			<input
				id="tags"
				name="tags"
				class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
				placeholder="Ej: ansiedad, pareja, trabajo"
			/>
			<p class="text-xs text-zinc-500">Separá con comas.</p>
		</div>

		<div class="space-y-2">
			<label class="text-sm font-medium text-zinc-800" for="notes">Notas internas (opcional)</label>
			<textarea
				id="notes"
				name="notes"
				class="min-h-28 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
				placeholder="Notas privadas para el uso profesional…"
			></textarea>
		</div>

		{#if form?.message}
			<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
				{form.message}
			</div>
		{/if}

		<div class="flex gap-3">
			<button
				class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
				type="submit"
			>
				Guardar
			</button>
			<a
				class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
				href="/app/admin/persons"
			>
				Cancelar
			</a>
		</div>
	</form>
</section>
