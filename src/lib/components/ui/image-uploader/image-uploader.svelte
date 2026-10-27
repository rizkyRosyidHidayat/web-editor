<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { supabase } from '#lib/utils.js';
	import { deleteImageFromStorage } from './storage.ts';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import LinkIcon from '@lucide/svelte/icons/link';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	interface Props {
		folder?: 'articles' | string;
		imageUrl?: string;
		oldImageUrl?: string;
		onchange?: (url: string) => void;
		ondelete?: (url: string) => void;
	}

	let {
		imageUrl = $bindable(''),
		folder = 'articles',
		oldImageUrl = '',
		onchange,
		ondelete
	}: Props = $props();

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let isUrlMode = $state(false);
	let manualUrl = $derived(imageUrl);
	let sessionUploads = $state<string[]>([]);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			uploadFile(file);
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('image/')) {
			uploadFile(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	async function uploadFile(file: File) {
		uploadError = null;
		isUploading = true;

		try {
			const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
			const sanitizedBase = file.name
				.replace(/\.[^/.]+$/, '')
				.replace(/[^a-zA-Z0-9_-]/g, '_')
				.substring(0, 30);
			const fileName = `${Date.now()}-${sanitizedBase}.${fileExt}`;

			const { data, error } = await supabase.storage.from(folder).upload(fileName, file, {
				cacheControl: '3600',
				upsert: true
			});

			if (error) {
				uploadError = error.message;
				return;
			}

			const { data: publicUrlData } = supabase.storage.from(folder).getPublicUrl(data.path);

			if (publicUrlData?.publicUrl) {
				const previousSessionUrl = imageUrl;
				const newUrl = publicUrlData.publicUrl;

				// If the previously active image was uploaded during this session, delete it to prevent orphaned files
				if (
					previousSessionUrl &&
					previousSessionUrl !== oldImageUrl &&
					sessionUploads.includes(previousSessionUrl) &&
					previousSessionUrl !== newUrl
				) {
					await deleteImageFromStorage(previousSessionUrl, folder);
					sessionUploads = sessionUploads.filter((u) => u !== previousSessionUrl);
				}

				sessionUploads = [...sessionUploads, newUrl];
				imageUrl = newUrl;
				manualUrl = newUrl;
				onchange?.(newUrl);
			}
		} catch (err: unknown) {
			uploadError = err instanceof Error ? err.message : 'Failed to upload image';
		} finally {
			isUploading = false;
			if (fileInputRef) {
				fileInputRef.value = '';
			}
		}
	}

	async function removeImage() {
		const currentUrl = imageUrl;
		imageUrl = '';
		manualUrl = '';
		uploadError = null;
		onchange?.('');
		if (fileInputRef) {
			fileInputRef.value = '';
		}

		// If this image was uploaded during this session, delete it from storage immediately
		if (currentUrl && currentUrl !== oldImageUrl && sessionUploads.includes(currentUrl)) {
			await deleteImageFromStorage(currentUrl, folder);
			sessionUploads = sessionUploads.filter((u) => u !== currentUrl);
		}

		ondelete?.(currentUrl);
	}

	async function applyManualUrl() {
		const trimmed = manualUrl.trim();
		const currentUrl = imageUrl;

		// Clean up any uncommitted upload from this session if replaced with manual URL
		if (
			currentUrl &&
			currentUrl !== oldImageUrl &&
			sessionUploads.includes(currentUrl) &&
			currentUrl !== trimmed
		) {
			await deleteImageFromStorage(currentUrl, folder);
			sessionUploads = sessionUploads.filter((u) => u !== currentUrl);
		}

		imageUrl = trimmed;
		uploadError = null;
		onchange?.(imageUrl);
	}
</script>

<div class="flex flex-col gap-3">
	{#if uploadError}
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Title>Upload Failed</Alert.Title>
			<Alert.Description>{uploadError}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if imageUrl}
		<div class="flex flex-col gap-3 rounded-lg border bg-card p-4">
			<div
				class="relative flex max-h-64 w-full items-center justify-center overflow-hidden rounded-md border bg-muted/40"
			>
				<img
					src={imageUrl}
					alt="Article preview"
					class="max-h-60 w-auto rounded-md object-contain"
					onerror={() => {
						uploadError = 'Unable to load image preview from the provided URL';
					}}
				/>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
				<span class="max-w-[320px] truncate" title={imageUrl}>
					{imageUrl}
				</span>
				<div class="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => fileInputRef?.click()}
						disabled={isUploading}
					>
						<UploadIcon data-icon="inline-start" />
						Change Image
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onclick={removeImage}
						disabled={isUploading}
					>
						<Trash2Icon data-icon="inline-start" />
						Remove
					</Button>
				</div>
			</div>
		</div>
	{:else}
		<div
			role="button"
			tabindex="0"
			class="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			onclick={() => {
				if (!isUploading) fileInputRef?.click();
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					if (!isUploading) {
						fileInputRef?.click();
					}
				}
			}}
		>
			<div class="flex size-12 items-center justify-center rounded-full bg-muted">
				{#if isUploading}
					<LoaderCircleIcon class="animate-spin text-primary" />
				{:else}
					<ImageIcon class="text-muted-foreground" />
				{/if}
			</div>

			<div class="flex flex-col gap-1">
				<p class="text-sm font-medium">
					{#if isUploading}
						Uploading image to Supabase storage...
					{:else}
						Click to upload or drag and drop
					{/if}
				</p>
				<p class="text-xs text-muted-foreground">PNG, JPG, WEBP, or GIF</p>
			</div>

			<Button
				type="button"
				variant="secondary"
				size="sm"
				disabled={isUploading}
				onclick={(e) => {
					e.stopPropagation();
					fileInputRef?.click();
				}}
			>
				{#if isUploading}
					<LoaderCircleIcon class="animate-spin" data-icon="inline-start" />
					Uploading...
				{:else}
					<UploadIcon data-icon="inline-start" />
					Select Image File
				{/if}
			</Button>
		</div>

		<div class="flex items-center gap-2">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="text-xs text-muted-foreground hover:text-foreground"
				onclick={() => (isUrlMode = !isUrlMode)}
			>
				<LinkIcon data-icon="inline-start" />
				{isUrlMode ? 'Hide image URL input' : 'Or paste image URL directly'}
			</Button>
		</div>

		{#if isUrlMode}
			<div class="flex gap-2">
				<Input
					type="url"
					placeholder="https://example.com/image.jpg"
					bind:value={manualUrl}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							applyManualUrl();
						}
					}}
				/>
				<Button type="button" variant="outline" size="sm" onclick={applyManualUrl}>
					Apply URL
				</Button>
			</div>
		{/if}
	{/if}

	<input
		bind:this={fileInputRef}
		type="file"
		accept="image/*"
		class="sr-only"
		onchange={handleFileSelect}
	/>
</div>
