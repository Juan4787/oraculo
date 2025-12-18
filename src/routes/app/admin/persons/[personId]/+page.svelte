<script lang="ts">
	import { enhance } from '$app/forms';

	type Person = { id: string; name: string; notes: string | null; tags: string[]; archived: boolean };
	type Reading = {
		id: string;
		created_at: string;
		spreads: { name: string; card_count: number } | null;
		reading_items: Array<{ position_index: number; snapshot: any }> | null;
	};

	let { data, form } = $props<{
		data: { person: Person; readings: Reading[]; signedUrls: Record<string, string> };
		form: any;
	}>();

	const dtf = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

	function previewItems(reading: Reading) {
		return (reading.reading_items ?? [])
			.slice()
			.sort((a, b) => a.position_index - b.position_index)
			.slice(0, 5);
	}
</script>

<section class="space-y-6">
	<div class="surface p-6 sm:p-8">
		<header class="flex items-start justify-between gap-3">
			<div class="min-w-0 space-y-3">
				<a
					class="btn-back"
					href="/app/admin/persons"
				>
					<span aria-hidden="true">←</span> Volver a Perfiles
				</a>
				<h1 class="text-2xl font-semibold tracking-tight">{data.person.name}</h1>
				<p class="text-sm text-zinc-600">Lecturas guardadas para este perfil.</p>
			</div>
			<a
				class="cta-glow rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
				href={`/app/new-reading?personId=${data.person.id}`}
			>
				Nueva lectura
			</a>
		</header>

		<form class="mt-6 max-w-2xl space-y-4" method="POST" action="?/update" use:enhance>
			<div class="space-y-2">
				<label class="text-sm font-medium text-zinc-800" for="name">Nombre o alias</label>
				<input
					id="name"
					name="name"
					class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
					value={data.person.name}
					required
				/>
			</div>

			<div class="space-y-2">
				<label class="text-sm font-medium text-zinc-800" for="tags">Etiquetas</label>
				<input
					id="tags"
					name="tags"
					class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
					value={data.person.tags?.join(', ') ?? ''}
				/>
			</div>

			<div class="space-y-2">
				<label class="text-sm font-medium text-zinc-800" for="notes">Notas internas</label>
				<textarea
					id="notes"
					name="notes"
					class="min-h-28 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
				>{data.person.notes ?? ''}</textarea>
			</div>

			{#if form?.message}
				<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
					{form.message}
				</div>
			{/if}

			<button
				class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
				type="submit"
			>
				Guardar cambios
			</button>
		</form>

		<div class="mt-4 flex flex-wrap gap-3">
			<form method="POST" action="?/archive" use:enhance>
				<button
					class="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
					type="submit"
				>
					Archivar persona
				</button>
			</form>

			<a
				class="btn-back"
				href="/app/admin/persons"
			>
				Volver
			</a>
		</div>
	</div>

	<div class="surface p-6 sm:p-8">
		<header class="space-y-2">
			<h2 class="text-lg font-semibold tracking-tight">Historial</h2>
			<p class="text-sm text-zinc-600">Últimas lecturas (máx. 20).</p>
		</header>

		{#if data.readings.length === 0}
			<div class="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
				<div class="text-sm font-semibold text-zinc-900">Todavía no hay lecturas.</div>
				<div class="mt-1 text-sm text-zinc-600">Iniciá una lectura y quedará guardada.</div>
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
								<div class="mt-1 text-xs text-zinc-600">{dtf.format(new Date(reading.created_at))}</div>
							</div>
							<a
								class="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
								href={`/app/readings/${reading.id}`}
							>
								Abrir
							</a>
						</div>

						<div class="mt-3 flex flex-wrap gap-2">
							{#each previewItems(reading) as item}
								{#if item.snapshot?.card?.image_path && data.signedUrls[item.snapshot.card.image_path]}
									<img
										class="h-14 w-10 rounded-lg border border-zinc-200 object-cover"
										style="aspect-ratio: 2 / 3;"
										alt={item.snapshot?.card?.name ?? 'Carta'}
										src={data.signedUrls[item.snapshot.card.image_path]}
										loading="lazy"
									/>
								{:else}
									<div
										class="h-14 w-10 rounded-lg border border-zinc-200 bg-zinc-100"
										style="aspect-ratio: 2 / 3;"
									></div>
								{/if}
							{/each}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
