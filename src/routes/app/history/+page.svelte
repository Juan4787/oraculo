<script lang="ts">
type Reading = {
	id: string;
	created_at: string;
	spreads: { name: string; card_count: number } | null;
	reading_items: Array<{ position_index: number; snapshot: any }> | null;
};

let { data } = $props<{ data: { readings: Reading[]; signedUrls: Record<string, string>; nextCursor: string | null } }>();

const dtf = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

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

	function previewItems(reading: Reading) {
		const base = (reading.reading_items ?? [])
			.slice()
			.sort((a, b) => a.position_index - b.position_index)
			.slice(0, 3);
		while (base.length < 3) base.push({ position_index: base.length + 1, snapshot: {} });
		return base;
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
		<ul class="mt-6 space-y-3">
			{#each data.readings as reading}
				<li class="surface p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="text-sm font-semibold text-zinc-900">
								{reading.spreads?.name ?? 'Lectura'}
							</div>
							<div class="mt-1 text-xs text-zinc-600">
								{dtf.format(new Date(reading.created_at))}
							</div>
							{#if summaryTitles(reading)}
								<div class="mt-2 text-xs text-zinc-700">
									{summaryTitles(reading)}
								</div>
							{/if}
						</div>

						<a
							class="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
							href={`/app/readings/${reading.id}`}
						>
							Abrir
						</a>
					</div>

						<div class="mt-3 flex flex-wrap gap-2">
							{#each previewItems(reading) as item, idx}
								<img
									class="h-14 w-10 rounded-lg border border-zinc-200 object-cover"
									style="aspect-ratio: 2 / 3;"
									alt={item.snapshot?.card?.name ?? 'Carta'}
									src={item.snapshot?.card?.image_path && data.signedUrls[item.snapshot.card.image_path]
										? data.signedUrls[item.snapshot.card.image_path]
										: makePlaceholder(`Carta ${item.position_index ?? idx + 1}`)}
									loading="lazy"
								/>
							{/each}
						</div>
				</li>
			{/each}
		</ul>

		{#if data.nextCursor}
			<div class="mt-6 flex justify-center">
				<a
					class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
					href={`?before=${encodeURIComponent(data.nextCursor)}`}
				>
					Cargar más
				</a>
			</div>
		{/if}
	{/if}
</section>
