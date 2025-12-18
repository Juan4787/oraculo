<script lang="ts">
type Person = { id: string; name: string; tags: string[] };
let { data } = $props<{ data: { persons: Person[]; q: string } }>();
</script>

<section class="surface p-6 sm:p-8">
	<header class="space-y-4">
		<div class="space-y-3">
			<a
				class="btn-back"
				href="/app/new-reading"
			>
				<span aria-hidden="true">←</span> Volver a Inicio
			</a>
			<h1 class="text-2xl font-semibold tracking-tight">Perfiles</h1>
			<p class="text-sm text-zinc-600">Separá tus lecturas por persona, cliente o tema.</p>
		</div>

		<form class="mt-4 max-w-md">
			<label class="sr-only" for="q">Buscar</label>
			<input
				id="q"
				name="q"
				class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
				placeholder="Buscar por nombre o alias…"
				value={data.q}
			/>
		</form>
	</header>

	{#if data.persons.length === 0}
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
			{#each data.persons as person}
				<li class="surface p-4">
					<a class="block" href={`/app/admin/persons/${person.id}`}>
						<div class="text-base font-semibold text-zinc-900">{person.name}</div>
						{#if person.tags?.length}
							<div class="mt-2 flex flex-wrap gap-2">
								{#each person.tags.slice(0, 6) as tag}
									<span class="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700">
										{tag}
									</span>
								{/each}
							</div>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
