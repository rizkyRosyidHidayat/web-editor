<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import 'quill/dist/quill.snow.css';

	interface Props {
		id?: string;
		content?: string;
		placeholder?: string;
		disabled?: boolean;
		onchange?: (content: string) => void;
	}

	let {
		id = 'rich-text-editor',
		content = $bindable(''),
		placeholder = 'Write the full article content here...',
		disabled = false,
		onchange
	}: Props = $props();

	let editorElement = $state<HTMLDivElement | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let quill: any = null;
	let isInternalUpdating = false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function isQuillEmpty(quillInstance: any): boolean {
		if (!quillInstance) return true;
		const text = quillInstance.getText().trim();
		return text.length === 0;
	}

	onMount(async () => {
		if (!editorElement) return;

		// Dynamic import to prevent SSR 'document is not defined' error in SvelteKit
		const { default: Quill } = await import('quill');

		const toolbarOptions = [
			[{ header: [1, 2, 3, 4, false] }],
			['bold', 'italic', 'underline', 'strike'],
			[{ color: [] }, { background: [] }],
			[{ list: 'ordered' }, { list: 'bullet' }],
			[{ align: [] }],
			['blockquote', 'code-block'],
			['link', 'clean']
		];

		quill = new Quill(editorElement, {
			theme: 'snow',
			placeholder,
			readOnly: disabled,
			modules: {
				toolbar: toolbarOptions
			}
		});

		if (content) {
			quill.root.innerHTML = content;
		}

		quill.on('text-change', () => {
			if (!quill) return;

			let html = quill.root.innerHTML;
			if (isQuillEmpty(quill) || html === '<p><br></p>') {
				html = '';
			}

			isInternalUpdating = true;
			content = html;
			onchange?.(html);
			isInternalUpdating = false;
		});
	});

	$effect(() => {
		if (quill && !isInternalUpdating) {
			const target = content || '';
			const current = quill.root.innerHTML;
			const currentClean = isQuillEmpty(quill) || current === '<p><br></p>' ? '' : current;

			if (target !== currentClean) {
				quill.root.innerHTML = target;
			}
		}
	});

	$effect(() => {
		if (quill) {
			quill.enable(!disabled);
		}
	});

	onDestroy(() => {
		quill = null;
	});
</script>

<div
	class="quill-editor-wrapper relative flex flex-col rounded-md border border-input bg-card shadow-xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
>
	<div {id} bind:this={editorElement} class="min-h-60"></div>
</div>

<style>
	:global(.quill-editor-wrapper .ql-toolbar.ql-snow) {
		border: none !important;
		border-bottom: 1px solid var(--border) !important;
		background-color: var(--muted) !important;
		border-top-left-radius: calc(var(--radius) - 2px);
		border-top-right-radius: calc(var(--radius) - 2px);
		padding: 0.5rem 0.75rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
	}

	:global(.quill-editor-wrapper .ql-container.ql-snow) {
		border: none !important;
		font-family: inherit !important;
		font-size: 0.95rem !important;
		color: var(--foreground) !important;
		background-color: transparent !important;
		border-bottom-left-radius: calc(var(--radius) - 2px);
		border-bottom-right-radius: calc(var(--radius) - 2px);
	}

	:global(.quill-editor-wrapper .ql-editor) {
		min-height: 220px;
		max-height: 520px;
		overflow-y: auto;
		padding: 0.875rem 1rem !important;
		color: var(--foreground);
		line-height: 1.65;
	}

	:global(.quill-editor-wrapper .ql-editor.ql-blank::before) {
		color: var(--muted-foreground) !important;
		font-style: normal !important;
		left: 1rem !important;
		right: 1rem !important;
	}

	/* Dark mode & theme icon and picker adjustments */
	:global(.quill-editor-wrapper .ql-snow .ql-stroke) {
		stroke: var(--foreground) !important;
	}

	:global(.quill-editor-wrapper .ql-snow .ql-fill) {
		fill: var(--foreground) !important;
	}

	:global(.quill-editor-wrapper .ql-snow .ql-picker) {
		color: var(--foreground) !important;
	}

	:global(.quill-editor-wrapper .ql-snow .ql-picker-options) {
		background-color: var(--card) !important;
		border: 1px solid var(--border) !important;
		border-radius: var(--radius);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 0.25rem 0;
	}

	:global(.quill-editor-wrapper .ql-snow .ql-picker-item:hover),
	:global(.quill-editor-wrapper .ql-snow .ql-picker-item.ql-selected) {
		color: var(--primary) !important;
	}

	:global(.quill-editor-wrapper .ql-snow button:hover .ql-stroke),
	:global(.quill-editor-wrapper .ql-snow button.ql-active .ql-stroke),
	:global(.quill-editor-wrapper .ql-snow .ql-picker-label:hover .ql-stroke),
	:global(.quill-editor-wrapper .ql-snow .ql-picker-label.ql-active .ql-stroke) {
		stroke: var(--primary) !important;
	}

	:global(.quill-editor-wrapper .ql-snow button:hover .ql-fill),
	:global(.quill-editor-wrapper .ql-snow button.ql-active .ql-fill),
	:global(.quill-editor-wrapper .ql-snow .ql-picker-label:hover .ql-fill),
	:global(.quill-editor-wrapper .ql-snow .ql-picker-label.ql-active .ql-fill) {
		fill: var(--primary) !important;
	}
</style>
