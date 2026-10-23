<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { AlertTriangle, ExternalLink, Link as LinkIcon } from '@lucide/svelte';

	interface Props {
		label?: string;
		value: string;
		oninput: (val: string) => void;
	}

	let { label = 'Destination URL', value, oninput }: Props = $props();

	const isLinkValid = $derived.by(() => {
		const trimmed = value.trim();
		if (!trimmed) return true;
		return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(trimmed);
	});
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<Label
			for="field-link-value"
			class="flex items-center gap-1.5 text-xs font-medium text-slate-300"
		>
			<LinkIcon class="h-3.5 w-3.5 text-indigo-400" />
			<span>{label}</span>
		</Label>

		{#if value.trim() && isLinkValid}
			<button
				type="button"
				onclick={() => window.open(value, '_blank', 'noopener,noreferrer')}
				class="flex items-center gap-1 text-[11px] text-indigo-400 transition-colors hover:text-indigo-300"
			>
				<span>Test link</span>
				<ExternalLink class="h-3 w-3" />
			</button>
		{/if}
	</div>

	<Input
		id="field-link-value"
		type="text"
		{value}
		oninput={(event) => oninput(event.currentTarget.value)}
		class={`h-9 rounded-xl bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 transition-colors placeholder:text-slate-600 ${
			!isLinkValid
				? 'border-amber-400/50 focus-visible:border-amber-400 focus-visible:ring-amber-400/30'
				: 'border-white/10 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40'
		}`}
		placeholder="/about, https://example.com, mailto:hi@test.com"
	/>

	{#if !isLinkValid}
		<p class="flex items-center gap-1.5 text-[11px] text-amber-400/90">
			<AlertTriangle class="h-3.5 w-3.5 shrink-0" />
			Must start with relative (/ or #), https://, http://, mailto:, or tel:
		</p>
	{:else}
		<p class="text-[10px] text-slate-500">
			Supports relative paths (/contact), absolute URLs, mailto:, or tel:
		</p>
	{/if}
</div>
