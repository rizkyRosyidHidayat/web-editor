<script lang="ts">
	import ArticleForm from '#lib/features/articles/ArticleForm.svelte';
</script>

<svelte:head>
	<title>Create Article - Web Editor</title>
</svelte:head>

<div class="min-h-screen bg-background px-4 py-8">
	<ArticleForm isUpdate={false} />
</div>
