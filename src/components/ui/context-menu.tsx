'use client';

/**
 * Context Menu final - Rediseñado con animaciones y estilos mejorados
 *
 * Características:
 * - Borde 2px semitransparente en el menú
 * - Items con hover sutil y transiciones suaves
 * - Separadores elegantes
 * - Animación de entrada con GSAP (fade + scale)
 * - Animación de entrada con GSAP (fade + scale)
 * - Submenus con flechas animadas
 * - Estados disabled, checked, etc.
 */

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import gsap from 'gsap';
import { Check, ChevronRight, Circle } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/**
 * ContextMenuSubTrigger con animación de flecha
 */
const ContextMenuSubTrigger = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
		inset?: boolean;
	}
>(({ className, inset, children, ...props }, ref) => {
	return (
		<ContextMenuPrimitive.SubTrigger
			className={cn(
				'flex cursor-default select-none items-center rounded-dt-xs px-2 py-1.5 text-sm outline-none',
				'transition-all duration-dt-fast',
				'hover:bg-muted/80 hover:shadow-dt-inset-1',
				'focus:bg-muted/80 focus:text-accent-foreground focus:shadow-dt-inset-1',
				'data-[state=open]:bg-muted/80 data-[state=open]:text-accent-foreground data-[state=open]:shadow-dt-inset-1',
				inset && 'pl-8',
				'[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
				'data-disabled:pointer-events-none data-disabled:opacity-50',
				className
			)}
			ref={ref}
			{...props}
		>
			{children}
			<div className="ml-auto transition-transform duration-dt-fast data-[state=open]:translate-x-1">
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</ContextMenuPrimitive.SubTrigger>
	);
});
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

/**
 * ContextMenuSubContent con animación de entrada
 */
const ContextMenuSubContent = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
	return (
		<ContextMenuPrimitive.SubContent
			className={cn(
				'z-50 min-w-32 origin-[--radix-context-menu-content-transform-origin] overflow-hidden',
				'rounded-dt-md border-2 border-border/40 bg-popover p-1',
				'text-popover-foreground shadow-dt-3 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
				className
			)}
			ref={ref}
			{...props}
		/>
	);
});
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

/**
 * ContextMenuContent con animación de entrada
 * - Borde 2px semitransparente
 * - Sombra elevada
 * - Fade in + scale desde 0.95
 */
const ContextMenuContent = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => {
	return (
		<ContextMenuPrimitive.Portal>
			<ContextMenuPrimitive.Content
				className={cn(
					'z-50 max-h-[--radix-context-menu-content-available-height] min-w-32',
					'origin-[--radix-context-menu-content-transform-origin]',
					'overflow-y-auto overflow-x-hidden rounded-dt-md',
					'border-2 border-border/40 bg-popover p-1',
					'text-popover-foreground shadow-dt-3 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					className
				)}
				ref={ref}
				{...props}
			/>
		</ContextMenuPrimitive.Portal>
	);
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

/**
 * ContextMenuItem con hover sutil
 * - Transición suave
 * - Fondo en hover/focus
 * - Estado disabled
 */
const ContextMenuItem = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<ContextMenuPrimitive.Item
		className={cn(
			'relative flex cursor-default select-none items-center rounded-dt-xs px-2 py-1.5',
			'text-sm outline-none transition-all duration-dt-fast',
			'hover:bg-muted/80 hover:shadow-dt-inset-1',
			'focus:bg-muted/80 focus:text-accent-foreground focus:shadow-dt-inset-1',
			'data-disabled:pointer-events-none data-disabled:opacity-50',
			inset && 'pl-8',
			'[&>svg]:size-4 [&>svg]:shrink-0',
			className
		)}
		ref={ref}
		{...props}
	/>
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

/**
 * ContextMenuCheckboxItem
 * - Icono de check animado
 * - Estados disabled
 */
const ContextMenuCheckboxItem = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
	const indicatorRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (!(indicatorRef.current && checked)) return;

		const element = indicatorRef.current;
		gsap.killTweensOf(element);
		gsap.fromTo(element, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.15, ease: 'back.out(1.7)' });
	}, [checked]);

	return (
		<ContextMenuPrimitive.CheckboxItem
			checked={checked}
			className={cn(
				'relative flex cursor-default select-none items-center rounded-dt-xs',
				'py-1.5 pr-2 pl-8 text-sm outline-none transition-all duration-dt-fast',
				'hover:bg-muted/80 hover:shadow-dt-inset-1',
				'focus:bg-muted/80 focus:text-accent-foreground focus:shadow-dt-inset-1',
				'data-disabled:pointer-events-none data-disabled:opacity-50',
				className
			)}
			ref={ref}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center" ref={indicatorRef}>
				<ContextMenuPrimitive.ItemIndicator>
					<Check className="h-4 w-4 text-primary" />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.CheckboxItem>
	);
});
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

/**
 * ContextMenuRadioItem
 * - Icono de radio animado
 * - Estados disabled
 */
const ContextMenuRadioItem = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
	const indicatorRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (!indicatorRef.current) return;

		const element = indicatorRef.current;
		gsap.killTweensOf(element);
		gsap.fromTo(element, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(1.7)' });
	}, []);

	return (
		<ContextMenuPrimitive.RadioItem
			className={cn(
				'relative flex cursor-default select-none items-center rounded-dt-xs',
				'py-1.5 pr-2 pl-8 text-sm outline-none transition-all duration-dt-fast',
				'hover:bg-muted/80 hover:shadow-dt-inset-1',
				'focus:bg-muted/80 focus:text-accent-foreground focus:shadow-dt-inset-1',
				'data-disabled:pointer-events-none data-disabled:opacity-50',
				className
			)}
			ref={ref}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center" ref={indicatorRef}>
				<ContextMenuPrimitive.ItemIndicator>
					<Circle className="h-2 w-2 fill-current text-primary" />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.RadioItem>
	);
});
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

/**
 * ContextMenuLabel
 */
const ContextMenuLabel = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<ContextMenuPrimitive.Label
		className={cn('px-2 py-1.5 font-semibold text-foreground text-sm', inset && 'pl-8', className)}
		ref={ref}
		{...props}
	/>
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

/**
 * ContextMenuSeparator
 * - Separador elegante con opacidad sutil
 */
const ContextMenuSeparator = React.forwardRef<
	React.ElementRef<typeof ContextMenuPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<ContextMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border/30', className)} ref={ref} {...props} />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

/**
 * ContextMenuShortcut
 * - Atajos de teclado estilizados
 */
const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span className={cn('ml-auto text-muted-foreground text-xs tracking-widest', 'opacity-80', className)} {...props} />
	);
};
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

export {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuPortal,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
};
