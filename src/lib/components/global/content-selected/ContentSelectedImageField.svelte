<script lang="ts">
	import Button from '#lib/components/ui/button/button.svelte';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { AlertTriangle, Image as ImageIcon, X } from '@lucide/svelte';

	interface Props {
		label?: string;
		value: string;
		imageAlt?: string;
		oninput: (val: string) => void;
	}

	let { label = 'Image URL', value, imageAlt = 'Preview', oninput }: Props = $props();

	let imgError = $state(false);

	$effect(() => {
		// Reset image error state whenever image url changes
		if (value) {
			imgError = false;
		}
	});
</script>

<div class="space-y-3">
	<div>
		<Label for="field-image-value" class="mb-2">
			<ImageIcon class="h-3.5 w-3.5 text-primary" />
			<span>{label}</span>
		</Label>
		<div class="relative">
			<Input
				id="field-image-value"
				type="url"
				{value}
				oninput={(event) => oninput(event.currentTarget.value)}
				placeholder="https://example.com/photo.webp"
			/>
			{#if value}
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					onclick={() => oninput('')}
					title="Clear image URL"
				>
					<X class="h-3.5 w-3.5" />
				</Button>
			{/if}
		</div>
	</div>

	<!-- Image Preview Box -->
	{#if value.trim()}
		<div
			class="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border"
		>
			{#if imgError}
				<div class="flex flex-col items-center gap-1 text-muted-foreground">
					<AlertTriangle class="h-6 w-6 text-amber-400/70" />
					<span class="text-[11px] text-muted-foreground">Unable to load preview from this URL</span
					>
				</div>
			{:else}
				<img
					src={value}
					alt={imageAlt}
					class="h-full w-full object-contain p-1"
					onerror={() => (imgError = true)}
				/>
			{/if}
		</div>
	{/if}
</div>
