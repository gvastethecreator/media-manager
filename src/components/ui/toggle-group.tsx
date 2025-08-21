'use client';

import { type VariantProps } from 'class-variance-authority';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import * as React from 'react';
import { toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
	size: 'md',
	variant: 'default',
});

function ToggleGroup({
	className,
	variant,
	size,
	children,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
	return (
		<ToggleGroupPrimitive.Root
			className={cn(
				'group/toggle-group flex items-center gap-1 rounded-md data-[variant=outline]:gap-0 data-[variant=outline]:shadow-xs',
				className
			)}
			data-size={size}
			data-slot="toggle-group"
			data-variant={variant}
			{...props}
		>
			<ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive.Root>
	);
}

function ToggleGroupItem({
	className,
	children,
	variant,
	size,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
	const context = React.useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			className={cn(
				toggleVariants({
					variant: context.variant || variant,
					size: context.size || size,
				}),
				'shrink-0 shadow-none focus:z-10 focus-visible:z-10 data-[variant=outline]:rounded-none data-[variant=outline]:border-s-0 data-[variant=outline]:last:rounded-e-md data-[variant=outline]:first:rounded-s-md data-[variant=outline]:first:border-s',
				className
			)}
			data-size={context.size || size}
			data-slot="toggle-group-item"
			data-variant={context.variant || variant}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
}

export { ToggleGroup, ToggleGroupItem };
