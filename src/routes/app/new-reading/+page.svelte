<script lang="ts">
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';

	type Spread = { id: string; name: string; card_count: number };
type Deck = { id: string; name: string };

let { data } = $props<{
	data: {
		person: { id: string; name: string } | null;
		spreads: Spread[];
		decks: Deck[];
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

	onMount(() => {
		if (!dev) return;
		if (!new URLSearchParams(window.location.search).has('debug')) return;

		const titleEl = document.querySelector<HTMLElement>('.spread-card .spread-title');
		const cardEl = document.querySelector<HTMLElement>('.spread-card');
		const htmlStyles = getComputedStyle(document.documentElement);
		const bodyStyles = getComputedStyle(document.body);
		const textVarHtml = htmlStyles.getPropertyValue('--text').trim();
		const textVarBody = bodyStyles.getPropertyValue('--text').trim();
		const themeDarkHtml = document.documentElement.classList.contains('theme-dark');
		const themeDarkBody = document.body.classList.contains('theme-dark');
		const titleColor = titleEl ? getComputedStyle(titleEl).color : 'n/a';
		const cardColor = cardEl ? getComputedStyle(cardEl).color : 'n/a';
		const ctaEl = document.querySelector<HTMLElement>('.cta-glow');
		const ctaColor = ctaEl ? getComputedStyle(ctaEl).color : 'n/a';
		console.info('[spread-color-debug]', {
			themeDarkHtml,
			themeDarkBody,
			textVarHtml,
			textVarBody,
			cardColor,
			titleColor,
			ctaColor
		});
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

	<div class="mt-6 space-y-6">
			<section class="space-y-4">
			<h2 class="section-label text-xs font-semibold uppercase tracking-[0.14em]">
				Elegí tu tirada
			</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each data.spreads as spread}
					<button
						type="button"
						class={`spread-card text-left ${
							selectedSpreadId === spread.id ? 'spread-card-active' : ''
						}`}
							onclick={() => {
								selectedSpreadId = spread.id;
							}}
						>
							<div class="flex items-start justify-between gap-3">
								<div class="space-y-1">
								<div class="spread-title">{spread.name}</div>
								<p class="spread-meta">
									{spread.card_count === 1 ? 'Rápida y directa' : 'Profunda y desarrollada'}
								</p>
							</div>
							<div class="mini-preview" aria-hidden="true">
								{#each Array(spread.card_count) as _, idx}
									<span style={`--i:${idx};`}></span>
								{/each}
							</div>
						</div>
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

	<div class="mt-10 grid gap-6 md:grid-cols-[2fr_1fr]">
		<div class="surface p-5 space-y-3">
			<div class="section-label text-xs uppercase tracking-[0.14em]">Cómo funciona</div>
			<p class="section-body text-sm leading-relaxed">
				Elegí tu tirada, opcionalmente un mazo, y tocá “Tirar”. Revelá la carta cuando estés lista: el reverso es único para cada arcángel.
			</p>
		</div>
		<div class="surface p-5 space-y-3">
			<div class="section-label text-xs uppercase tracking-[0.14em]">Última lectura</div>
			<p class="section-body text-sm leading-relaxed">
				Guardá tus tiradas en Historial para consultarlas rápido y repetir la dinámica cuando quieras.
			</p>
		</div>
	</div>

	<div class="sticky bottom-24 mt-8 rounded-2xl bg-[hsla(var(--surface)/0.75)] pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur md:bottom-0">
		<button
			class="cta-glow w-full rounded-2xl bg-zinc-900 px-5 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-60"
			disabled={loading || !selectedSpreadId}
			type="button"
			onclick={() => {
				void tirar();
			}}
		>
			{loading ? 'Generando…' : 'Tirar'}
		</button>
	</div>
</section>
