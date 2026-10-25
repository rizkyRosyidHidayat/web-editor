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
		<Label for="field-link-value">
			<LinkIcon class="h-3.5 w-3.5 text-primary" />
			<span>{label}</span>
		</Label>

		{#if value.trim() && isLinkValid}
			<button
				type="button"
				onclick={() => window.open(value, '_blank', 'noopener,noreferrer')}
				class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
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
		placeholder="/about, https://example.com, mailto:hi@test.com"
	/>

	{#if !isLinkValid}
		<p class="flex items-center gap-1.5 text-[11px] text-destructive">
			<AlertTriangle class="h-3.5 w-3.5 shrink-0" />
			Must start with relative (/ or #), https://, http://, mailto:, or tel:
		</p>
	{:else}
		<p class="text-[10px] text-muted-foreground">
			Supports relative paths (/contact), absolute URLs, mailto:, or tel:
		</p>
	{/if}
</div>
