<script lang="ts">
type Reading = {
	id: string;
	created_at: string;
	spreads: { name: string; card_count: number } | null;
	reading_items: Array<{ position_index: number; snapshot: any }> | null;
};

let { data } = $props<{ data: { readings: Reading[]; signedUrls: Record<string, string>; nextCursor: string | null } }>();

const dtf = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
let filterSpread = $state<'all' | '1' | '3'>('all');
let sortOrder = $state<'newest' | 'oldest'>('newest');

function makePlaceholder(label: string) {
	return (
		'data:image/svg+xml;utf8,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 200 300">
  <defs>
    <linearGradient id="g2" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#c7d2fe"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="200" height="300" rx="18" fill="url(#g2)" />
  <rect x="16" y="16" width="168" height="268" rx="14" fill="none" stroke="#3b82f6" stroke-width="3"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#1e293b" font-family="Georgia, serif" font-size="22">${label}</text>
</svg>`
		)
	);
}

const displayedReadings = $derived(() => {
	const base = [...(data.readings ?? [])];
	const filtered = base.filter((reading) => {
		const cards = reading.spreads?.card_count ?? reading.reading_items?.length ?? 0;
		if (filterSpread === '1') return cards === 1;
		if (filterSpread === '3') return cards === 3;
		return true;
	});

	filtered.sort((a, b) => {
		const aTime = new Date(a.created_at).getTime();
		const bTime = new Date(b.created_at).getTime();
		return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
	});

	return filtered;
});

let totalShown = $state(0);

$effect(() => {
	totalShown = displayedReadings.length;
});

function previewItems(reading: Reading) {
	const base = (reading.reading_items ?? [])
		.slice()
		.sort((a, b) => a.position_index - b.position_index)
		.slice(0, 3);
	while (base.length < 3) base.push({ position_index: base.length + 1, snapshot: {} });
	return base;
}

function cardCount(reading: Reading) {
	const fromSpread = reading.spreads?.card_count ?? null;
	const fromItems = reading.reading_items?.length ?? null;
	return fromSpread ?? fromItems ?? 0;
}

function spreadLabel(reading: Reading) {
	const cards = cardCount(reading);
	const fallback = cards ? `${cards} carta${cards === 1 ? '' : 's'}` : 'Lectura';
	return reading.spreads?.name ?? fallback;
}

function summaryTitles(reading: Reading) {
	return (reading.reading_items ?? [])
		.slice()
		.sort((a, b) => a.position_index - b.position_index)
		.map((it) => it.snapshot?.card?.name)
		.filter(Boolean)
		.slice(0, 5)
		.join(' · ');
}
</script>

<section class="surface p-6 sm:p-8">
	<header class="flex items-start justify-between gap-3">
		<div class="space-y-4">
			<a
				class="btn-back"
				href="/app/new-reading"
			>
				<span aria-hidden="true">←</span> Volver
			</a>
			<h1 class="text-2xl font-semibold tracking-tight">Historial</h1>
			<p class="text-sm text-zinc-600">Tus lecturas guardadas.</p>
		</div>
		<a
			class="cta-glow rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
			href="/app/new-reading"
		>
			Nueva lectura
		</a>
	</header>

	{#if data.readings.length === 0}
		<div class="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
			<div class="text-sm font-semibold text-zinc-900">Todavía no tenés lecturas.</div>
			<div class="mt-1 text-sm text-zinc-600">Hacé tu primera tirada y quedará guardada acá.</div>
			<a
				class="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
				href="/app/new-reading"
			>
				Hacer primera lectura
			</a>
		</div>
	{:else}
			<div class="mt-6 surface p-4">
				<div class="grid gap-8 sm:grid-cols-2">
					<div class="flex flex-col space-y-4">
						<span class="section-label text-xs font-semibold uppercase tracking-[0.18em]">Orden</span>
						<div class="flex flex-wrap gap-3">
							<button
								type="button"
								class={`filter-chip ${sortOrder === 'newest' ? 'filter-chip-active' : ''}`}
								onclick={() => (sortOrder = 'newest')}
							>
							Más recientes
						</button>
						<button
							type="button"
							class={`filter-chip ${sortOrder === 'oldest' ? 'filter-chip-active' : ''}`}
							onclick={() => (sortOrder = 'oldest')}
						>
							Más antiguas
						</button>
					</div>
				</div>

					<div class="flex flex-col space-y-4">
						<span class="section-label text-xs font-semibold uppercase tracking-[0.18em]">Tirada</span>
						<div class="flex flex-wrap gap-3">
							<button
								type="button"
								class={`filter-chip ${filterSpread === 'all' ? 'filter-chip-active' : ''}`}
								onclick={() => (filterSpread = 'all')}
							>
							Todas
						</button>
						<button
							type="button"
								class={`filter-chip ${filterSpread === '1' ? 'filter-chip-active' : ''}`}
								onclick={() => (filterSpread = '1')}
							>
								1 carta
							</button>
							<button
								type="button"
								class={`filter-chip ${filterSpread === '3' ? 'filter-chip-active' : ''}`}
								onclick={() => (filterSpread = '3')}
							>
								3 cartas
							</button>
						</div>
					</div>
				</div>
				<div class="mt-5 text-right text-xs font-semibold section-body">
					Mostrando {totalShown} lectura{totalShown === 1 ? '' : 's'}
				</div>
			</div>

			{#if displayedReadings.length}
				<ul class="mt-6 space-y-4">
					{#each displayedReadings as reading}
						<li
							class="history-card surface p-4"
							role="link"
							tabindex="0"
							onclick={() => {
								location.href = `/app/readings/${reading.id}`;
							}}
							onkeydown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									location.href = `/app/readings/${reading.id}`;
								}
							}}
						>
							<div class="flex flex-col gap-4">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 space-y-2">
										<div class="history-eyebrow">
											<span class="history-pill">{spreadLabel(reading)}</span>
											<span class="history-dot">•</span>
											<span>{dtf.format(new Date(reading.created_at))}</span>
										</div>
										<div class="history-title">
											{summaryTitles(reading) || 'Lectura sin título'}
										</div>
										<div class="history-meta">
											<span>{cardCount(reading) === 1 ? 'Lectura rápida' : 'Lectura profunda'}</span>
											<span class="history-dot">•</span>
											<span>{cardCount(reading)} carta{cardCount(reading) === 1 ? '' : 's'}</span>
										</div>
									</div>
									<div class="history-thumbs" aria-hidden="true">
										{#each previewItems(reading) as item, idx}
											<img
												class="history-thumb"
												style={`--i:${idx};`}
												alt={item.snapshot?.card?.name ?? 'Carta'}
												src={item.snapshot?.card?.image_path && data.signedUrls[item.snapshot.card.image_path]
													? data.signedUrls[item.snapshot.card.image_path]
													: makePlaceholder(`Carta ${item.position_index ?? idx + 1}`)}
												loading="lazy"
											/>
										{/each}
									</div>
								</div>

								<div class="history-footer">
									<div class="flex flex-wrap items-center gap-2">
										<span class="tag-pill muted">{reading.spreads?.name ?? 'Lectura'}</span>
										{#if summaryTitles(reading)}
											<span class="tag-pill">{cardCount(reading)} carta{cardCount(reading) === 1 ? '' : 's'}</span>
										{/if}
									</div>
									<div class="flex items-center gap-2">
										<a
											class="ghost-button"
											href={`/app/readings/${reading.id}`}
											onclick={(event) => event.stopPropagation()}
										>
											Abrir
										</a>
										<details class="action-menu" onclick={(event) => event.stopPropagation()}>
											<summary aria-label="Más acciones">⋯</summary>
											<div class="action-menu-panel">
												<a href={`/app/readings/${reading.id}`}>Ver lectura</a>
												<a href="/app/new-reading">Repetir tirada</a>
											</div>
										</details>
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>

				{#if data.nextCursor}
					<div class="mt-6 flex justify-center">
						<a
							class="ghost-button px-4 py-2"
							href={`?before=${encodeURIComponent(data.nextCursor)}`}
						>
							Cargar más
						</a>
					</div>
				{/if}
			{/if}
	{/if}
</section>
