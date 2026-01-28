'use client';

import { Avatar } from '@base-ui-components/react/avatar';
import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const avatarStatusVariants = cva('flex size-2 items-center rounded-full border-2 border-background', {
	variants: {
		variant: {
			online: 'bg-success',
			offline: 'bg-zinc-600 dark:bg-zinc-300',
			busy: 'bg-warning',
			away: 'bg-primary',
		},
	},
	defaultVariants: {
		variant: 'online',
	},
});

// Base UI Avatar Root
function AvatarRoot({ className, ...props }: React.ComponentProps<typeof Avatar.Root>) {
	return <Avatar.Root className={cn('relative flex h-10 w-10 shrink-0', className)} data-slot="avatar" {...props} />;
}

// Base UI Avatar Image
function AvatarImage({ className, ...props }: React.ComponentProps<typeof Avatar.Image>) {
	return (
		<Avatar.Image
			className={cn('aspect-square h-full w-full overflow-hidden rounded-full', className)}
			data-slot="avatar-image"
			{...props}
		/>
	);
}

// Base UI Avatar Fallback
function AvatarFallback({ className, ...props }: React.ComponentProps<typeof Avatar.Fallback>) {
	return (
		<Avatar.Fallback
			className={cn(
				'flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground text-sm',
				className
			)}
			data-slot="avatar-fallback"
			{...props}
		/>
	);
}

function AvatarIndicator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('absolute flex size-6 items-center justify-center', className)}
			data-slot="avatar-indicator"
			{...props}
		/>
	);
}

function AvatarStatus({
	className,
	variant,
	...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof avatarStatusVariants>) {
	return <div className={cn(avatarStatusVariants({ variant }), className)} data-slot="avatar-status" {...props} />;
}

// Exports with proper naming to match Base UI pattern
export { AvatarRoot as Avatar, AvatarImage, AvatarFallback, AvatarIndicator, AvatarStatus, avatarStatusVariants };
