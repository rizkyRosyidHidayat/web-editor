<script lang="ts">
	import type { Articles, ArticlesPayload } from './article.type.js';
	import ImageUploader from './ImageUploader.svelte';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { supabase } from '#lib/utils.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import LogInIcon from '@lucide/svelte/icons/log-in';

	interface Props {
		initialData?: Articles | null;
		isUpdate?: boolean;
		onsuccess?: (article: Articles) => void;
		oncancel?: () => void;
	}

	let { initialData = null, isUpdate = false, onsuccess, oncancel }: Props = $props();

	let title = $state('');
	let category = $state('');
	let author = $state('');
	let readTime = $state<number | string>(5);
	let image = $state('');
	let content = $state('');

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let currentUserId = $state<string | null>(null);
	let isCheckingAuth = $state(true);

	$effect(() => {
		if (initialData) {
			title = initialData.title || '';
			category = initialData.category || '';
			author = initialData.author || '';
			readTime = initialData.read_time ?? 5;
			image = initialData.image || '';
			content = initialData.content || '';
		}
	});

	onMount(async () => {
		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (user) {
				currentUserId = user.id;
				if (!author && user.email) {
					author = user.email.split('@')[0];
				}
			}
		} catch (err: unknown) {
			console.error('Failed to get auth user:', err);
		} finally {
			isCheckingAuth = false;
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = null;
		successMessage = null;

		const trimmedTitle = title.trim();
		const trimmedCategory = category.trim();
		const trimmedAuthor = author.trim();
		const numReadTime = Number(readTime);
		const trimmedImage = image.trim();
		const trimmedContent = content.trim();

		if (!trimmedTitle) {
			errorMessage = 'Article title is required.';
			return;
		}
		if (!trimmedCategory) {
			errorMessage = 'Category is required.';
			return;
		}
		if (!trimmedAuthor) {
			errorMessage = 'Author is required.';
			return;
		}
		if (isNaN(numReadTime) || numReadTime < 1) {
			errorMessage = 'Read time must be at least 1 minute.';
			return;
		}
		if (!trimmedContent) {
			errorMessage = 'Article content is required.';
			return;
		}

		isSubmitting = true;

		try {
			// Ensure user session
			const {
				data: { user },
				error: authCheckError
			} = await supabase.auth.getUser();
			if (authCheckError || !user) {
				errorMessage = 'You must be logged in to publish or update articles.';
				isSubmitting = false;
				return;
			}

			const payload: ArticlesPayload = {
				title: trimmedTitle,
				category: trimmedCategory,
				author: trimmedAuthor,
				read_time: numReadTime,
				image: trimmedImage,
				content: trimmedContent
			};

			if (isUpdate && initialData?.id) {
				const { data, error } = await supabase
					.from('articles')
					.update({
						title: payload.title,
						category: payload.category,
						author: payload.author,
						read_time: payload.read_time,
						image: payload.image,
						content: payload.content
					})
					.eq('id', initialData.id)
					.select()
					.single();

				if (error) {
					errorMessage = error.message;
					return;
				}

				successMessage = 'Article updated successfully!';
				if (onsuccess && data) {
					onsuccess(data);
				} else {
					setTimeout(async () => {
						await goto('/articles');
					}, 800);
				}
			} else {
				const { data, error } = await supabase
					.from('articles')
					.insert({
						title: payload.title,
						category: payload.category,
						author: payload.author,
						read_time: payload.read_time,
						image: payload.image,
						content: payload.content,
						user_id: user.id
					})
					.select()
					.single();

				if (error) {
					errorMessage = error.message;
					return;
				}

				successMessage = 'Article published successfully!';
				if (onsuccess && data) {
					onsuccess(data);
				} else {
					setTimeout(async () => {
						await goto('/articles');
					}, 800);
				}
			}
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		if (oncancel) {
			oncancel();
		} else {
			goto('/articles');
		}
	}
</script>

<div class="mx-auto w-full max-w-4xl py-6">
	<div class="mb-6 flex items-center justify-between">
		<Button variant="ghost" size="sm" onclick={handleCancel}>
			<ArrowLeftIcon data-icon="inline-start" />
			Back to Articles
		</Button>
	</div>

	{#if !isCheckingAuth && !currentUserId}
		<Alert.Root variant="destructive" class="mb-6">
			<AlertCircleIcon />
			<Alert.Title>Authentication Required</Alert.Title>
			<Alert.Description class="flex flex-col gap-2">
				<span>You must be logged in with Supabase Auth to manage articles.</span>
				<div>
					<Button variant="outline" size="sm" onclick={() => goto('/login')}>
						<LogInIcon data-icon="inline-start" />
						Go to Login
					</Button>
				</div>
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if errorMessage}
		<Alert.Root variant="destructive" class="mb-6">
			<AlertCircleIcon />
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if successMessage}
		<Alert.Root class="mb-6 border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
			<CheckCircle2Icon />
			<Alert.Title>Success</Alert.Title>
			<Alert.Description>{successMessage}</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header class="flex flex-col gap-1.5">
			<Card.Title class="text-2xl font-bold">
				{isUpdate ? 'Edit Article' : 'Create New Article'}
			</Card.Title>
			<Card.Description>
				{isUpdate
					? 'Update the article details and publish the latest changes.'
					: 'Fill out the form below to publish a new article.'}
			</Card.Description>
		</Card.Header>

		<Card.Content>
			<form onsubmit={handleSubmit} class="flex flex-col gap-6">
				<!-- Title -->
				<div class="flex flex-col gap-2">
					<Label for="title" class="font-semibold">Article Title</Label>
					<Input
						id="title"
						type="text"
						placeholder="e.g. Modern Web Development Trends in 2026"
						bind:value={title}
						required
					/>
				</div>

				<!-- Category and Author in 2-column grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<Label for="category" class="font-semibold">Category</Label>
						<Input
							id="category"
							type="text"
							placeholder="e.g. Technology, Architecture, Design"
							bind:value={category}
							required
						/>
					</div>

					<div class="flex flex-col gap-2">
						<Label for="author" class="font-semibold">Author</Label>
						<Input
							id="author"
							type="text"
							placeholder="e.g. Jane Doe"
							bind:value={author}
							required
						/>
					</div>
				</div>

				<!-- Read Time -->
				<div class="flex flex-col gap-2">
					<Label for="read_time" class="font-semibold">Read Time (minutes)</Label>
					<Input
						id="read_time"
						type="number"
						min="1"
						placeholder="5"
						bind:value={readTime}
						required
					/>
				</div>

				<!-- Image Upload -->
				<div class="flex flex-col gap-2">
					<Label class="font-semibold">Featured Image</Label>
					<ImageUploader bind:imageUrl={image} />
				</div>

				<!-- Content -->
				<div class="flex flex-col gap-2">
					<Label for="content" class="font-semibold">Article Content</Label>
					<Textarea
						id="content"
						rows={12}
						placeholder="Write the full article content here. HTML or markdown text is supported..."
						bind:value={content}
						required
					/>
				</div>

				<!-- Form Actions -->
				<div class="flex items-center justify-end gap-3 border-t pt-4">
					<Button type="button" variant="outline" onclick={handleCancel} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting || !currentUserId}>
						{#if isSubmitting}
							<LoaderCircleIcon class="animate-spin" data-icon="inline-start" />
							{isUpdate ? 'Updating...' : 'Publishing...'}
						{:else}
							{isUpdate ? 'Update Article' : 'Publish Article'}
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
