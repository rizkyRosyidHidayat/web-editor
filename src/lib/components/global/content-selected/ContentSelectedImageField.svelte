<script lang="ts">
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
		<Label
			for="field-image-value"
			class="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-300"
		>
			<ImageIcon class="h-3.5 w-3.5 text-indigo-400" />
			<span>{label}</span>
		</Label>
		<div class="relative">
			<Input
				id="field-image-value"
				type="url"
				{value}
				oninput={(event) => oninput(event.currentTarget.value)}
				class="h-9 rounded-xl border-white/10 bg-black/30 px-3.5 py-2.5 pr-9 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40"
				placeholder="https://example.com/photo.webp"
			/>
			{#if value}
				<button
					type="button"
					class="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-slate-500 transition-colors hover:text-slate-300"
					onclick={() => oninput('')}
					title="Clear image URL"
				>
					<X class="h-3.5 w-3.5" />
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
					<AlertTriangle class="h-6 w-6 text-amber-400/70" />
					<span class="text-[11px] text-slate-400">Unable to load preview from this URL</span>
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
