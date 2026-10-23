<script lang="ts">
	import type { Field } from '#lib/protocol.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Check, Copy, RotateCcw, X } from '@lucide/svelte';

	interface Props {
		selected: Field;
		isModified: boolean;
		onreset?: () => void;
		onclose: () => void;
	}

	let { selected, isModified, onreset, onclose }: Props = $props();

	let copied = $state(false);

	async function copyId() {
		try {
			await navigator.clipboard.writeText(selected.id);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1800);
		} catch {
			// Fallback silently if clipboard is unavailable
		}
	}
</script>

<div class="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
	<div class="flex min-w-0 items-center gap-2.5">
		<!-- Field Type Badge & ID -->
		<div class="flex min-w-0 items-center gap-2">
			<Badge
				variant="info"
				class="hidden font-mono text-[10px] tracking-wider uppercase sm:inline-flex"
			>
				{selected.type}
			</Badge>

			<button
				type="button"
				class="flex items-center gap-1.5 rounded-md border border-white/8 bg-black/30 px-2 py-0.5 font-mono text-[11px] text-slate-400 transition-colors hover:border-white/15 hover:text-slate-200"
				onclick={copyId}
				title="Click to copy field ID"
			>
				<span class="max-w-[120px] truncate sm:max-w-[180px]">#{selected.id}</span>
				{#if copied}
					<span
						class="inline-flex items-center gap-0.5 font-sans text-[10px] font-medium text-emerald-400"
					>
						<Check class="h-3 w-3" />
						copied!
					</span>
				{:else}
					<Copy class="h-3 w-3 shrink-0 opacity-60" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Right Actions: Draft indicator, Reset, Close -->
	<div class="flex items-center gap-1.5">
		{#if isModified}
			<Badge variant="warning" class="gap-1.5 text-[10px]">
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"></span>
				Draft
			</Badge>

			{#if onreset}
				<Button
					type="button"
					variant="outline"
					size="xs"
					class="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
					onclick={onreset}
					title="Revert this field to published value"
				>
					<RotateCcw class="h-3 w-3" />
					<span>Reset</span>
				</Button>
			{/if}
		{/if}

		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			class="text-slate-400 hover:bg-white/10 hover:text-white"
			onclick={onclose}
			title="Close inspector (Esc)"
		>
			<X class="h-4 w-4" />
			<span class="sr-only">Close</span>
		</Button>
	</div>
</div>
