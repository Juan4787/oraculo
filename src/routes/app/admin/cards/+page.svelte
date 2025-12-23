<script lang="ts">
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

	let { data } = $props<{
		data: { decks: Deck[]; cards: Card[]; signedUrls: Record<string, string> };
	}>();
</script>

<section class="space-y-6">
	<div class="surface p-6 sm:p-8">
		<header class="space-y-2">
			<a class="btn-back" href="/app/admin">
				<span aria-hidden="true">←</span> Volver
			</a>
			<h1 class="text-2xl font-semibold tracking-tight">Cartas</h1>
			<p class="text-sm text-zinc-600">
				Las cartas están fijadas en el oráculo y no se editan desde la app.
			</p>
		</header>

		<div class="mt-4">
			<p class="text-sm text-zinc-600">Listado y estado de cartas.</p>
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
				<div class="mt-1 text-sm text-zinc-600">No pudimos cargar el mazo fijo.</div>
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
</section>
