<script lang="ts">
	import { enhance } from '$app/forms';

	type AllowedEmail = {
		id: string;
		email: string;
		enabled: boolean;
		created_at: string;
		updated_at: string;
	};

	let { data, form } = $props<{
		data: { emails: AllowedEmail[]; loadError: string | null; masterEmail: string };
		form: any;
	}>();

	let query = $state('');
	let confirmAction = $state<null | { type: 'disable' | 'delete'; id: string; email: string }>(null);
	let confirmInput = $state('');

	const filteredEmails = $derived(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) return data.emails;
		return data.emails.filter((item) => item.email.toLowerCase().includes(needle));
	});

	const enabledCount = $derived(() => data.emails.filter((item) => item.enabled).length);
	const disabledCount = $derived(() => data.emails.length - enabledCount);

	$effect(() => {
		if (confirmAction) confirmInput = '';
	});

	$effect(() => {
		if (form?.success && (form.intent === 'disable_email' || form.intent === 'delete_email')) {
			confirmAction = null;
		}
	});
</script>

<section class="surface p-6 sm:p-8">
	<header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div class="space-y-3">
			<a class="btn-back" href="/app/new-reading">
				<span aria-hidden="true">←</span> Volver
			</a>
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Panel maestro</p>
				<h1 class="text-2xl font-semibold tracking-tight">Control de accesos</h1>
				<p class="text-sm text-zinc-600">
					Habilitá o deshabilitá emails para que puedan crear cuenta.
				</p>
			</div>
		</div>
		<div class="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
			<div class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Master</div>
			<div class="mt-1 font-semibold text-zinc-800">{data.masterEmail}</div>
		</div>
	</header>

	<div class="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
		<div class="surface p-5">
			<h2 class="text-lg font-semibold text-zinc-900">Habilitar nuevo email</h2>
			<p class="mt-1 text-sm text-zinc-600">Pegá el email y listo. Se habilita automáticamente.</p>
			<form class="mt-4 space-y-3" method="post" action="?/add_email" use:enhance>
				<div class="space-y-2">
					<label class="text-sm font-medium text-zinc-800" for="email">Email a habilitar</label>
					<input
						id="email"
						name="email"
						class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
						placeholder="persona@email.com"
						type="email"
						autocomplete="off"
						required
						value={form?.intent === 'add_email' ? form?.email ?? '' : ''}
					/>
				</div>

				{#if form?.message && form?.intent === 'add_email'}
					<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
						{form.message}
					</div>
				{/if}

				<button class="cta-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold" type="submit">
					Habilitar email
				</button>
			</form>
		</div>

		<div class="surface p-5">
			<h2 class="text-lg font-semibold text-zinc-900">Resumen rápido</h2>
			<div class="mt-4 grid gap-3">
				<div class="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Habilitados</p>
					<p class="mt-1 text-2xl font-semibold text-zinc-900">{enabledCount}</p>
				</div>
				<div class="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Deshabilitados</p>
					<p class="mt-1 text-2xl font-semibold text-zinc-900">{disabledCount}</p>
				</div>
				<div class="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
					Si deshabilitás un email, esa persona no podrá iniciar sesión ni registrarse.
				</div>
			</div>
		</div>
	</div>

	<div class="mt-8 space-y-4">
		<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<h2 class="text-lg font-semibold text-zinc-900">Emails habilitados</h2>
			<div class="w-full max-w-xs">
				<label class="sr-only" for="search">Buscar email</label>
				<input
					id="search"
					class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
					placeholder="Buscar por email"
					bind:value={query}
				/>
			</div>
		</div>

		{#if form?.message && form?.intent === 'enable_email'}
			<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
				{form.message}
			</div>
		{/if}

		{#if data.loadError}
			<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
				{data.loadError}
			</div>
		{:else if filteredEmails.length === 0}
			<div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
				<div class="text-sm font-semibold text-zinc-900">No hay emails todavía.</div>
				<div class="mt-1 text-sm text-zinc-600">Agregá uno arriba para habilitar el acceso.</div>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each filteredEmails as item}
					<div class="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="min-w-0">
							<p class="text-base font-semibold text-zinc-900">{item.email}</p>
							<p class="mt-1 text-xs text-zinc-500">
								{item.enabled ? 'Habilitado para crear cuenta e ingresar.' : 'Deshabilitado para ingresar.'}
							</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<span class={`tag-pill ${item.enabled ? '' : 'muted'}`}>
								{item.enabled ? 'Habilitado' : 'Deshabilitado'}
							</span>

							{#if item.enabled}
								<button
									type="button"
									class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
									onclick={() => (confirmAction = { type: 'disable', id: item.id, email: item.email })}
								>
									Deshabilitar
								</button>
							{:else}
								<form method="post" action="?/enable_email" use:enhance>
									<input type="hidden" name="id" value={item.id} />
									<input type="hidden" name="email" value={item.email} />
									<button
										class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
										type="submit"
									>
										Habilitar
									</button>
								</form>
							{/if}

							<button
								type="button"
								class="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
								onclick={() => (confirmAction = { type: 'delete', id: item.id, email: item.email })}
							>
								Eliminar
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if confirmAction}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur">
		<div class="surface w-full max-w-md p-6">
			<h3 class="text-lg font-semibold text-zinc-900">
				{confirmAction.type === 'disable' ? 'Deshabilitar email' : 'Eliminar email'}
			</h3>
			<p class="mt-2 text-sm text-zinc-600">
				Para confirmar, escribí
				<strong class="text-zinc-900">
					{confirmAction.type === 'disable' ? 'deshabilitar' : 'eliminar'}
				</strong>
				y presioná continuar.
			</p>

			<form
				class="mt-4 space-y-3"
				method="post"
				action={confirmAction.type === 'disable' ? '?/disable_email' : '?/delete_email'}
				use:enhance
			>
				<input type="hidden" name="id" value={confirmAction.id} />
				<input type="hidden" name="email" value={confirmAction.email} />
				<div class="space-y-2">
					<label class="text-sm font-medium text-zinc-800" for="confirm">Confirmación</label>
					<input
						id="confirm"
						name="confirm"
						class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
						placeholder={confirmAction.type === 'disable' ? 'deshabilitar' : 'eliminar'}
						bind:value={confirmInput}
						autocomplete="off"
						required
					/>
				</div>

				{#if form?.message && form?.intent === `${confirmAction.type}_email`}
					<div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
						{form.message}
					</div>
				{/if}

				<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
					<button
						class="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
						type="button"
						onclick={() => (confirmAction = null)}
					>
						Cancelar
					</button>
					<button
						class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
						type="submit"
						disabled={
							confirmInput.trim().toLowerCase() !==
							(confirmAction.type === 'disable' ? 'deshabilitar' : 'eliminar')
						}
					>
						Confirmar
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
