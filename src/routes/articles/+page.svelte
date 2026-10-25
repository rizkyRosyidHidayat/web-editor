<script lang="ts">
	import type { Articles } from '#lib/features/articles/article.type.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { supabase } from '#lib/utils.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import SearchIcon from '@lucide/svelte/icons/search';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import NewspaperIcon from '@lucide/svelte/icons/newspaper';
	import ClockIcon from '@lucide/svelte/icons/clock';

	let articles = $state<Articles[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let searchQuery = $state('');

	// Delete dialog state
	let isDeleteDialogOpen = $state(false);
	let articleToDelete = $state<Articles | null>(null);
	let isDeleting = $state(false);

	const filteredArticles = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return articles;
		return articles.filter(
			(a) =>
				a.title.toLowerCase().includes(q) ||
				a.category.toLowerCase().includes(q) ||
				a.author.toLowerCase().includes(q)
		);
	});

	async function loadArticles() {
		isLoading = true;
		errorMessage = null;

		try {
			const { data, error } = await supabase
				.from('articles')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) {
				errorMessage = error.message;
			} else {
				articles = data || [];
			}
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Failed to fetch articles';
		} finally {
			isLoading = false;
		}
	}

	function openDeleteDialog(article: Articles) {
		articleToDelete = article;
		isDeleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!articleToDelete) return;

		isDeleting = true;
		errorMessage = null;

		try {
			const { error } = await supabase.from('articles').delete().eq('id', articleToDelete.id);

			if (error) {
				errorMessage = `Failed to delete article: ${error.message}`;
			} else {
				successMessage = `Article "${articleToDelete.title}" deleted successfully.`;
				articles = articles.filter((a) => a.id !== articleToDelete?.id);
				isDeleteDialogOpen = false;
				articleToDelete = null;

				// Clear success message after 4s
				setTimeout(() => {
					successMessage = null;
				}, 4000);
			}
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Error deleting article';
		} finally {
			isDeleting = false;
		}
	}

	function formatDate(dateStr: string) {
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}

	onMount(() => {
		loadArticles();
	});
</script>

<svelte:head>
	<title>Articles - Web Editor</title>
</svelte:head>

