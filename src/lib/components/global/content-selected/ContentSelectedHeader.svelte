<script lang="ts">
	import type { Field } from '#lib/protocol.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
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

<Card.Header class="flex items-center justify-between">
	<div class="flex flex-1 items-center gap-2">
		<!-- Field Type Badge & ID -->
		<div class="flex flex-1 items-center gap-2">
			<Badge variant="info" class="hidden text-[10px] tracking-wider uppercase sm:inline-flex">
				{selected.type}
			</Badge>

			<Button
				type="button"
				variant="secondary"
				size="xs"
				onclick={copyId}
				title="Click to copy field ID"
			>
				<span>#{selected.id}</span>
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
			</Button>
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
			onclick={onclose}
			title="Close inspector (Esc)"
		>
			<X class="h-4 w-4" />
			<span class="sr-only">Close</span>
		</Button>
	</div>
</Card.Header>
