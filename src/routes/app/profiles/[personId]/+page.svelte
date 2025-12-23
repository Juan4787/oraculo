<script lang="ts">
import { enhance } from '$app/forms';

type Reading = {
	id: string;
	created_at: string;
	spreads: { name: string; card_count: number } | null;
};

type Person = {
	id: string;
	name: string;
	tags: string[];
	notes: string | null;
	created_at: string;
};

let { data } = $props<{ data: { person: Person; readings: Reading[] } }>();

let showDeleteConfirm = $state(false);

function formatDate(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleDateString('es-AR', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
</script>

<section class="surface p-6 sm:p-8">
	<header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div class="space-y-3">
			<a class="btn-back" href="/app/profiles">
				<span aria-hidden="true">←</span> Volver
			</a>
			<div class="flex items-center gap-3">
				<div class="person-avatar text-2xl" aria-hidden="true">
					{data.person.name?.slice(0, 1) ?? 'P'}
				</div>
				<div>
					<h1 class="text-2xl font-semibold tracking-tight">{data.person.name}</h1>
					<p class="text-sm text-zinc-600 dark:text-[hsl(var(--muted))]">
						{data.readings.length} {data.readings.length === 1 ? 'lectura' : 'lecturas'}
					</p>
				</div>
			</div>
		</div>

		<div class="flex gap-2">
			<a
				class="cta-glow inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold"
				href={`/app/new-reading?personId=${data.person.id}`}
			>
				<span aria-hidden="true">📜</span> Nueva lectura
			</a>
			<button
				type="button"
				class="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-white hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-white"
				onclick={() => (showDeleteConfirm = true)}
			>
				Eliminar
			</button>
		</div>
	</header>

	{#if data.readings.length === 0}
		<div class="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--surface-alt))]">
			<div class="text-sm font-semibold text-zinc-900 dark:text-[hsl(var(--text))]">
				No hay lecturas todavía.
			</div>
			<div class="mt-1 text-sm text-zinc-600 dark:text-[hsl(var(--muted))]">
				Hacé una lectura para este perfil y aparecerá aquí.
			</div>
			<a
				class="cta-glow mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
				href={`/app/new-reading?personId=${data.person.id}`}
			>
				Hacer primera lectura
			</a>
		</div>
	{:else}
		<div class="mt-6">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-[hsl(var(--text))]">Historial de lecturas</h2>
			<ul class="mt-4 space-y-3">
				{#each data.readings as reading}
					<li>
						<a
							class="surface block rounded-xl p-4 transition-shadow hover:shadow-md"
							href={`/app/readings/${reading.id}`}
						>
							<div class="flex items-center justify-between">
								<div class="font-medium text-zinc-900 dark:text-[hsl(var(--text))]">
									{reading.spreads?.name ?? 'Lectura'}
								</div>
								<div class="text-xs text-zinc-500 dark:text-[hsl(var(--muted))]">
									{formatDate(reading.created_at)}
								</div>
							</div>
							<div class="mt-1 text-sm text-zinc-600 dark:text-[hsl(var(--muted))]">
								{reading.spreads?.card_count ?? '?'} {reading.spreads?.card_count === 1 ? 'carta' : 'cartas'}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>

{#if showDeleteConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="surface w-full max-w-sm rounded-2xl p-6">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-[hsl(var(--text))]">
				¿Eliminar perfil?
			</h2>
			<p class="mt-2 text-sm text-zinc-600 dark:text-[hsl(var(--muted))]">
				Se archivará el perfil "{data.person.name}" y sus lecturas asociadas.
			</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--surface))] dark:text-[hsl(var(--text))]"
					onclick={() => (showDeleteConfirm = false)}
				>
					Cancelar
				</button>
				<form method="POST" action="?/delete" use:enhance>
					<button
						type="submit"
						class="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
					>
						Eliminar
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
