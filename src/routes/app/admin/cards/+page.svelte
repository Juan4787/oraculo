<script lang="ts">
import { enhance } from '$app/forms';

type Deck = { id: string; name: string };
type Card = {
	id: string;
	name: string;
	deck_id: string | null;
	status: 'draft' | 'published';
	image_path: string | null;
	short_message: string;
	decks: { name: string } | null;
};

let { data, form } = $props<{
	data: { decks: Deck[]; cards: Card[]; signedUrls: Record<string, string> };
	form: any;
}>();

let showCreate = $state(false);
let previewUrl = $state<string | null>(null);
let publish = $state(true);
let fileInput = $state<HTMLInputElement | null>(null);

function handleFileChange(event: Event) {
	const target = event.currentTarget as HTMLInputElement;
	const file = target.files?.[0];
	if (file) {
		previewUrl = URL.createObjectURL(file);
	} else {
		previewUrl = null;
	}
}
</script>

<section class="space-y-6">
	<div class="surface p-6 sm:p-8">
		<header class="space-y-2">
			<a class="btn-back" href="/app/admin">
				<span aria-hidden="true">←</span> Volver
			</a>
			<h1 class="text-2xl font-semibold tracking-tight">Cartas</h1>
			<p class="text-sm text-zinc-600">Las lecturas usan solo cartas publicadas.</p>
		</header>

		<div class="mt-4 flex items-center justify-between gap-3">
			<p class="text-sm text-zinc-600">Listado y estado de cartas.</p>
			<button
				class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
				type="button"
				onclick={() => (showCreate = true)}
			>
				Crear carta
			</button>
		</div>
	</div>

	<div class="surface p-6 sm:p-8">
		<header class="space-y-2">
			<h2 class="text-lg font-semibold tracking-tight">Listado</h2>
			<p class="text-sm text-zinc-600">Mostrando hasta 100 cartas.</p>
		</header>

		{#if data.cards.length === 0}
			<div class="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
				<div class="text-sm font-semibold text-zinc-900">No hay cartas todavía.</div>
				<div class="mt-1 text-sm text-zinc-600">Creá la primera para habilitar lecturas.</div>
			</div>
		{:else}
			<ul class="mt-6 space-y-3">
				{#each data.cards as card}
					<li class="surface p-4">
						<div class="flex items-start gap-4">
							<div class="h-20 w-14 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm">
								{#if card.image_path && data.signedUrls[card.image_path]}
									<img
										class="h-full w-full object-cover"
										style="aspect-ratio: 2 / 3;"
										alt={card.name}
										src={data.signedUrls[card.image_path]}
										loading="lazy"
									/>
								{/if}
							</div>

							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<div class="truncate text-base font-semibold text-zinc-900">{card.name}</div>
										<div class="mt-1 text-sm text-zinc-600">
											{card.decks?.name ?? 'Sin mazo'}
										</div>
										<span
											class="mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold {card.status === 'published'
												? 'bg-emerald-50 text-emerald-800'
												: 'bg-zinc-100 text-zinc-700'}"
										>
											{card.status === 'published' ? 'Publicado' : 'Borrador'}
										</span>
									</div>
									<form method="POST" action="?/toggle" use:enhance>
										<input type="hidden" name="card_id" value={card.id} />
										<input
											type="hidden"
											name="next_status"
											value={card.status === 'published' ? 'draft' : 'published'}
										/>
										<button
											class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
											type="submit"
										>
											{card.status === 'published' ? 'Despublicar' : 'Publicar'}
										</button>
									</form>
								</div>

								{#if card.short_message}
									<div class="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
										{card.short_message}
									</div>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

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
				class="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-xl"
				method="POST"
				action="?/create"
				enctype="multipart/form-data"
				use:enhance
			>
				<header class="flex items-center justify-between">
					<div>
						<div class="text-lg font-semibold text-zinc-900">Crear carta</div>
						<p class="text-sm text-zinc-600">Visual y lista para publicar.</p>
					</div>
					<button
						class="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
						type="button"
						onclick={() => (showCreate = false)}
					>
						Cerrar
					</button>
				</header>

				<div class="grid gap-4 sm:grid-cols-[200px_1fr]">
					<div class="space-y-3">
						<input
							class="hidden"
							bind:this={fileInput}
							id="image"
							name="image"
							type="file"
							accept="image/*"
							required
							onchange={handleFileChange}
						/>

						<label
							for="image"
							class="flex aspect-[2/3] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm font-semibold text-zinc-600 hover:border-zinc-400"
						>
							{#if previewUrl}
								<img class="h-full w-full object-cover" src={previewUrl} alt="Preview" />
							{:else}
								<span>Subir imagen</span>
							{/if}
						</label>

						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<label class="text-sm font-medium text-zinc-800" for="status_toggle">Publicado</label>
								<p class="text-xs text-zinc-500">Si está en on, se usa en lecturas.</p>
							</div>
							<label class="relative inline-flex cursor-pointer items-center">
								<input
									id="status_toggle"
									type="checkbox"
									class="peer sr-only"
									checked={publish}
									onchange={(e) => (publish = (e.currentTarget as HTMLInputElement).checked)}
								/>
								<div class="h-5 w-10 rounded-full bg-zinc-200 transition peer-checked:bg-emerald-500"></div>
								<div class="pointer-events-none absolute left-1 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
							</label>
						</div>
						<input type="hidden" name="status" value={publish ? 'published' : 'draft'} />
					</div>

					<div class="space-y-3">
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
							<label class="text-sm font-medium text-zinc-800" for="deck_id">Mazo (opcional)</label>
							<select
								id="deck_id"
								name="deck_id"
								class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
							>
								<option value="">(Sin mazo)</option>
								{#each data.decks as deck}
									<option value={deck.id}>{deck.name}</option>
								{/each}
							</select>
						</div>

						<div class="space-y-2">
							<label class="text-sm font-medium text-zinc-800" for="short_message">Mensaje corto</label>
							<input
								id="short_message"
								name="short_message"
								class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
								placeholder="1–2 líneas"
								required
							/>
						</div>

						<div class="space-y-2">
							<label class="text-sm font-medium text-zinc-800" for="meaning">Significado</label>
							<textarea
								id="meaning"
								name="meaning"
								class="min-h-20 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
								required
							></textarea>
						</div>

						<div class="space-y-2">
							<label class="text-sm font-medium text-zinc-800" for="meaning_extended">Extendido (opcional)</label>
							<textarea
								id="meaning_extended"
								name="meaning_extended"
								class="min-h-20 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
							></textarea>
						</div>
					</div>
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
						onclick={() => {
							showCreate = false;
							previewUrl = null;
						}}
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
