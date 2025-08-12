'use client';

import { Item as ToggleGroupItemPrimitive, Root as ToggleGroupRoot } from '@radix-ui/react-toggle-group';
import { type VariantProps } from 'class-variance-authority';
import React from 'react';
import { toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
	size: 'md', // alias 'default' no existe en toggleVariants; usar 'md'
	variant: 'default',
});

function ToggleGroup({
	className,
	variant,
	size,
	children,
	...props
}: React.ComponentProps<typeof ToggleGroupRoot> & VariantProps<typeof toggleVariants>) {
	return (
		<ToggleGroupRoot
			className={cn(
				'group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs',
				className
			)}
			data-size={size}
			data-slot="toggle-group"
			data-variant={variant}
			{...props}
		>
			<ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
		</ToggleGroupRoot>
	);
}

function ToggleGroupItem({
	className,
	children,
	variant,
	size,
	...props
}: React.ComponentProps<typeof ToggleGroupItemPrimitive> & VariantProps<typeof toggleVariants>) {
	const context = React.useContext(ToggleGroupContext);

	return (
		<ToggleGroupItemPrimitive
			className={cn(
				toggleVariants({
					variant: context.variant || variant,
					size: context.size || size,
				}),
				'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
				className
			)}
			data-size={context.size || size}
			data-slot="toggle-group-item"
			data-variant={context.variant || variant}
			{...props}
		>
			{children}
		</ToggleGroupItemPrimitive>
	);
}

export { ToggleGroup, ToggleGroupItem };
