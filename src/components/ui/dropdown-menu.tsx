'use client';

import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import { Menu as MenuPrimitive } from '@base-ui-components/react/menu';
import * as React from 'react';

import { cn } from '@/lib/utils';

function DropdownMenu({ ...props }: React.ComponentProps<typeof MenuPrimitive.Root>) {
	return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
	return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof MenuPrimitive.Popup> & {
	sideOffset?: number;
}) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner sideOffset={sideOffset}>
				<MenuPrimitive.Popup
					data-slot="dropdown-menu-content"
					className={cn(
						'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
						'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
						className
					)}
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

function DropdownMenuItem({
	className,
	inset,
	...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
	inset?: boolean;
}) {
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-item"
			className={cn(
				'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				inset && 'pl-8',
				className
			)}
			{...props}
		/>
	);
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
	checked?: boolean;
}) {
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-checkbox-item"
			className={cn(
				'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				className
			)}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
				{checked && <CheckIcon className="h-4 w-4" />}
			</span>
			{children}
		</MenuPrimitive.Item>
	);
}

function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.Item>) {
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-radio-item"
			className={cn(
				'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				className
			)}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
				<CircleIcon className="h-2 w-2 fill-current" />
			</span>
			{children}
		</MenuPrimitive.Item>
	);
}

// Crear componente personalizado para Label ya que Base UI no lo incluye
function DropdownMenuLabel({
	className,
	inset,
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	inset?: boolean;
}) {
	return (
		<div
			data-slot="dropdown-menu-label"
			className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
			{...props}
		/>
	);
}

// Crear componente personalizado para Separator ya que Base UI no lo incluye
function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div data-slot="dropdown-menu-separator" className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			data-slot="dropdown-menu-shortcut"
			className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
			{...props}
		/>
	);
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
	inset?: boolean;
}) {
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-sub-trigger"
			className={cn(
				'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
				inset && 'pl-8',
				className
			)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto h-4 w-4" />
		</MenuPrimitive.Item>
	);
}

function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Popup>) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner>
				<MenuPrimitive.Popup
					data-slot="dropdown-menu-sub-content"
					className={cn(
						'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
						className
					)}
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

// Base UI no tiene componentes de grupo/submenu nativos, así que creamos wrappers simples
function DropdownMenuGroup({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuPortal({ ...props }: { children: React.ReactNode }) {
	return <MenuPrimitive.Portal {...props} />;
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof MenuPrimitive.Root>) {
	return <MenuPrimitive.Root data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuRadioGroup({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div data-slot="dropdown-menu-radio-group" {...props} />;
}

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
};
