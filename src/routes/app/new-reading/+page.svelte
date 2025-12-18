<script lang="ts">
	import { goto } from '$app/navigation';

	type Spread = { id: string; name: string; card_count: number };
type Deck = { id: string; name: string };

let { data } = $props<{
	data: {
		person: { id: string; name: string } | null;
		spreads: Spread[];
		decks: Deck[];
		publishedCardCount: number;
		role: 'owner' | 'staff' | 'client' | null;
	};
}>();

let selectedSpreadId = $state('');
let selectedDeckId = $state<string>('');
let showDecks = $state(false);
let loading = $state(false);
let errorMsg = $state<string | null>(null);

function spreadLabel() {
	const found = data.spreads.find((s: Spread) => s.id === selectedSpreadId);
	return found?.name ?? '';
}

	$effect(() => {
		if (!selectedSpreadId && data.spreads.length) selectedSpreadId = data.spreads[0].id;
	});

	async function tirar() {
		if (!selectedSpreadId) return;
		loading = true;
		errorMsg = null;

		const spread = data.spreads.find((s: Spread) => s.id === selectedSpreadId);
		const cardCount = spread?.card_count ?? 1;
		const spreadName = spread?.name ?? '';

		try {
			const res = await fetch('/app/api/readings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					spreadId: selectedSpreadId,
					deckId: selectedDeckId || null,
					personId: data.person?.id ?? null,
					_demo: { cardCount, spreadName }
				})
			});

			const payload = (await res.json().catch(() => null)) as
				| { readingId?: string; message?: string }
				| null;
			if (!res.ok || !payload?.readingId) {
				throw new Error(payload?.message ?? 'No se pudo generar la lectura.');
			}

			const qs = new URLSearchParams();
			qs.set('fresh', '1');
			if (cardCount) qs.set('cards', String(cardCount));
			if (spreadName) qs.set('spread', spreadName);

			await goto(`/app/readings/${payload.readingId}?${qs.toString()}`);
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'No se pudo generar la lectura.';
		} finally {
			loading = false;
		}
	}
</script>

<section class="surface p-6 sm:p-8">
	<header class="flex items-start justify-between gap-3">
		<div class="space-y-4">
			<a
				class="btn-back"
				href="/app/history"
			>
				<span aria-hidden="true">←</span> Volver
			</a>
			<h1 class="text-2xl font-semibold tracking-tight">
				{data.person ? `Nueva lectura para ${data.person.name}` : 'Nueva lectura'}
			</h1>
			<p class="text-sm text-zinc-600">
				Elegí tirada y perfil {selectedSpreadId ? `(seleccionada: ${spreadLabel()})` : ''}
			</p>
		</div>
	</header>

	{#if data.publishedCardCount === 0}
		<div class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
			<div class="font-semibold">No hay cartas publicadas.</div>
			<div class="mt-1">
				Publicá al menos 1 carta para habilitar lecturas.
			</div>
			{#if data.role === 'owner' || data.role === 'staff'}
				<a
					class="mt-3 inline-flex rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800"
					href="/app/admin/cards"
				>
					Ir a Cartas
				</a>
			{/if}
		</div>
	{/if}

	<div class="mt-6 space-y-6">
		<section class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-zinc-500">Elegí tu tirada</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.spreads as spread}
					<button
						type="button"
						class={`surface p-4 text-left transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(59,130,246,0.16)] focus:outline-none ${
							selectedSpreadId === spread.id ? 'selected-spread' : ''
						}`}
						onclick={() => {
							selectedSpreadId = spread.id;
						}}
					>
						<div class="text-base font-semibold text-zinc-900">{spread.name}</div>
					</button>
				{/each}
			</div>
		</section>

		<section class="space-y-3">
			<button
				type="button"
				class="flex items-center gap-2 text-sm font-semibold text-zinc-800"
				onclick={() => (showDecks = !showDecks)}
			>
				<span class="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700">
					Opcional
				</span>
				<span>Elegir mazo</span>
				<span class="text-zinc-500">{showDecks ? '▲' : '▼'}</span>
			</button>
			{#if showDecks}
				<div class="max-w-md">
					<select
						class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
						bind:value={selectedDeckId}
					>
						<option value="">Todos</option>
						{#each data.decks as deck}
							<option value={deck.id}>{deck.name}</option>
						{/each}
					</select>
				</div>
			{/if}
		</section>
	</div>

	{#if errorMsg}
		<div class="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
			{errorMsg}
		</div>
	{/if}

	<div class="sticky bottom-24 mt-8 rounded-2xl bg-zinc-50/80 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur md:bottom-0">
		<button
			class="cta-glow w-full rounded-2xl bg-zinc-900 px-5 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-60"
			disabled={loading || data.publishedCardCount === 0 || !selectedSpreadId}
			type="button"
			onclick={() => {
				void tirar();
			}}
		>
			{loading ? 'Generando…' : 'Tirar'}
		</button>
	</div>
</section>
