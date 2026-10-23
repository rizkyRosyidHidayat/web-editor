<script lang="ts">
	import { onMount } from 'svelte';
	import { isChildMessage, parentMessage, type ChildMessage, type Field } from '#lib/protocol.ts';
	import ContentSelected from '#lib/components/global/ContentSelected.svelte';

	let frame = $state<HTMLIFrameElement>();
	let previewUrl = $state('https://dnd-rust-mu.vercel.app/');
	let siteName = $state('Northstar Digital');
	let siteId = $state('demo-company-site');
	let fields = $state<Field[]>([]);
	let draft = $state<Record<string, string>>({});
	let published = $state<Record<string, string>>({});
	let selectedId = $state<string | null>(null);
	let editMode = $state(true);
	let connected = $state(false);
	let dirty = $state(false);
	let status = $state('Waiting for preview connection');
	type StatusKind = 'normal' | 'good' | 'warn' | 'error';
	let statusType = $state<StatusKind>('normal');
	let showSettings = $state(false);
	let viewport = $state<'desktop' | 'tablet' | 'mobile'>('desktop');
	let notice = $state('');

	const frameOrigin = $derived.by(() => {
		try {
			return new URL(previewUrl).origin;
		} catch {
			return '';
		}
	});

	const selectedField = $derived(fields.find((f) => f.id === selectedId) ?? null);

	function setStatus(value: string, type: StatusKind = 'normal') {
		status = value;
		statusType = type;
	}

	function post(message: unknown) {
		if (!frame?.contentWindow || !frameOrigin) return;
		frame.contentWindow.postMessage(message, frameOrigin);
	}

	function toggleEditMode() {
		editMode = !editMode;
		post(parentMessage('SET_EDIT_MODE', { enabled: editMode }));
		setStatus(
			editMode
				? 'Edit mode enabled — click elements in preview.'
				: 'Preview mode — links and buttons are active.',
			'good'
		);
	}

	function updateFieldValue(id: string, value: string) {
		draft[id] = value;
		dirty = fields.some((f) => (draft[f.id] ?? f.value) !== (published[f.id] ?? f.value));
		post(parentMessage('UPDATE_PREVIEW', { id, value }));
	}

	function clearSelection() {
		selectedId = null;
		// Clear selection box in iframe
		if (editMode) {
			post(parentMessage('SET_EDIT_MODE', { enabled: false }));
			post(parentMessage('SET_EDIT_MODE', { enabled: true }));
		}
		try {
			const doc = frame?.contentDocument || frame?.contentWindow?.document;
			doc?.querySelectorAll('[data-ve-selected]').forEach((el) => {
				el.removeAttribute('data-ve-selected');
			});
		} catch {
			// Cross-origin fallback handled by postMessage toggle above
		}
	}

	function resetFieldValue(id: string) {
		const original = published[id] ?? fields.find((f) => f.id === id)?.value ?? '';
		draft[id] = original;
		dirty = fields.some((f) => (draft[f.id] ?? f.value) !== (published[f.id] ?? f.value));
		post(parentMessage('RESTORE_PREVIEW', { id }));
		const label = fields.find((f) => f.id === id)?.label ?? id;
		setStatus(`Reset "${label}" to published version.`, 'good');
	}

	function loadPreview() {
		try {
			const url = new URL(previewUrl);
			if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
			connected = false;
			clearSelection();
			editMode = true;
			if (frame) frame.src = url.href;
			setStatus('Loading preview…');
		} catch {
			setStatus('Enter a valid HTTP(S) URL.', 'error');
		}
	}

	function injectIframeHoverStyles() {
		try {
			const doc = frame?.contentDocument || frame?.contentWindow?.document;
			if (!doc) return;
			const styleId = 've-hover-box-effects';
			let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
			if (!styleEl) {
				styleEl = doc.createElement('style');
				styleEl.id = styleId;
				doc.head?.appendChild(styleEl);
			}
			styleEl.textContent = `
				[data-ve-id] {
					transition: outline 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
				}
				:root[data-ve-edit-mode] [data-ve-id],
				html[data-ve-edit-mode] [data-ve-id],
				body[data-ve-edit-mode] [data-ve-id] {
					cursor: pointer !important;
				}
				:root[data-ve-edit-mode] [data-ve-id]:hover,
				html[data-ve-edit-mode] [data-ve-id]:hover,
				body[data-ve-edit-mode] [data-ve-id]:hover {
					outline: 2px dashed #6366f1 !important;
					outline-offset: 4px !important;
					box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25) !important;
				}
				[data-ve-selected="true"],
				[data-ve-id][data-ve-selected="true"] {
					outline: 2px solid #4f46e5 !important;
					outline-offset: 4px !important;
					box-shadow: 0 0 0 5px rgba(79, 70, 229, 0.35) !important;
				}
			`;
		} catch {
			// Cross-origin iframe restriction; child page CSS handles styles
		}
	}

	function frameLoaded() {
		injectIframeHoverStyles();
		post(parentMessage('PING'));
		setStatus('Iframe loaded. Waiting for SDK handshake…');
	}

	function onMessage(event: MessageEvent) {
		if (!frame?.contentWindow || event.source !== frame.contentWindow) return;
		if (!frameOrigin || event.origin !== frameOrigin) return;
		if (!isChildMessage(event.data)) return;
		const message: ChildMessage = event.data;
		if (message.type === 'EDITOR_READY') {
			siteId = message.siteId;
			connected = true;
			injectIframeHoverStyles();
			for (const field of message.fields) {
				const exists = fields.some((f) => f.id === field.id);
				if (!exists) fields.push({ ...field });
				if (draft[field.id] === undefined) draft[field.id] = field.value;
				if (published[field.id] === undefined) published[field.id] = field.value;
			}
			setStatus(`Connected to ${siteId}`, 'good');
			post(parentMessage('SET_EDIT_MODE', { enabled: editMode }));
		} else if (message.type === 'CONTENT_SELECTED') {
			selectedId = message.field.id;
			const existing = fields.find((f) => f.id === message.field.id);
			if (!existing) {
				fields.push({ ...message.field });
				if (draft[message.field.id] === undefined) {
					draft[message.field.id] = message.field.value;
				}
				if (published[message.field.id] === undefined) {
					published[message.field.id] = message.field.value;
				}
			} else {
				if (draft[existing.id] === undefined) {
					draft[existing.id] = message.field.value;
				}
				if (published[existing.id] === undefined) {
					published[existing.id] = message.field.value;
				}
			}
			setStatus(`Selected ${message.field.label}`, 'good');
		} else if (message.type === 'DESELECT') {
			clearSelection();
		} else if (message.type === 'PONG') {
			connected = true;
			setStatus(`Connected to ${message.siteId}`, 'good');
		} else if (message.type === 'SDK_ERROR') {
			setStatus(`Child SDK: ${message.message}`, 'error');
		}
	}

	function saveDraft() {
		try {
			localStorage.setItem(
				`visual-editor-draft:${siteId}`,
				JSON.stringify({ siteId, savedAt: new Date().toISOString(), values: draft })
			);
			dirty = false;
			notice = 'Saved in this browser local storage. Draft is ready for preview.';
			setStatus('Draft saved locally.', 'good');
		} catch {
			setStatus('Could not save draft in local storage.', 'error');
		}
	}

	function restoreDraft() {
		try {
			const raw = localStorage.getItem(`visual-editor-draft:${siteId}`);
			if (!raw) {
				setStatus('No local draft found.', 'warn');
				return;
			}
			const data = JSON.parse(raw) as { values?: Record<string, string> };
			if (!data.values) throw new Error();
			for (const field of fields) {
				if (typeof data.values[field.id] === 'string') {
					draft[field.id] = data.values[field.id];
					post(parentMessage('UPDATE_PREVIEW', { id: field.id, value: draft[field.id] }));
				}
			}
			dirty = fields.some((f) => (draft[f.id] ?? f.value) !== (published[f.id] ?? f.value));
			setStatus('Local draft restored.', 'good');
		} catch {
			setStatus('Unable to restore local draft.', 'error');
		}
	}

	function publishDemo() {
		published = { ...draft };
		dirty = false;
		notice =
			'Demo publish: marked as published in editor state. Connect a backend API for live production deployment.';
		setStatus('Changes marked as published.', 'good');
	}

	onMount(() => {
		window.addEventListener('message', onMessage);
		loadPreview();
		return () => window.removeEventListener('message', onMessage);
	});
