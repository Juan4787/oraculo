<script lang="ts">
	const links = [
		{ href: '/app/admin/decks', label: 'Mazos' },
		{ href: '/app/admin/cards', label: 'Cartas' },
		{ href: '/app/admin/spreads', label: 'Tiradas' }
	];
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-2">
		<a
			class="btn-back"
			href="/app/new-reading"
		>
			<span aria-hidden="true">←</span> Volver
		</a>
		<h1 class="text-2xl font-semibold tracking-tight">Modo creador</h1>
		<p class="text-sm text-zinc-600">Gestioná tu oráculo sin mezclarlo con la experiencia de lectura.</p>
	</header>

	<div class="mt-6 grid gap-3 sm:grid-cols-4">
		{#each links as link}
			<a
				class="surface block rounded-2xl border border-zinc-200 p-4 text-sm font-semibold text-zinc-900 shadow-soft transition hover:bg-zinc-50"
				href={link.href}
			>
				{link.label}
				{#if link.label === 'Tiradas'}
					<p class="mt-1 text-xs font-normal text-zinc-600">Preconfiguradas: 1 y 3 cartas.</p>
				{/if}
			</a>
		{/each}
	</div>
</section>
