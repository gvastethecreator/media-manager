'use client';

import {
	Content as SelectContentPrimitive,
	Group as SelectGroupPrimitive,
	Icon as SelectIcon,
	ItemIndicator as SelectItemIndicator,
	Item as SelectItemPrimitive,
	ItemText as SelectItemText,
	Label as SelectLabelPrimitive,
	Portal as SelectPortal,
	Root as SelectRoot,
	ScrollDownButton as SelectScrollDownButtonPrimitive,
	ScrollUpButton as SelectScrollUpButtonPrimitive,
	Separator as SelectSeparatorPrimitive,
	Trigger as SelectTriggerPrimitive,
	Value as SelectValuePrimitive,
	Viewport as SelectViewport,
} from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

function Select({ ...props }: React.ComponentProps<typeof SelectRoot>) {
	return <SelectRoot data-slot="select" {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectGroupPrimitive>) {
	return <SelectGroupPrimitive data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectValuePrimitive>) {
	return <SelectValuePrimitive data-slot="select-value" {...props} />;
}

function SelectTrigger({
	className,
	size = 'default',
	children,
	...props
}: React.ComponentProps<typeof SelectTriggerPrimitive> & {
	size?: 'sm' | 'default';
}) {
	return (
		<SelectTriggerPrimitive
			className={cn(
				"flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[size=default]:h-9 data-[size=sm]:h-8 data-[placeholder]:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:hover:bg-input/50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			data-size={size}
			data-slot="select-trigger"
			{...props}
		>
			{children}
			<SelectIcon asChild>
				<ChevronDownIcon className="size-4 opacity-50" />
			</SelectIcon>
		</SelectTriggerPrimitive>
	);
}

function SelectContent({
	className,
	children,
	position = 'popper',
	...props
}: React.ComponentProps<typeof SelectContentPrimitive>) {
	return (
		<SelectPortal>
			<SelectContentPrimitive
				className={cn(
					'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in',
					position === 'popper' &&
						'data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1',
					className
				)}
				data-slot="select-content"
				position={position}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectViewport
					className={cn(
						'p-1',
						position === 'popper' &&
							'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1'
					)}
				>
					{children}
				</SelectViewport>
				<SelectScrollDownButton />
			</SelectContentPrimitive>
		</SelectPortal>
	);
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectLabelPrimitive>) {
	return (
		<SelectLabelPrimitive
			className={cn('px-2 py-1.5 text-muted-foreground text-xs', className)}
			data-slot="select-label"
			{...props}
		/>
	);
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectItemPrimitive>) {
	return (
		<SelectItemPrimitive
			className={cn(
				"relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
				className
			)}
			data-slot="select-item"
			{...props}
		>
			<span className="absolute right-2 flex size-3.5 items-center justify-center">
				<SelectItemIndicator>
					<CheckIcon className="size-4" />
				</SelectItemIndicator>
			</span>
			<SelectItemText>{children}</SelectItemText>
		</SelectItemPrimitive>
	);
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectSeparatorPrimitive>) {
	return (
		<SelectSeparatorPrimitive
			className={cn('-mx-1 pointer-events-none my-1 h-px bg-border', className)}
			data-slot="select-separator"
			{...props}
		/>
	);
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectScrollUpButtonPrimitive>) {
	return (
		<SelectScrollUpButtonPrimitive
			className={cn('flex cursor-default items-center justify-center py-1', className)}
			data-slot="select-scroll-up-button"
			{...props}
		>
			<ChevronUpIcon className="size-4" />
		</SelectScrollUpButtonPrimitive>
	);
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectScrollDownButtonPrimitive>) {
	return (
		<SelectScrollDownButtonPrimitive
			className={cn('flex cursor-default items-center justify-center py-1', className)}
			data-slot="select-scroll-down-button"
			{...props}
		>
			<ChevronDownIcon className="size-4" />
		</SelectScrollDownButtonPrimitive>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
