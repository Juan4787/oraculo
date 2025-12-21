<script lang="ts">
type Person = { id: string; name: string; tags: string[] };
let { data } = $props<{ data: { persons: Person[]; q: string } }>();

let q = $state(data.q ?? '');

function normalize(text: string) {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

const filteredPersons = $derived(() => {
	const needle = normalize(q);
	if (!needle) return data.persons;
	return data.persons.filter((person) => normalize(person.name).startsWith(needle));
});
</script>

<section class="surface p-6 sm:p-8">
	<header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div class="space-y-3">
			<a
				class="btn-back"
				href="/app/new-reading"
			>
				<span aria-hidden="true">←</span> Volver
			</a>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Perfiles</h1>
				<p class="text-sm text-zinc-600">Separá tus lecturas por persona, cliente o tema.</p>
			</div>
		</div>

		<div class="flex w-full flex-col items-end gap-3 md:w-auto">
			<a
				class="cta-glow inline-flex w-full max-w-xs items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold md:w-56"
				href="/app/admin/persons/new"
			>
				<span aria-hidden="true">＋</span> Nuevo perfil
			</a>
			<form class="w-full max-w-xs md:w-56">
				<label class="sr-only" for="q">Buscar</label>
				<input
					id="q"
					name="q"
					class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsla(var(--accent)/0.3)]"
					placeholder="Buscar por nombre o alias…"
					bind:value={q}
				/>
			</form>
		</div>
	</header>

	{#if filteredPersons.length === 0}
		<div class="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
			<div class="text-sm font-semibold text-zinc-900">No hay perfiles todavía.</div>
			<div class="mt-1 text-sm text-zinc-600">
				Creá un perfil para separar lecturas (ej: “Yo”, “Pareja”, “Cliente”).
			</div>
			<a
				class="cta-glow mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
				href="/app/admin/persons/new"
			>
				Crear perfil
			</a>
		</div>
	{:else}
		<ul class="mt-6 space-y-3">
			{#each filteredPersons as person}
				<li>
					<a class="surface person-card" href={`/app/admin/persons/${person.id}`}>
						<div class="person-avatar" aria-hidden="true">{person.name?.slice(0, 1) ?? 'P'}</div>
						<div class="min-w-0 flex-1 space-y-2">
							<div class="flex items-center justify-between gap-3">
								<div class="text-base font-semibold text-zinc-900 dark:text-[hsl(var(--text))]">
									{person.name}
								</div>
								<div class="text-xs font-semibold text-zinc-500 dark:text-[hsl(var(--muted))]">
									Última lectura: —
								</div>
							</div>
							{#if person.tags?.length}
								<div class="mt-3 flex flex-wrap gap-2">
									{#each person.tags.slice(0, 3) as tag}
										<span class="tag-pill">{tag}</span>
									{/each}
									{#if person.tags.length > 3}
										<span class="tag-pill muted">+{person.tags.length - 3}</span>
									{/if}
								</div>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
