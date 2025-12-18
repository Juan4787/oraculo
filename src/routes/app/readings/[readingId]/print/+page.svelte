<script lang="ts">
	import { onMount } from 'svelte';

	type Reading = {
		id: string;
		created_at: string;
		owner_type: 'user' | 'person';
		persons: { name: string } | null;
		spreads: { name: string; card_count: number } | null;
		reading_items: Array<{ position_index: number; snapshot: any }> | null;
	};

	let { data } = $props<{ data: { reading: Reading; signedUrls: Record<string, string> } }>();

	const dtf = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeStyle: 'short' });
	const items = $derived.by(() =>
		((data.reading.reading_items ?? []) as Array<{ position_index: number; snapshot: any }>)
			.slice()
			.sort((a, b) => a.position_index - b.position_index)
	);

	const makePlaceholder = (label: string) =>
		'data:image/svg+xml;utf8,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <defs>
    <linearGradient id="g3" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#c7d2fe"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="200" height="300" rx="18" fill="url(#g3)" />
  <rect x="16" y="16" width="168" height="268" rx="14" fill="none" stroke="#3b82f6" stroke-width="3"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#1e293b" font-family="Georgia, serif" font-size="22">${label}</text>
</svg>`
		);

	onMount(() => {
		const t = window.setTimeout(() => window.print(), 200);
		return () => window.clearTimeout(t);
	});
</script>

<main class="mx-auto w-full max-w-3xl p-6">
	<div class="print:hidden mb-5 flex items-center justify-between gap-3">
		<a
			class="btn-back"
			href={`/app/readings/${data.reading.id}`}
		>
			Volver
		</a>
		<button
			class="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
			type="button"
			onclick={() => window.print()}
		>
			Imprimir
		</button>
	</div>

	<header class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Lectura</h1>
		<p class="text-sm text-zinc-600">
			{data.reading.spreads?.name ?? 'Lectura'} · {dtf.format(new Date(data.reading.created_at))}
			{#if data.reading.owner_type === 'person' && data.reading.persons?.name}
				· Para: {data.reading.persons.name}
			{/if}
		</p>
	</header>

	<section class="mt-6 space-y-6">
		{#each items as item}
			<article class="break-inside-avoid rounded-2xl border border-zinc-200 bg-white p-4">
				<div class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					{item.snapshot?.position?.title ?? `Carta ${item.position_index}`}
				</div>

				<div class="mt-3 flex gap-4">
					<div class="h-40 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
						{#if item.snapshot?.card?.image_path && data.signedUrls[item.snapshot.card.image_path]}
							<img
								class="h-full w-auto object-cover"
								style="aspect-ratio: 2 / 3;"
								alt={item.snapshot?.card?.name ?? 'Carta'}
								src={data.signedUrls[item.snapshot.card.image_path]}
							/>
						{:else}
							<img
								class="h-full w-auto object-cover"
								style="aspect-ratio: 2 / 3;"
								alt="Carta"
								src={makePlaceholder(`Carta ${item.position_index}`)}
							/>
						{/if}
					</div>

					<div class="min-w-0">
						<div class="text-base font-semibold text-zinc-900">{item.snapshot?.card?.name ?? 'Carta'}</div>
						{#if item.snapshot?.card?.short_message}
							<div class="mt-2 text-sm italic text-zinc-800">“{item.snapshot.card.short_message}”</div>
						{/if}
					</div>
				</div>

				{#if item.snapshot?.card?.meaning}
					<div class="prose prose-zinc mt-4 max-w-prose text-sm">
						<p class="card-meaning">{item.snapshot.card.meaning}</p>
					</div>
				{/if}

				{#if item.snapshot?.card?.meaning_extended}
					<div class="prose prose-zinc mt-4 max-w-prose text-sm">
						<p>{item.snapshot.card.meaning_extended}</p>
					</div>
				{/if}
			</article>
		{/each}
	</section>
</main>
