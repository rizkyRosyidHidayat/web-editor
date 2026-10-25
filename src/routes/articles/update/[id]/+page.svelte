<script lang="ts">
	import ArticleForm from '#lib/features/articles/ArticleForm.svelte';
	import type { Articles } from '#lib/features/articles/article.type.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { supabase } from '#lib/utils.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	let article = $state<Articles | null>(null);
	let isLoading = $state(true);
	let fetchError = $state<string | null>(null);

	const articleId = $derived(page.params.id);

	onMount(async () => {
		if (!articleId) {
			fetchError = 'No article ID provided.';
			isLoading = false;
			return;
		}

		try {
			const { data, error } = await supabase
				.from('articles')
				.select('*')
				.eq('id', articleId)
				.single();

			if (error) {
				fetchError = error.message;
			} else if (data) {
				article = data;
			} else {
				fetchError = 'Article not found.';
			}
		} catch (err: unknown) {
			fetchError = err instanceof Error ? err.message : 'Failed to fetch article';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{article ? `Edit: ${article.title}` : 'Edit Article'} - Web Editor</title>
</svelte:head>

<div class="min-h-screen bg-background px-4 py-8">
	{#if isLoading}
		<div class="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 py-20">
			<LoaderCircleIcon class="size-8 animate-spin text-primary" />
			<p class="text-sm text-muted-foreground">Loading article details...</p>
		</div>
	{:else if fetchError}
		<div class="mx-auto max-w-4xl py-6">
			<Button variant="ghost" size="sm" onclick={() => goto('/articles')} class="mb-4">
				<ArrowLeftIcon data-icon="inline-start" />
				Back to Articles
			</Button>

			<Alert.Root variant="destructive">
				<AlertCircleIcon />
				<Alert.Title>Unable to Load Article</Alert.Title>
				<Alert.Description class="flex flex-col gap-3">
					<span>{fetchError}</span>
					<div>
						<Button variant="outline" size="sm" onclick={() => goto('/articles')}>
							Return to Articles List
						</Button>
					</div>
				</Alert.Description>
			</Alert.Root>
		</div>
	{:else if article}
		<ArticleForm initialData={article} isUpdate={true} />
	{/if}
</div>
