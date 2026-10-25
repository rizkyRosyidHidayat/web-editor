<script lang="ts">
	import type { Field } from '#lib/protocol.ts';
	import * as Card from '#lib/components/ui/card/index.js';
	import {
		ContentSelectedHeader,
		ContentSelectedFooter,
		ContentSelectedTextField,
		ContentSelectedTextareaField,
		ContentSelectedImageField,
		ContentSelectedLinkField
	} from './content-selected/index.js';

	interface Props {
		selected: Field;
		value: string;
		publishedValue?: string;
		onupdate: (value: string) => void;
		onreset?: () => void;
		onclose: () => void;
	}

	let { selected, value, publishedValue, onupdate, onreset, onclose }: Props = $props();

	const isModified = $derived(
		publishedValue !== undefined ? value !== publishedValue : value !== selected.value
	);

	function handleInput(newValue: string) {
		onupdate(newValue);
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
	<Card.Root class="gap-0">
		<!-- Header -->
		<ContentSelectedHeader {selected} {isModified} {onreset} {onclose} />

		<!-- Field Editor Body -->
		<div class="p-4 sm:p-5">
			{#if selected.type === 'textarea'}
				<ContentSelectedTextareaField
					label="Content Text"
					{value}
					maxLength={selected.maxLength}
					oninput={handleInput}
				/>
			{:else if selected.type === 'image'}
				<ContentSelectedImageField
					label="Image URL"
					{value}
					imageAlt="Preview"
					oninput={handleInput}
				/>
			{:else if selected.type === 'link'}
				<ContentSelectedLinkField label="Destination URL" {value} oninput={handleInput} />
			{:else}
				<ContentSelectedTextField
					label="Text Content"
					{value}
					maxLength={selected.maxLength}
					oninput={handleInput}
				/>
			{/if}
		</div>

		<!-- Footer -->
		<ContentSelectedFooter {onclose} />
	</Card.Root>
</div>