<div class="min-h-screen bg-background px-4 py-8 md:px-8">
	<div class="mx-auto flex max-w-7xl flex-col gap-6">
		<!-- Header -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-col gap-1">
				<h1 class="text-3xl font-bold tracking-tight">Articles</h1>
				<p class="text-sm text-muted-foreground">
					Manage and publish articles with real-time Supabase storage and database.
				</p>
			</div>

			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={loadArticles}
					disabled={isLoading}
					title="Refresh articles"
				>
					<RefreshCwIcon class={isLoading ? 'animate-spin' : ''} data-icon="inline-start" />
					Refresh
				</Button>

				<Button size="sm" onclick={() => goto('/articles/create')}>
					<PlusIcon data-icon="inline-start" />
					Create Article
				</Button>
			</div>
		</div>

		<!-- Feedback Alerts -->
		{#if errorMessage}
			<Alert.Root variant="destructive">
				<AlertCircleIcon />
				<Alert.Title>Error</Alert.Title>
				<Alert.Description>{errorMessage}</Alert.Description>
			</Alert.Root>
		{/if}

		{#if successMessage}
			<Alert.Root class="border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
				<CheckCircle2Icon />
				<Alert.Title>Success</Alert.Title>
				<Alert.Description>{successMessage}</Alert.Description>
			</Alert.Root>
		{/if}

		<!-- Search & Controls -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="relative w-full max-w-sm">
				<SearchIcon
					class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Search by title, category, or author..."
					class="pl-9"
					bind:value={searchQuery}
				/>
			</div>

			<div class="text-xs text-muted-foreground">
				Showing {filteredArticles.length} of {articles.length}
				{articles.length === 1 ? 'article' : 'articles'}
			</div>
		</div>

		<!-- Table Card -->
		<div class="overflow-hidden rounded-lg border bg-card shadow-sm">
			{#if isLoading}
				<div class="flex flex-col items-center justify-center gap-3 py-16">
					<LoaderCircleIcon class="size-8 animate-spin text-primary" />
					<p class="text-sm text-muted-foreground">Loading articles from Supabase...</p>
				</div>
			{:else if filteredArticles.length === 0}
				<div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
					<div class="flex size-12 items-center justify-center rounded-full bg-muted">
						<NewspaperIcon class="text-muted-foreground" />
					</div>
					<div class="flex flex-col gap-1">
						<h3 class="text-base font-semibold">
							{searchQuery ? 'No matching articles' : 'No articles yet'}
						</h3>
						<p class="text-sm text-muted-foreground">
							{searchQuery
								? `No articles matched your search for "${searchQuery}".`
								: 'Get started by creating and publishing your first article.'}
						</p>
					</div>
					{#if !searchQuery}
						<Button size="sm" onclick={() => goto('/articles/create')}>
							<PlusIcon data-icon="inline-start" />
							Create Article
						</Button>
					{/if}
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-16">Image</Table.Head>
							<Table.Head>Title</Table.Head>
							<Table.Head>Category</Table.Head>
							<Table.Head>Author</Table.Head>
							<Table.Head class="w-28">Read Time</Table.Head>
							<Table.Head class="w-32">Date</Table.Head>
							<Table.Head class="w-24 text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredArticles as article (article.id)}
							<Table.Row class="transition-colors hover:bg-muted/50">
								<!-- Thumbnail -->
								<Table.Cell>
									{#if article.image}
										<img
											src={article.image}
											alt={article.title}
											class="size-11 rounded-md border bg-muted object-cover"
											onerror={(e) => {
												(e.currentTarget as HTMLElement).style.display = 'none';
											}}
										/>
									{:else}
										<div
											class="flex size-11 items-center justify-center rounded-md border bg-muted text-muted-foreground"
										>
											<NewspaperIcon />
										</div>
									{/if}
								</Table.Cell>

								<!-- Title -->
								<Table.Cell class="font-medium">
									<a
										href={`/articles/update/${article.id}`}
										class="line-clamp-2 transition-colors hover:text-primary hover:underline"
										title={article.title}
									>
										{article.title}
									</a>
								</Table.Cell>

								<!-- Category -->
								<Table.Cell>
									<Badge variant="secondary" class="font-normal">
										{article.category || 'General'}
									</Badge>
								</Table.Cell>

								<!-- Author -->
								<Table.Cell class="text-sm text-muted-foreground">
									{article.author}
								</Table.Cell>

								<!-- Read Time -->
								<Table.Cell class="text-xs text-muted-foreground">
									<div class="flex items-center gap-1">
										<ClockIcon />
										<span>{article.read_time} min</span>
									</div>
								</Table.Cell>

								<!-- Date -->
								<Table.Cell class="text-xs whitespace-nowrap text-muted-foreground">
									{formatDate(article.created_at)}
								</Table.Cell>

								<!-- Row Actions -->
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => goto(`/articles/update/${article.id}`)}
											title="Edit article"
										>
											<PencilIcon />
											<span class="sr-only">Edit</span>
										</Button>

										<Button
											variant="ghost"
											size="sm"
											class="text-destructive hover:bg-destructive/10 hover:text-destructive"
											onclick={() => openDeleteDialog(article)}
											title="Delete article"
										>
											<Trash2Icon />
											<span class="sr-only">Delete</span>
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</div>
	</div>
</div>

<!-- Confirm Delete Dialog -->
<Dialog.Root bind:open={isDeleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Delete Article</Dialog.Title>
			<Dialog.Description class="pt-2 text-sm text-muted-foreground">
				Are you sure you want to delete <span class="font-semibold text-foreground"
					>"{articleToDelete?.title}"</span
				>? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer class="flex justify-end gap-2 pt-4">
			<Button
				variant="outline"
				onclick={() => {
					isDeleteDialogOpen = false;
					articleToDelete = null;
				}}
				disabled={isDeleting}
			>
				Cancel
			</Button>

			<Button variant="destructive" onclick={confirmDelete} disabled={isDeleting}>
				{#if isDeleting}
					<LoaderCircleIcon class="animate-spin" data-icon="inline-start" />
					Deleting...
				{:else}
					<Trash2Icon data-icon="inline-start" />
					Delete Article
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
