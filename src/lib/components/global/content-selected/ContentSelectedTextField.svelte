<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Type } from '@lucide/svelte';

	interface Props {
		label?: string;
		value: string;
		maxLength?: number;
		oninput: (val: string) => void;
	}

	let { label = 'Text Content', value, maxLength, oninput }: Props = $props();

	const charCount = $derived(value.length);
	const isOverMaxLength = $derived(Boolean(maxLength && charCount > maxLength));
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<Label for="field-text-value">
			<Type class="h-3.5 w-3.5 text-primary" />
			<span>{label}</span>
		</Label>
		<span
			class={`font-mono text-[11px] ${isOverMaxLength ? 'font-semibold text-red-400' : 'text-muted-foreground'}`}
		>
			{charCount}{maxLength ? ` / ${maxLength}` : ' chars'}
		</span>
	</div>

	<Input
		id="field-text-value"
		type="text"
		maxlength={maxLength ?? 5000}
		{value}
		oninput={(event) => oninput(event.currentTarget.value)}
		placeholder="Enter text..."
	/>
</div>
