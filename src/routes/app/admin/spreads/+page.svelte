<script lang="ts">
	type Spread = { id: string; name: string; card_count: number; status: 'draft' | 'published' };
	type Position = { spread_id: string; position_index: number; title: string };

	let { data } = $props<{ data: { spreads: Spread[]; positionsBySpread: Record<string, Position[]> } }>();
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-2">
		<a
			class="btn-back"
			href="/app/admin"
		>
			<span aria-hidden="true">←</span> Volver
		</a>
		<h1 class="text-2xl font-semibold tracking-tight">Tiradas</h1>
		<p class="text-sm text-zinc-600">Preconfiguradas: 1 y 3 cartas.</p>
	</header>

	{#if data.spreads.length === 0}
		<div class="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
			<div class="text-sm font-semibold text-zinc-900">No hay tiradas.</div>
			<div class="mt-1 text-sm text-zinc-600">
				Creá un workspace nuevo para que se carguen las tiradas por defecto.
			</div>
		</div>
	{:else}
		<ul class="mt-6 space-y-3">
			{#each data.spreads as spread}
				<li class="surface p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="text-base font-semibold text-zinc-900">{spread.name}</div>
							<div class="mt-1 text-sm text-zinc-600">
								{spread.card_count} carta(s) · {spread.status}
							</div>
						</div>
					</div>

					<div class="mt-3 flex flex-wrap gap-2">
						{#each data.positionsBySpread[spread.id] ?? [] as pos}
							<span class="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700">
								{pos.position_index}. {pos.title}
							</span>
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
