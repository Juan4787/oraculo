<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	type Reading = {
		id: string;
		created_at: string;
		owner_type: 'user' | 'person';
		owner_person_id: string | null;
		note: string | null;
		spreads: { name: string; card_count: number } | null;
		persons: { name: string } | null;
		reading_items: Array<{ position_index: number; snapshot: any }> | null;
	};

	let { data } = $props<{
		data: { reading: Reading; signedUrls: Record<string, string>; fresh: boolean; from: string | null };
	}>();

	const dtf = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
	const items = $derived.by(() =>
		((data.reading.reading_items ?? []) as Array<{ position_index: number; snapshot: any }>)
			.slice()
			.sort((a, b) => a.position_index - b.position_index)
	);

	const backHref = $derived.by(() => {
		// Si vinimos del historial, volver al historial
		if (data.from === 'history') return '/app/history';
		// Si es lectura de un perfil, volver al perfil
		if (data.reading.owner_type === 'person' && data.reading.owner_person_id) {
			return `/app/profiles/${data.reading.owner_person_id}`;
		}
		// Por defecto, ir a nueva lectura
		return '/app/new-reading';
	});

	const newHref = $derived.by(() =>
		data.reading.owner_type === 'person' && data.reading.owner_person_id
			? `/app/new-reading?personId=${data.reading.owner_person_id}`
			: '/app/new-reading'
	);

	// Opciones múltiples por arcángel (elige una por carta)
	const cardBackOptions: Record<string, string[]> = {
		'arcangel-rafael': [
			'/cards/message-rafael-1.png',
			'/cards/message-rafael-2.png',
			'/cards/message-rafael-3.png',
			'/cards/message-rafael-4.png',
			'/cards/message-rafael-5.png',
			'/cards/message-rafael-6.png'
		],
		'arcangel-gabriel': [
			'/cards/message-gabriel-1.png',
			'/cards/message-gabriel-2.png',
			'/cards/message-gabriel-3.png'
		],
		'arcangel-miguel': [
			'/cards/message-miguel-1.png',
			'/cards/message-miguel-2.png'
		],
		'arcangel-uriel': [
			'/cards/message-uriel-1.png',
			'/cards/message-uriel-2.png',
			'/cards/message-uriel-3.png'
		],
		'arcangel-metatron': [
			'/cards/message-metatron-1.png'
		]
	};

	function slugify(value: string) {
		return value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	const arcangelAliases: Record<string, string> = {
		rafael: 'rafael',
		rafel: 'rafael',
		rafeal: 'rafael',
		gabriel: 'gabriel',
		miguel: 'miguel',
		migel: 'miguel',
		uriel: 'uriel',
		metatron: 'metatron',
		metatronn: 'metatron'
	};

	function ensureArcangelPrefix(slug: string) {
		if (!slug) return '';
		return slug.startsWith('arcangel-') ? slug : `arcangel-${slug}`;
	}

	function slugFromPath(path: string) {
		const filename = path.split('/').pop() ?? '';
		const base = filename.replace(/\.[^/.]+$/, '');
		return slugify(base);
	}

	function detectArcangel(item: (typeof items)[number] | undefined) {
		// Nuevo formato: card_image_path y card_name directo en snapshot
		// Formato anterior: snapshot.card.image_path y snapshot.card.name
		const path = item?.snapshot?.card_image_path ?? item?.snapshot?.card?.image_path ?? '';
		const name = item?.snapshot?.card_name ?? item?.snapshot?.card?.name ?? '';

		const candidates = [slugify(path), slugify(slugFromPath(path)), slugify(name)];
		for (const candidate of candidates) {
			for (const [alias, canonical] of Object.entries(arcangelAliases)) {
				if (candidate.includes(alias)) {
					return ensureArcangelPrefix(canonical);
				}
			}
		}

		return '';
	}

	function hashSeed(value: string) {
		let hash = 0x811c9dc5;
		for (let i = 0; i < value.length; i++) {
			hash ^= value.charCodeAt(i);
			hash = Math.imul(hash, 0x01000193);
		}
		return hash >>> 0;
	}

	function pickIndex(seed: string, size: number) {
		if (!size) return 0;
		return hashSeed(seed) % size;
	}

	// Asigna una imagen de reverso por carta, evitando repeticiones cuando hay opciones.
	const assignedBacks = $derived.by(() => {
		const assignment: Record<number, string> = {};
		const used = new Set<string>();
		const baseSeed = data.reading.id ?? '';

		for (const item of items) {
			const slug = detectArcangel(item);
			const pool = slug ? cardBackOptions[slug] : null;
			if (!pool || pool.length === 0) continue;

			const available = pool.filter((p) => !used.has(p));
			const pickFrom = available.length ? available : pool;
			const idx = pickIndex(`${baseSeed}:${slug}:${item.position_index}`, pickFrom.length);
			const picked = pickFrom[idx];

			assignment[item.position_index] = picked;
			used.add(picked);
		}

		return assignment;
	});

	function backImageFor(item: (typeof items)[number] | undefined) {
		const explicit = item?.snapshot?.back_image_path;
		if (typeof explicit === 'string' && explicit.trim()) return explicit;
		const slug = detectArcangel(item);
		if (slug) {
			const assigned = item?.position_index ? assignedBacks[item.position_index] : null;
			if (assigned) return assigned;
		}
		// Fallback to a data-URI to avoid vacío.
		return (
			'data:image/svg+xml;utf8,' +
			encodeURIComponent(
				`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <defs>
    <linearGradient id="g2" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="200" height="300" rx="18" fill="url(#g2)" />
  <rect x="16" y="16" width="168" height="268" rx="14" fill="none" stroke="#475569" stroke-width="3"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e2e8f0" font-family="Georgia, serif" font-size="20">Reverso</text>
</svg>`
			)
		);
	}

	function makePlaceholder(label: string) {
		return (
			'data:image/svg+xml;utf8,' +
			encodeURIComponent(
				`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#c7d2fe"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="200" height="300" rx="18" fill="url(#g)" />
  <rect x="16" y="16" width="168" height="268" rx="14" fill="none" stroke="#3b82f6" stroke-width="3"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#1e293b" font-family="Georgia, serif" font-size="22">${label}</text>
</svg>`
			)
		);
	}

	function frontImageFor(item: (typeof items)[number] | undefined) {
		// Nuevo formato: card_image_path directo en snapshot
		// Formato anterior: snapshot.card.image_path
		const path = item?.snapshot?.card_image_path ?? item?.snapshot?.card?.image_path;
		if (path && data.signedUrls[path]) return data.signedUrls[path];
		const slug = detectArcangel(item);
		if (slug) return `/cards/${ensureArcangelPrefix(slug.replace(/^arcangel-/, ''))}.png`;
		return makePlaceholder(`Carta ${item?.position_index ?? current + 1}`);
	}

	function preloadImage(url: string) {
		if (!url || url.startsWith('data:') || preloadedImages.has(url)) return;
		const img = new Image();
		img.decoding = 'async';
		img.loading = 'eager';
		img.src = url;
		img.decode?.().catch(() => {});
		preloadedImages.add(url);
	}

	function preloadCard(index: number) {
		if (!items.length) return;
		const safeIndex = ((index % items.length) + items.length) % items.length;
		const item = items[safeIndex];
		preloadImage(frontImageFor(item));
		preloadImage(backImageFor(item));
	}

	let current = $state(0);
	let direction = $state<1 | -1>(1);
	let flipState = $state<'idle' | 'out' | 'in'>('idle');
	let isFlipping = $derived(flipState !== 'idle');
	let revealed = $state<Record<string | number, boolean>>({});
	let frontStatus = $state<'idle' | 'ok' | 'error'>('idle');
	let backStatus = $state<'idle' | 'ok' | 'error'>('idle');

	let imageError = $state(false);
	let fireState = $state<'off' | 'rise' | 'retract' | 'glow'>('off');
	let fireTimers: Array<ReturnType<typeof setTimeout>> = [];
	const preloadedImages = new Set<string>();
	let didPreloadAll = $state(false);

	function clearFireTimers() {
		fireTimers.forEach((timer) => clearTimeout(timer));
		fireTimers = [];
	}

	function startFireSequence(startDelay = 0) {
		clearFireTimers();
		fireState = 'off';

		const pause = Math.max(0, startDelay);
		const rise = 900;
		const retract = 700;
		const glow = 2200;

		fireTimers.push(setTimeout(() => (fireState = 'rise'), pause));
		fireTimers.push(setTimeout(() => (fireState = 'retract'), pause + rise));
		fireTimers.push(setTimeout(() => (fireState = 'glow'), pause + rise + retract));
		fireTimers.push(setTimeout(() => (fireState = 'off'), pause + rise + retract + glow));

		return pause + rise;
	}

	// Reset error when card changes
	$effect(() => {
		const _ = current; // dependency
		imageError = false;
		frontStatus = 'idle';
		backStatus = 'idle';
		clearFireTimers();
		fireState = 'off';
	});

	const currentKey = $derived.by(() => items[current]?.position_index ?? current);
	const isRevealed = $derived.by(() => Boolean(revealed[currentKey]));
	const backImageUrl = $derived.by(() => backImageFor(items[current]));
	// Mostrar anverso al inicio; al revelar, girar al reverso (usa imagen si existe o fallback de texto).
	const showBack = $derived.by(() => isRevealed);
	const fireClass = $derived.by(() => (fireState === 'off' ? '' : fireState));
	const frontImageUrl = $derived.by(() => frontImageFor(items[current]));

	function positionTitle(item: (typeof items)[number] | undefined) {
		return item?.snapshot?.position?.title ?? (item ? `Carta ${item.position_index}` : '');
	}

	const backLabel = $derived.by(() => {
		const item = items[current];
		return (
			item?.snapshot?.card?.short_message ||
			item?.snapshot?.card?.name ||
			`Carta ${item?.position_index ?? current + 1}`
		);
	});

	function revealCard() {
		if (isRevealed) return;
		const key = currentKey;
		revealed = { ...revealed, [key]: true };
		const flipDuration = 420;
		const postFlipPause = 240;
		startFireSequence(flipDuration + postFlipPause);
	}

	function hideCard() {
		const key = currentKey;
		const next = { ...revealed };
		delete next[key];
		revealed = next;
		clearFireTimers();
		fireState = 'off';
	}

	function prev() {
		if (!items.length || isFlipping) return;
		clearFireTimers();
		fireState = 'off';
		direction = -1;
		flipState = 'out';
		setTimeout(() => {
			current = (current - 1 + items.length) % items.length;
			flipState = 'in';
			setTimeout(() => (flipState = 'idle'), 220);
		}, 200);
	}

	function next() {
		if (!items.length || isFlipping) return;
		clearFireTimers();
		fireState = 'off';
		direction = 1;
		flipState = 'out';
		setTimeout(() => {
			current = (current + 1) % items.length;
			flipState = 'in';
			setTimeout(() => (flipState = 'idle'), 220);
		}, 200);
	}

	$effect(() => {
		const _ = current; // dependency
		if (!browser || !items.length) return;

		const timeout = window.setTimeout(() => {
			preloadCard(current);
			preloadCard(current + 1);
			preloadCard(current - 1);
		}, 0);

		return () => window.clearTimeout(timeout);
	});

	$effect(() => {
		const count = items.length;
		if (!browser || !count || didPreloadAll) return;
		didPreloadAll = true;
		const timeout = window.setTimeout(() => {
			for (let i = 0; i < count; i += 1) {
				preloadCard(i);
			}
		}, 0);

		return () => window.clearTimeout(timeout);
	});

	onDestroy(() => {
		clearFireTimers();
	});
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-2">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				<h1 class="text-xl font-semibold tracking-tight">Tu lectura</h1>
				<p class="mt-1 text-sm text-zinc-600">
					{data.reading.spreads?.name ?? 'Lectura'} · {dtf.format(new Date(data.reading.created_at))}
				</p>
				{#if data.reading.owner_type === 'person' && data.reading.persons?.name}
					<p class="mt-1 text-sm text-zinc-600">Para: {data.reading.persons.name}</p>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				<a
					class="btn-back"
					href={backHref}
				>
					Volver
				</a>
				<a
					class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
					href={`/app/readings/${data.reading.id}/print?cards=${data.reading.spreads?.card_count ?? ''}&spread=${encodeURIComponent(
						data.reading.spreads?.name ?? ''
					)}`}
					target="_blank"
					rel="noreferrer"
				>
					Exportar PDF
				</a>
				<a
					class="cta-glow rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-zinc-800"
					href={newHref}
				>
					Nueva lectura
				</a>
			</div>
		</div>
	</header>

	{#if items.length === 0}
		<p class="mt-6 text-sm text-zinc-600">No hay cartas para esta lectura.</p>
	{:else}
		<div class="mt-6">
			{#if items.length > 1}
				<div class="flex items-center justify-between text-sm text-zinc-500 px-1">
					<div class="font-semibold text-zinc-700">{positionTitle(items[current])}</div>
					<div class="font-semibold">{current + 1} / {items.length}</div>
				</div>
			{/if}

			<div class="relative mt-3 px-4 sm:px-12">
				{#if items.length > 1}
					<button
						class="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 text-zinc-800 shadow-soft transition hover:scale-105 hover:shadow-lg disabled:opacity-50 dark:border-[color:hsl(var(--border))] dark:from-[color:hsl(var(--surface))] dark:to-[color:hsl(var(--border))] dark:text-[color:hsl(var(--text))]"
						type="button"
						onclick={prev}
						aria-label="Carta anterior"
						disabled={isFlipping}
					>
						<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M15 4 7 12l8 8" />
						</svg>
					</button>
					<button
						class="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 text-zinc-800 shadow-soft transition hover:scale-105 hover:shadow-lg disabled:opacity-50 dark:border-[color:hsl(var(--border))] dark:from-[color:hsl(var(--surface))] dark:to-[color:hsl(var(--border))] dark:text-[color:hsl(var(--text))]"
						type="button"
						onclick={next}
						aria-label="Carta siguiente"
						disabled={isFlipping}
					>
						<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="m9 4 8 8-8 8" />
						</svg>
					</button>
				{/if}

				<div
					class="surface relative overflow-visible rounded-2xl border border-zinc-200/60 bg-[hsl(var(--surface))] dark:border-[color:hsl(var(--border))]"
					style="min-height: clamp(640px, 82vh, 780px);"
				>
					{#key items[current]?.position_index ?? current}
						<article
							class={`card-presenter card-flip ${flipState === 'out'
								? direction === 1
									? 'flip-out-right'
									: 'flip-out-left'
								: flipState === 'in'
									? direction === 1
										? 'flip-in-right'
										: 'flip-in-left'
									: ''}`}
						>
							<div class="card-stage">
								<div class={`card-fire ${fireClass}`} aria-hidden="true"></div>
								<div class={`card-3d ${showBack ? 'is-revealed' : ''}`}>
									<div class="card-face card-front">
										{#if frontStatus === 'error'}
											<div class="card-back-fallback">
												<span>Frente no disponible</span>
											</div>
										{:else}
											<img
												class="h-full w-full object-cover"
												alt="Carta"
												src={frontImageUrl}
												loading="lazy"
												decoding="async"
												onerror={() => {
													console.warn('Front image error', frontImageUrl);
													frontStatus = 'error';
												}}
												onload={() => (frontStatus = 'ok')}
											/>
										{/if}
									</div>
									<div class="card-face card-back">
										{#if backStatus === 'error'}
											<div class="card-back-fallback flex flex-col gap-2 p-4 text-center text-xs">
												<span>Reverso no disponible</span>
												<span class="opacity-75">
													Slug: {detectArcangel(items[current]) || 'Ninguno'}
												</span>
												{#if backImageUrl}
													<span class="opacity-75 text-red-400 break-all">
														Error cargando: {backImageUrl}
													</span>
												{/if}
											</div>
										{:else}
											{#if backImageUrl}
												<img
													class="h-full w-full object-cover"
													alt="Reverso de la carta"
													src={backImageUrl}
													loading="lazy"
													decoding="async"
													onerror={() => {
														console.warn('Back image error', backImageUrl);
														backStatus = 'error';
													}}
													onload={() => (backStatus = 'ok')}
												/>
											{:else}
												<div class="card-back-fallback flex flex-col gap-2 p-4 text-center text-xs">
													<span>Reverso no disponible</span>
												</div>
											{/if}
										{/if}
									</div>
								</div>
							</div>

							<button
								class="reveal-button"
								type="button"
								onclick={() => (isRevealed ? hideCard() : revealCard())}
							>
								{isRevealed ? 'Ocultar carta' : 'Revelar carta'}
							</button>

						</article>
					{/key}
				</div>
			</div>
		</div>
	{/if}
</section>