</script>

<svelte:head>
	<title>Framecraft Studio — Visual Editor</title>
	<meta
		name="description"
		content="Visual content editor for websites integrated through an iframe SDK."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#0a0c12] text-slate-100">
	<!-- Top Navigation Header -->
	<header class="sticky top-0 z-30 border-b border-white/10 bg-[#0a0c12]/95 backdrop-blur-xl">
		<div class="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
			<!-- Logo & Site Info -->
			<div class="flex items-center gap-3">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-lg text-indigo-300 ring-1 ring-indigo-300/20"
				>
					▤
				</div>
				<div>
					<h1 class="text-sm font-semibold tracking-tight">
						Framecraft <span class="text-indigo-300">Studio</span>
					</h1>
					<div class="flex items-center gap-1.5">
						<span
							class={`inline-block h-1.5 w-1.5 rounded-full ${
								connected ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'
							}`}
						></span>
						<span class="text-[11px] text-slate-400">{siteName}</span>
					</div>
				</div>
			</div>

			<!-- Center Controls: Edit Mode Toggle & Viewport Switcher -->
			<div class="flex items-center gap-2">
				<!-- Edit Mode Toggle -->
				<button
					type="button"
					class={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
						editMode
							? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200 shadow-sm shadow-indigo-500/10'
							: 'border-white/10 bg-black/20 text-slate-400 hover:text-white'
					}`}
					onclick={toggleEditMode}
					title={editMode
						? 'Edit Mode active (click to preview)'
						: 'Preview Mode active (click to edit)'}
				>
					<span
						class={`h-2 w-2 rounded-full ${editMode ? 'animate-pulse bg-indigo-400' : 'bg-slate-500'}`}
					></span>
					<span>{editMode ? 'Edit Mode' : 'Preview Mode'}</span>
				</button>

				<!-- Viewport Buttons -->
				<div class="flex items-center gap-1 rounded-lg border border-white/8 bg-black/20 p-1">
					<button
						type="button"
						class={`rounded-md px-2.5 py-1 text-xs transition-colors ${
							viewport === 'desktop'
								? 'bg-white/10 font-medium text-white'
								: 'text-slate-400 hover:text-slate-200'
						}`}
						onclick={() => (viewport = 'desktop')}>Desktop</button
					>
					<button
						type="button"
						class={`rounded-md px-2.5 py-1 text-xs transition-colors ${
							viewport === 'tablet'
								? 'bg-white/10 font-medium text-white'
								: 'text-slate-400 hover:text-slate-200'
						}`}
						onclick={() => (viewport = 'tablet')}>Tablet</button
					>
					<button
						type="button"
						class={`rounded-md px-2.5 py-1 text-xs transition-colors ${
							viewport === 'mobile'
								? 'bg-white/10 font-medium text-white'
								: 'text-slate-400 hover:text-slate-200'
						}`}
						onclick={() => (viewport = 'mobile')}>Mobile</button
					>
					<button
						type="button"
						class="rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
						onclick={loadPreview}
						title="Reload preview"
					>
						↻
					</button>
				</div>
			</div>

			<!-- Right Actions: Save, Restore, Publish -->
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="hidden rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5 sm:inline-flex"
					onclick={() => (showSettings = !showSettings)}
				>
					⚙ Settings
				</button>
				<button
					type="button"
					class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5"
					onclick={restoreDraft}
				>
					Restore draft
				</button>
				<button
					type="button"
					class={`relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
						dirty
							? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400'
							: 'bg-white/10 text-slate-300 hover:bg-white/15'
					}`}
					onclick={saveDraft}
				>
					{#if dirty}
						<span
							class="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#0a0c12]"
						></span>
					{/if}
					Save draft
				</button>
				<button
					type="button"
					class="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-500"
					onclick={publishDemo}
				>
					Publish
				</button>
			</div>
		</div>

		<!-- Status & Notice Bar -->
		{#if notice}
			<div
				class="flex items-center justify-between border-t border-indigo-500/20 bg-indigo-950/40 px-4 py-1.5 text-xs text-indigo-200"
			>
				<div class="flex items-center gap-2">
					<span class="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
					<span>{notice}</span>
				</div>
				<button
					type="button"
					class="px-1 text-xs text-indigo-400 hover:text-white"
					onclick={() => (notice = '')}
				>
					✕
				</button>
			</div>
		{/if}
	</header>

	<!-- Settings Tray -->
	{#if showSettings}
		<section class="animate-in border-b border-white/10 bg-[#11141e] fade-in slide-in-from-top-2">
			<div
				class="mx-auto grid max-w-[1800px] gap-3 px-4 py-4 md:grid-cols-[1fr_220px_auto] lg:px-6"
			>
				<label class="text-xs text-slate-400">
					Child website URL
					<input
						bind:value={previewUrl}
						class="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
						placeholder="https://your-site.example"
					/>
				</label>
				<label class="text-xs text-slate-400">
					Site name
					<input
						bind:value={siteName}
						class="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
					/>
				</label>
				<div class="flex items-end">
					<button
						type="button"
						class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
						onclick={loadPreview}
					>
						Load preview
					</button>
				</div>
				<p class="text-xs leading-5 text-slate-500 md:col-span-3">
					The child website must install the companion SDK and allow this parent origin.
					{status ? `Current status: ${status}` : ''}
				</p>
			</div>
		</section>
	{/if}

	<!-- Main Canvas Area -->
	<main
		class={`relative mx-auto flex w-full flex-1 flex-col overflow-hidden transition-all duration-200 ${
			viewport === 'desktop'
				? 'w-full max-w-full'
				: viewport === 'tablet'
					? 'my-4 max-w-3xl overflow-hidden rounded-xl border border-white/10 shadow-2xl'
					: 'my-4 max-w-sm overflow-hidden rounded-xl border border-white/10 shadow-2xl'
		}`}
	>
		<iframe
			bind:this={frame}
			src={previewUrl}
			onload={frameLoaded}
			title="Child website preview"
			class="h-full w-full flex-1 border-0 bg-white"
			sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
			referrerpolicy="strict-origin-when-cross-origin"
		></iframe>

		<!-- Connection Waiting Overlay Pill -->
		{#if !connected}
			<div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
				<div
					class="flex items-center gap-2 rounded-full border border-white/10 bg-[#10131b]/90 px-4 py-2 text-xs text-slate-300 shadow-xl backdrop-blur-md"
				>
					<span
						class={`h-2 w-2 rounded-full ${
							statusType === 'good'
								? 'bg-emerald-400'
								: statusType === 'error'
									? 'bg-red-400'
									: statusType === 'warn'
										? 'bg-amber-400'
										: 'animate-pulse bg-indigo-400'
						}`}
					></span>
					<span>{status || 'Waiting for preview SDK handshake…'}</span>
				</div>
			</div>
		{/if}
	</main>
</div>

<!-- Floating Inspector for Selected Content -->
{#if selectedField}
	<ContentSelected
		selected={selectedField}
		value={draft[selectedField.id] ?? selectedField.value}
		publishedValue={published[selectedField.id] ?? selectedField.value}
		onupdate={(val) => updateFieldValue(selectedField.id, val)}
		onreset={() => resetFieldValue(selectedField.id)}
		onclose={clearSelection}
	/>
{/if}
