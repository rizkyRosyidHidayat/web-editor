<script lang="ts">
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { AlignLeft } from '@lucide/svelte';

	interface Props {
		label?: string;
		value: string;
		maxLength?: number;
		rows?: number;
		oninput: (val: string) => void;
	}

	let { label = 'Content Text', value, maxLength, rows = 4, oninput }: Props = $props();

	const charCount = $derived(value.length);
	const isOverMaxLength = $derived(Boolean(maxLength && charCount > maxLength));
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<Label for="field-textarea-value">
			<AlignLeft class="h-3.5 w-3.5 text-primary" />
			<span>{label}</span>
		</Label>
		<span
			class={`font-mono text-[11px] ${isOverMaxLength ? 'font-semibold text-red-400' : 'text-muted-foreground'}`}
		>
			{charCount}{maxLength ? ` / ${maxLength}` : ' chars'}
		</span>
	</div>

	<Textarea
		id="field-textarea-value"
		{rows}
		maxlength={maxLength ?? 5000}
		{value}
		oninput={(event) => oninput(event.currentTarget.value)}
		placeholder="Enter text..."
	/>
</div>
