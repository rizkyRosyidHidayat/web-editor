<script lang="ts">
	import type { Field } from '#lib/protocol.ts';

	interface Props {
		selected: Field;
		value: string;
		publishedValue?: string;
		onupdate: (value: string) => void;
		onreset?: () => void;
		onclose: () => void;
	}

	let { selected, value, publishedValue, onupdate, onreset, onclose }: Props = $props();

	let copied = $state(false);
	let imgError = $state(false);

	$effect(() => {
		// Reset image error state whenever selected element or image url changes
		if (selected.id || value) {
			imgError = false;
		}
	});

	const isModified = $derived(
		publishedValue !== undefined ? value !== publishedValue : value !== selected.value
	);

	const charCount = $derived(value.length);
	const isOverMaxLength = $derived(Boolean(selected.maxLength && charCount > selected.maxLength));

	const isLinkValid = $derived.by(() => {
		if (selected.type !== 'link') return true;
		const trimmed = value.trim();
		if (!trimmed) return true;
		return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(trimmed);
	});

	function handleInput(newValue: string) {
		onupdate(newValue);
	}

	async function copyId() {
		try {
			await navigator.clipboard.writeText(selected.id);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1800);
		} catch {
			// Fallback silently if clipboard unavailable
		}
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			onclose();
		}
	}}
/>

<!-- Click-outside backdrop with keyboard accessibility -->
<div class="fixed inset-0 z-40 bg-transparent" onclick={onclose} aria-hidden="true"></div>

