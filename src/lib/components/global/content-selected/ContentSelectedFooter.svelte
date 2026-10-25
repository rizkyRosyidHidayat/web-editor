<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();
</script>

<Card.Footer class="flex items-center justify-between">
	<div class="flex items-center gap-2 text-[11px]">
		<span class="hidden items-center gap-1.5 sm:inline-flex">
			Press <Kbd>Esc</Kbd> to close
		</span>
	</div>

	<Button type="button" size="sm" onclick={onclose}>Done</Button>
</Card.Footer>
