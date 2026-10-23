<script lang="ts">
	import type { Field, ParentMessage } from '#lib/protocol.ts';

	let {
		draft,
		published,
		dirty,
		setStatus,
		post,
		parentMessage,
		editMode,
		fields,
		connected
	}: {
		draft: Record<string, string>;
		published: Record<string, string>;
		dirty: boolean;
		setStatus: (msg: string, type?: 'warn' | 'info' | 'success') => void;
		post: (m: ParentMessage) => void;
		parentMessage: <T extends ParentMessage['type']>(
			type: T,
			payload?: Omit<Extract<ParentMessage, { type: T }>, 'channel' | 'version' | 'type'>
		) => Extract<ParentMessage, { type: T }>;
		editMode: boolean;
		fields: Field[];
		connected: boolean;
	} = $props();

	let savedAt = $state('');
	let selectedId = $state<string | null>(null);
	const selected = $derived(fields.find((f) => f.id === selectedId) ?? null);
	const selectedValue = $derived(selected ? (draft[selected.id] ?? selected.value) : '');

	function toggleEdit() {
		editMode = !editMode;
		post(parentMessage('SET_EDIT_MODE', { enabled: editMode }));
		setStatus(editMode ? 'Edit mode enabled — click content in preview.' : 'Edit mode disabled.');
	}
	function updateValue(value: string) {
		if (!selected) return;
		if (selected.maxLength && value.length > selected.maxLength) {
			setStatus(`Maximum ${selected.maxLength} characters.`, 'warn');
			return;
		}
		if (
			selected.type === 'link' &&
			value.trim() &&
			!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(value.trim())
		) {
			setStatus('Use a relative URL, http(s), mailto, or tel URL.', 'warn');
			return;
		}
		draft[selected.id] = value;
		dirty = fields.some((f) => (draft[f.id] ?? f.value) !== (published[f.id] ?? f.value));
		post(parentMessage('UPDATE_PREVIEW', { id: selected.id, value }));
	}
</script>

<aside
	class="order-3 flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#10131b]"
>
	<div class="border-b border-white/8 px-4 py-4">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold">Properties</h2>
			{#if selected}<span class="rounded-md bg-indigo-400/10 px-2 py-1 text-[10px] text-indigo-300"
					>{selected.type}</span
				>{/if}
		</div>
		<p class="mt-1 text-xs text-slate-500">Edit the selected content.</p>
	</div>
	{#if selected}
		<div class="flex-1 space-y-5 p-4">
			<div>
				<label for="field-name" class="mb-2 block text-xs font-medium text-slate-300"
					>Field name</label
				><input
					id="field-name"
					value={selected.label}
					readonly
					class="w-full rounded-lg border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-slate-400 outline-none"
				/>
			</div>
			<div>
				<div class="mb-2 block text-xs font-medium text-slate-300">Content ID</div>
				<div
					class="rounded-lg border border-white/8 bg-black/20 px-3 py-2.5 font-mono text-[11px] break-all text-slate-500"
				>
					{selected.id}
				</div>
			</div>
			{#if selected.type === 'textarea'}
				<div>
					<div class="mb-2 flex justify-between">
						<label for="field-value" class="text-xs font-medium text-slate-300">Content</label><span
							class="text-[10px] text-slate-600"
							>{selectedValue.length}{selected.maxLength ? ` / ${selected.maxLength}` : ''}</span
						>
					</div>
					<textarea
						id="field-value"
						rows="7"
						maxlength={selected.maxLength ?? 5000}
						value={selectedValue}
						oninput={(event) => updateValue(event.currentTarget.value)}
						class="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-indigo-400/60"
					></textarea>
				</div>
			{:else if selected.type === 'image'}
				<div>
					<label for="field-value" class="mb-2 block text-xs font-medium text-slate-300"
						>Image URL</label
					><input
						id="field-value"
						type="url"
						value={selectedValue}
						oninput={(event) => updateValue(event.currentTarget.value)}
						class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400/60"
						placeholder="https://example.com/image.webp"
					/>
				</div>
			{:else if selected.type === 'link'}
				<div>
					<label for="field-value" class="mb-2 block text-xs font-medium text-slate-300"
						>Destination URL</label
					><input
						id="field-value"
						type="text"
						value={selectedValue}
						oninput={(event) => updateValue(event.currentTarget.value)}
						class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400/60"
						placeholder="/contact"
					/>
					<p class="mt-2 text-[10px] leading-4 text-slate-600">
						Allowed: relative URLs, http(s), mailto, tel.
					</p>
				</div>
			{:else}
				<div>
					<div class="mb-2 flex justify-between">
						<label for="field-value" class="text-xs font-medium text-slate-300">Text content</label
						><span class="text-[10px] text-slate-600"
							>{selectedValue.length}{selected.maxLength ? ` / ${selected.maxLength}` : ''}</span
						>
					</div>
					<input
						id="field-value"
						type="text"
						maxlength={selected.maxLength ?? 5000}
						value={selectedValue}
						oninput={(event) => updateValue(event.currentTarget.value)}
						class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400/60"
					/>
				</div>
			{/if}
			<div class="rounded-xl border border-white/8 bg-white/[0.025] p-3">
				<div class="mb-2 text-xs font-medium text-slate-300">✦ Editing tips</div>
				<ul class="space-y-1.5 text-[11px] leading-5 text-slate-500">
					<li>• Changes preview immediately.</li>
					<li>• Save draft stores data in this browser.</li>
					<li>• Live publishing needs backend integration.</li>
				</ul>
			</div>
			<button
				class="w-full rounded-lg border border-white/10 px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5"
				onclick={() => {
					if (!selected) return;
					draft[selected.id] = published[selected.id] ?? selected.value;
					post(parentMessage('RESTORE_PREVIEW', { id: selected.id }));
					dirty = fields.some((f) => (draft[f.id] ?? f.value) !== (published[f.id] ?? f.value));
				}}>Reset selected field</button
			>
		</div>
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
			<div
				class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl text-slate-500"
			>
				▤
			</div>
			<p class="text-sm font-medium text-slate-300">Nothing selected</p>
			<p class="mt-2 max-w-52 text-xs leading-5 text-slate-600">
				Enable select mode and click content in the preview, or choose a field on the left.
			</p>
			<button
				class="mt-5 rounded-lg bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/20 hover:bg-indigo-500/20"
				onclick={toggleEdit}
				disabled={!connected}>Select content</button
			>
		</div>
	{/if}
	<div class="border-t border-white/8 p-4">
		<div class="mb-2 flex justify-between text-[10px] text-slate-500">
			<span>Draft status</span><span class={dirty ? 'text-amber-300' : 'text-emerald-300'}
				>{dirty ? 'Unsaved' : 'Saved'}</span
			>
		</div>
		<div class="h-1.5 overflow-hidden rounded-full bg-white/5">
			<div
				class={`h-full rounded-full transition-all ${dirty ? 'w-2/3 bg-amber-400' : 'w-full bg-emerald-400/70'}`}
			></div>
		</div>
		{#if savedAt}<p class="mt-2 text-[10px] text-slate-600">
				Last local save: {savedAt}
			</p>{/if}
	</div>
</aside>