<!-- Floating Inspector Dock -->
<div class="fixed bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4 sm:px-6">
	<div
		class="overflow-hidden rounded-2xl border border-white/12 bg-[#10131b]/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
	>
		<!-- Card Header -->
		<div class="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
			<div class="flex min-w-0 items-center gap-2.5">
				<!-- Field Name & ID -->
				<div class="flex min-w-0 items-center gap-2">
					<span
						class="hidden rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium tracking-wide text-indigo-300 uppercase ring-1 ring-white/10 sm:inline-block"
					>
						{selected.type}
					</span>
					<button
						type="button"
						class="flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 transition-colors hover:text-slate-200"
						onclick={copyId}
						title="Click to copy field ID"
					>
						<span class="max-w-[120px] truncate sm:max-w-[180px]">#{selected.id}</span>
						{#if copied}
							<span class="font-sans text-[9px] text-emerald-400">copied!</span>
						{:else}
							<svg
								class="h-2.5 w-2.5 shrink-0 opacity-60"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Right Actions: Revert, Modified Pill, Close -->
			<div class="flex items-center gap-1.5">
				{#if isModified}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-400/20"
					>
						<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"></span>
						Draft
					</span>
					{#if onreset}
						<button
							type="button"
							class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
							onclick={onreset}
							title="Revert this field to published value"
						>
							<svg
								class="h-3 w-3"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M3 10h10a5 5 0 015 5v2m0 0l-3-3m3 3l3-3M3 10l3 3m-3-3l3-3"
								/>
							</svg>
							<span>Reset</span>
						</button>
					{/if}
				{/if}

				<button
					type="button"
					class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
					onclick={onclose}
					title="Close inspector (Esc)"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Card Body -->
		<div class="space-y-3 p-4 sm:p-5">
			{#if selected.type === 'textarea'}
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label for="field-textarea-value" class="text-xs font-medium text-slate-300">
							Content Text
						</label>
						<span
							class={`font-mono text-[11px] ${isOverMaxLength ? 'font-semibold text-red-400' : 'text-slate-500'}`}
						>
							{charCount}{selected.maxLength ? ` / ${selected.maxLength}` : ' chars'}
						</span>
					</div>
					<textarea
						id="field-textarea-value"
						rows="4"
						maxlength={selected.maxLength ?? 5000}
						{value}
						oninput={(event) => handleInput(event.currentTarget.value)}
						placeholder="Enter text..."
						class="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm leading-relaxed text-slate-100 placeholder-slate-600 transition-colors outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/40"
					></textarea>
				</div>
			{:else if selected.type === 'image'}
				<div class="space-y-3">
					<div>
						<label for="field-image-value" class="mb-2 block text-xs font-medium text-slate-300">
							Image URL
						</label>
						<div class="relative">
							<input
								id="field-image-value"
								type="url"
								{value}
								oninput={(event) => handleInput(event.currentTarget.value)}
								class="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 pr-9 text-sm text-slate-100 placeholder-slate-600 transition-colors outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/40"
								placeholder="https://example.com/photo.webp"
							/>
							{#if value}
								<button
									type="button"
									class="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
									onclick={() => handleInput('')}
									title="Clear image URL"
								>
									<svg
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					</div>

					<!-- Image Preview Box -->
					{#if value.trim()}
						<div
							class="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-black/40"
						>
							{#if imgError}
								<div class="flex flex-col items-center gap-1 text-slate-500">
									<svg
										class="h-6 w-6 text-amber-400/70"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="1.5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<span class="text-[11px] text-slate-400"
										>Unable to load preview from this URL</span
									>
								</div>
							{:else}
								<img
									src={value}
									alt={selected.label || 'Preview'}
									class="h-full w-full object-contain p-1"
									onerror={() => (imgError = true)}
								/>
							{/if}
						</div>
					{/if}
				</div>
			{:else if selected.type === 'link'}
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label for="field-link-value" class="text-xs font-medium text-slate-300">
							Destination URL
						</label>
						{#if value.trim() && isLinkValid}
							<button
								type="button"
								onclick={() => window.open(value, '_blank', 'noopener,noreferrer')}
								class="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
							>
								<span>Test link</span>
								<svg
									class="h-3 w-3"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</button>
						{/if}
					</div>
					<input
						id="field-link-value"
						type="text"
						{value}
						oninput={(event) => handleInput(event.currentTarget.value)}
						class={`w-full rounded-xl border bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors outline-none focus:ring-1 ${
							!isLinkValid
								? 'border-amber-400/50 focus:border-amber-400 focus:ring-amber-400/30'
								: 'border-white/10 focus:border-indigo-400 focus:ring-indigo-400/40'
						}`}
						placeholder="/about, https://example.com, mailto:hi@test.com"
					/>
					{#if !isLinkValid}
						<p class="flex items-center gap-1.5 text-[11px] text-amber-400/90">
							<svg
								class="h-3.5 w-3.5 shrink-0"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							Must start with relative (/ or #), https://, http://, mailto:, or tel:
						</p>
					{:else}
						<p class="text-[10px] text-slate-500">
							Supports relative paths (/contact), absolute URLs, mailto:, or tel:
						</p>
					{/if}
				</div>
			{:else}
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label for="field-text-value" class="text-xs font-medium text-slate-300">
							Text Content
						</label>
						<span
							class={`font-mono text-[11px] ${isOverMaxLength ? 'font-semibold text-red-400' : 'text-slate-500'}`}
						>
							{charCount}{selected.maxLength ? ` / ${selected.maxLength}` : ' chars'}
						</span>
					</div>
					<input
						id="field-text-value"
						type="text"
						maxlength={selected.maxLength ?? 5000}
						{value}
						oninput={(event) => handleInput(event.currentTarget.value)}
						placeholder="Enter text..."
						class="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/40"
					/>
				</div>
			{/if}
		</div>

		<!-- Card Footer -->
		<div
			class="flex items-center justify-between border-t border-white/8 bg-black/20 px-4 py-2.5 sm:px-5"
		>
			<div class="flex items-center gap-2 text-[11px] text-slate-500">
				<span class="hidden text-slate-600 sm:inline"
					>Press <kbd
						class="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px] text-slate-400"
						>Esc</kbd
					> to close</span
				>
			</div>
			<button
				type="button"
				class="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
				onclick={onclose}
			>
				Done
			</button>
		</div>
	</div>
</div>
