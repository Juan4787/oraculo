<script lang="ts">
	import { enhance } from '$app/forms';

	type Deck = { id: string; name: string; description: string | null; status: 'draft' | 'published' };
	let { data, form } = $props<{ data: { decks: Deck[] }; form: any }>();

	let showCreate = $state(false);
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-2">
		<a class="btn-back" href="/app/admin">
			<span aria-hidden="true">←</span> Volver
		</a>
		<h1 class="text-2xl font-semibold tracking-tight">Mazos</h1>
		<p class="text-sm text-zinc-600">Publicá solo lo que querés que el cliente use.</p>
	</header>

	<div class="mt-4 flex items-center justify-between gap-3">
		<p class="text-sm text-zinc-600">Listado de mazos</p>
		<button
			class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
			type="button"
			onclick={() => (showCreate = true)}
		>
			Crear mazo
		</button>
	</div>

	{#if data.decks.length === 0}
		<div class="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
			<div class="text-sm font-semibold text-zinc-900">Todavía no tenés mazos.</div>
			<div class="mt-1 text-sm text-zinc-600">Creá el primero para organizar cartas.</div>
		</div>
	{:else}
		<ul class="mt-8 space-y-3">
			{#each data.decks as deck}
				<li class="surface p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="text-base font-semibold text-zinc-900">{deck.name}</div>
							{#if deck.description}
								<div class="mt-1 text-sm text-zinc-600">{deck.description}</div>
							{/if}
							<div class="mt-2">
								<span
									class="rounded-full px-2 py-1 text-xs font-semibold {deck.status === 'published'
										? 'bg-emerald-50 text-emerald-800'
										: 'bg-zinc-100 text-zinc-700'}"
								>
									{deck.status === 'published' ? 'Publicado' : 'Borrador'}
								</span>
							</div>
						</div>

						<form method="POST" action="?/toggle" use:enhance>
							<input type="hidden" name="deck_id" value={deck.id} />
							<input
								type="hidden"
								name="next_status"
								value={deck.status === 'published' ? 'draft' : 'published'}
							/>
							<button
								class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
								type="submit"
							>
								{deck.status === 'published' ? 'Despublicar' : 'Publicar'}
							</button>
						</form>
					</div>
				</li>
			{/each}
			</ul>
	{/if}

	{#if showCreate}
		<div
			class="fixed inset-0 z-50 bg-black/50"
			role="button"
			tabindex="0"
			aria-label="Cerrar modal"
			onclick={() => (showCreate = false)}
			onkeydown={(e) => e.key === 'Enter' && (showCreate = false)}
		></div>
		<div class="fixed inset-0 z-50 flex items-center justify-center px-4">
			<form
				class="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl"
				method="POST"
				action="?/create"
				use:enhance
			>
				<header class="flex items-center justify-between">
					<div>
						<div class="text-lg font-semibold text-zinc-900">Crear mazo</div>
						<p class="text-sm text-zinc-600">Organizá tus cartas.</p>
					</div>
					<button
						class="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
						type="button"
						onclick={() => (showCreate = false)}
					>
						Cerrar
					</button>
				</header>

				<div class="space-y-2">
					<label class="text-sm font-medium text-zinc-800" for="name">Nombre</label>
					<input
						id="name"
						name="name"
						class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
						required
					/>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-zinc-800" for="description">Descripción (opcional)</label>
					<textarea
						id="description"
						name="description"
						class="min-h-20 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
					></textarea>
				</div>

				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<label class="text-sm font-medium text-zinc-800" for="status_toggle">Publicado</label>
						<p class="text-xs text-zinc-500">Si está en on, aparece en lecturas.</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input id="status_toggle" name="status" type="checkbox" value="published" class="peer sr-only" />
						<div class="h-5 w-10 rounded-full bg-zinc-200 transition peer-checked:bg-emerald-500"></div>
						<div class="pointer-events-none absolute left-1 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
					</label>
				</div>

				{#if form?.message}
					<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
						{form.message}
					</div>
				{/if}

				<div class="flex justify-end gap-2">
					<button
						class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
						type="button"
						onclick={() => (showCreate = false)}
					>
						Cancelar
					</button>
					<button
						class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
						type="submit"
					>
						Guardar
					</button>
				</div>
			</form>
		</div>
	{/if}
</section>
