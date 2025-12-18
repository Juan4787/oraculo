<script lang="ts">
	let { data } = $props();
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">{data.workspace?.name ?? 'Oráculo'}</h1>
		<p class="text-sm text-zinc-600">Elegí una tirada y recibí tu mensaje.</p>
	</header>

	<div class="mt-6 grid gap-3 sm:grid-cols-3">
		<div class="surface flex flex-col justify-between gap-3 p-4 shadow-soft">
			<div class="space-y-1">
				<div class="text-base font-semibold text-zinc-900">Nueva lectura</div>
				<p class="text-sm text-zinc-600">Hacé una tirada ahora.</p>
			</div>
			<a
				class="cta-glow w-full rounded-xl bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-soft transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
				href="/app/new-reading"
			>
				Nueva lectura
			</a>
		</div>

		<div class="surface flex flex-col justify-between gap-3 p-4 shadow-soft">
			<div class="space-y-1">
				<div class="text-base font-semibold text-zinc-900">Historial</div>
				<p class="text-sm text-zinc-600">Revisá lecturas anteriores.</p>
			</div>
			<a
				class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
				href="/app/history"
			>
				Ir a historial
			</a>
		</div>

		{#if data.role === 'owner' || data.role === 'staff'}
			<div class="surface flex flex-col justify-between gap-3 p-4 shadow-soft">
				<div class="space-y-1">
					<div class="text-base font-semibold text-zinc-900">Perfiles</div>
					<p class="text-sm text-zinc-600">Separá lecturas por persona.</p>
				</div>
				<a
					class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
					href="/app/admin/persons"
				>
					Ver perfiles
				</a>
			</div>
		{/if}
	</div>
</section>
