'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/utils';

const Drawer = ({ shouldScaleBackground = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
	<DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
	return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			className={cn('fixed inset-0 z-50 bg-black/80', className)}
			data-slot="drawer-overlay"
			{...props}
		/>
	);
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
	return (
		<DrawerPortal>
			<DrawerOverlay />
			<DrawerPrimitive.Content
				className={cn(
					'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
					className
				)}
				data-slot="drawer-content"
				{...props}
			>
				<div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
}

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} data-slot="drawer-header" {...props} />
);

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('mt-auto flex flex-col gap-2 p-4', className)} data-slot="drawer-footer" {...props} />
);

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			className={cn('font-semibold text-lg leading-none tracking-tight', className)}
			data-slot="drawer-title"
			{...props}
		/>
	);
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			className={cn('text-muted-foreground text-sm', className)}
			data-slot="drawer-description"
			{...props}
		/>
	);
}

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerPortal,
	DrawerTitle,
	DrawerTrigger,
};
