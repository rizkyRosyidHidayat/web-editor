<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '#lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';

	export const badgeVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-3 aria-invalid:ring-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90 [a&]:hover:bg-primary/90',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] [a&]:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
				destructive:
					'bg-destructive/10 text-destructive dark:bg-destructive/20 hover:bg-destructive/20 dark:hover:bg-destructive/30 [a&]:hover:bg-destructive/20',
				outline:
					'border-border text-foreground hover:bg-muted hover:text-foreground [a&]:hover:bg-muted [a&]:hover:text-foreground',
				warning: 'border-amber-400/20 bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20',
				info: 'border-indigo-400/20 bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20',
				success:
					'border-emerald-400/20 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

	export type BadgeProps = WithElementRef<HTMLAttributes<HTMLDivElement>> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: BadgeVariant;
		};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		href = undefined,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: BadgeProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		{href}
		data-slot="badge"
		class={cn(badgeVariants({ variant }), className)}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<div
		bind:this={ref}
		data-slot="badge"
		class={cn(badgeVariants({ variant }), className)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
