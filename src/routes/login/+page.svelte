<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Form from '#lib/components/ui/form/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import { supabase } from '#lib/utils.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const loginSchema = z.object({
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(6, 'Password must be at least 6 characters')
	});

	let authError = $state<string | null>(null);
	let authSuccess = $state(false);

	onMount(async () => {
		const { data } = await supabase.auth.getUser();
		if (data?.user) {
			await goto('/articles');
		}
	});

	const form = superForm(
		defaults(
			{
				email: '',
				password: ''
			},
			zod4(loginSchema)
		),
		{
			SPA: true,
			validators: zod4(loginSchema),
			resetForm: false,
			onUpdate: async ({ form }) => {
				if (!form.valid) return;

				authError = null;
				try {
					const { data, error } = await supabase.auth.signInWithPassword({
						email: form.data.email,
						password: form.data.password
					});

					if (error) {
						authError = error.message;
						return;
					}

					if (data?.user) {
						authSuccess = true;
						await goto('/articles');
					}
				} catch (err: unknown) {
					authError =
						err instanceof Error ? err.message : 'An unexpected error occurred during login';
				}
			}
		}
	);

	const { form: formData, enhance, submitting } = form;
</script>

<div class="flex min-h-screen w-full items-center justify-center px-4 py-8">
	<Card.Root class="mx-auto w-full max-w-sm shadow-lg">
		<Card.Header class="flex flex-col gap-1.5">
			<Card.Title class="text-2xl font-bold tracking-tight">Login</Card.Title>
			<Card.Description>Enter your email and password to access your account</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if authError}
				<Alert.Root variant="destructive" class="mb-4">
					<AlertCircleIcon />
					<Alert.Title>Authentication Error</Alert.Title>
					<Alert.Description>{authError}</Alert.Description>
				</Alert.Root>
			{/if}

			{#if authSuccess}
				<Alert.Root class="mb-4 border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
					<CheckCircle2Icon />
					<Alert.Title>Success</Alert.Title>
					<Alert.Description>Logged in successfully. Redirecting...</Alert.Description>
				</Alert.Root>
			{/if}

			<form method="POST" use:enhance class="flex flex-col gap-4">
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input
								{...props}
								type="email"
								placeholder="name@example.com"
								autocomplete="email"
								bind:value={$formData.email}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center justify-between">
								<Form.Label>Password</Form.Label>
							</div>
							<Input
								{...props}
								type="password"
								placeholder="••••••••"
								autocomplete="current-password"
								bind:value={$formData.password}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Button type="submit" class="w-full" disabled={$submitting}>
					{#if $submitting}
						<LoaderCircleIcon class="animate-spin" data-icon="inline-start" />
						Logging in...
					{:else}
						Login
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
