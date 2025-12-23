<script lang="ts">
	import { page } from '$app/stores';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	const navBase = [
		{ href: '/app/new-reading', label: 'Nueva lectura', icon: '📜' },
		{ href: '/app/history', label: 'Historial', icon: '🗂️' }
	] as const;

	const isAdmin = $derived.by(() => data.role === 'owner' || data.role === 'staff');
	const navPeople = $derived.by(() =>
		isAdmin ? [{ href: '/app/admin/persons', label: 'Perfiles', icon: '👥' }] : []
	);
			const navAll = $derived.by(() => [...navBase, ...navPeople]);

	const isFocus = $derived($page.url.pathname.startsWith('/app/readings/'));

	let theme = $state<'light' | 'dark'>('dark');
	let userMenuOpen = $state(false);
	const userInitial = $derived((data.user.email ?? 'U').slice(0, 1).toUpperCase());

	function applyTheme(next: 'light' | 'dark') {
		theme = next;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('theme-dark', next === 'dark');
			document.body?.classList.toggle('theme-dark', next === 'dark');
			localStorage.setItem('theme', next);
		}
	}

	onMount(() => {
		const stored = localStorage.getItem('theme');
		if (stored === 'dark' || stored === 'light') {
			applyTheme(stored);
		} else {
			applyTheme('dark');
		}
	});

	$effect(() => {
		if (!dev) return;
		if (!$page.url.searchParams.has('debug')) return;

		queueMicrotask(() => {
			const themeDarkHtml = document.documentElement.classList.contains('theme-dark');
			const themeDarkBody = document.body.classList.contains('theme-dark');
			const ctas = Array.from(document.querySelectorAll<HTMLElement>('.cta-glow')).map((el) => {
				const styles = getComputedStyle(el);
				const icon = el.querySelector<HTMLElement>('[aria-hidden=\"true\"]');
				return {
					text: el.textContent?.trim() ?? '',
					className: el.className,
					color: styles.color,
					backgroundImage: styles.backgroundImage,
					backgroundColor: styles.backgroundColor,
					iconColor: icon ? getComputedStyle(icon).color : null
				};
			});

			console.info('[theme-debug]', { themeDarkHtml, themeDarkBody, ctas });
		});
	});
</script>

<div class="min-h-dvh" style="background-color: hsl(var(--bg));">
	<header
		class="sticky top-0 z-30 backdrop-blur print:hidden"
		style="background-color: hsl(var(--surface)); border-bottom: 1px solid hsl(var(--border));"
	>
		<div class="container-app flex h-14 items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<div class="min-w-0">
					<div class="truncate text-sm font-semibold text-zinc-900">
						{data.workspace?.name ?? 'Oráculo'}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					class="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-[color:hsl(var(--border))] dark:bg-[color:hsl(var(--surface))] dark:text-[color:hsl(var(--text))]"
					type="button"
					onclick={() => applyTheme(theme === 'light' ? 'dark' : 'light')}
				>
					<span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
					<span>{theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}</span>
				</button>

				<div class="relative">
					<button
						class="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-[color:hsl(var(--border))] dark:bg-[color:hsl(var(--surface))] dark:text-[color:hsl(var(--text))]"
						type="button"
						onclick={() => (userMenuOpen = !userMenuOpen)}
						aria-label="Menú de usuario"
					>
						{userInitial}
					</button>
					{#if userMenuOpen}
						<div
							class="fixed inset-0 z-40"
							role="button"
							tabindex="0"
							aria-label="Cerrar menú"
							onclick={() => (userMenuOpen = false)}
							onkeydown={(e) => e.key === 'Enter' && (userMenuOpen = false)}
						></div>
						<div class="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-[color:hsl(var(--border))] dark:bg-[color:hsl(var(--surface))]">
							{#if data.isMaster}
								<a
									class="block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:text-[color:hsl(var(--text))]"
									href="/app/master"
									onclick={() => (userMenuOpen = false)}
								>
									Panel maestro
								</a>
							{/if}
							{#if isAdmin}
								<a
									class="block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:text-[color:hsl(var(--text))]"
									href="/app/admin"
									onclick={() => (userMenuOpen = false)}
								>
									Modo creador
								</a>
							{/if}
							<a
								class="block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:text-[color:hsl(var(--text))]"
								href="/logout"
							>
								Cerrar sesión
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<div
		class="container-app grid grid-cols-1 gap-6 py-6 {data.workspace && !isFocus ? 'md:grid-cols-[260px_1fr]' : ''}"
	>
		{#if data.workspace && !isFocus}
			<nav class="surface sidebar-nav hidden h-fit p-4 md:block print:hidden">
				<div class="space-y-2">
					{#each navAll as item}
						<a
							class={`nav-link ${String($page.url.pathname) === item.href ? 'nav-link-active' : ''}`}
							href={item.href}
						>
							{#if item.icon}<span aria-hidden="true">{item.icon}</span>{/if}
							{item.label}
						</a>
					{/each}
				</div>
			</nav>
		{/if}

		<main class="min-w-0 pb-24 md:pb-0">{@render children()}</main>
	</div>

	{#if data.workspace && !isFocus}
		<nav
			class="fixed inset-x-0 bottom-0 z-40 backdrop-blur print:hidden md:hidden mobile-nav"
			style={`padding-bottom: env(safe-area-inset-bottom); background-color: hsl(var(--surface)); border-top: 1px solid hsl(var(--border));`}
		>
			<div class="container-app grid gap-2 py-2" style={`grid-template-columns: repeat(${navAll.length}, 1fr);`}>
				{#each navAll as item}
					<a
						class={`nav-link text-center text-xs font-medium ${String($page.url.pathname) === item.href ? 'nav-link-active' : ''}`}
						href={item.href}
					>
						{#if item.icon}<span aria-hidden="true">{item.icon}</span>{/if}
						{item.label}
					</a>
				{/each}
			</div>
		</nav>
	{/if}

</div>
