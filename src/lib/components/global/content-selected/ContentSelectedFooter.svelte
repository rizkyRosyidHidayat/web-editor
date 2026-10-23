<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();
</script>

<div
	class="flex items-center justify-between border-t border-white/8 bg-black/20 px-4 py-2.5 sm:px-5"
>
	<div class="flex items-center gap-2 text-[11px] text-slate-500">
		<span class="hidden items-center gap-1.5 text-slate-500 sm:inline-flex">
			Press <Kbd class="border border-white/10 bg-white/5 text-[10px] text-slate-400">Esc</Kbd> to close
		</span>
	</div>

	<Button
		type="button"
		size="sm"
		variant="secondary"
		class="h-7 rounded-lg bg-white/10 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
		onclick={onclose}
	>
		Done
	</Button>
</div>
