'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';

/**
 * Drawer con soporte para reduced-motion y mejoras de UX
 * - shouldScaleBackground: escala el fondo al abrir
 * - Desactiva animaciones si el usuario prefiere reduced-motion
 */
const Drawer = ({ shouldScaleBackground = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
	<DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

/**
 * DrawerOverlay con blur y transiciones suaves
 * - backdrop-blur-sm para efecto de profundidad
 * - transición de opacidad suave
 * - respects reduced-motion
 */
const DrawerOverlay = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DrawerPrimitive.Overlay
		className={cn(
			'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-dt-normal ease-dt-out',
			'data-[state=closed]:animate-out data-[state=open]:animate-in',
			'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className
		)}
		ref={ref}
		{...props}
	/>
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

/**
 * DrawerContent con Design Tokens v2 y animaciones mejoradas
 * - rounded-t-dt-lg en lugar de valor hardcodeado
 * - shadow-dt-4 para profundidad
 * - Handle visual mejorado con design tokens
 * - Soporte para reduced-motion mediante media query
 * - max-h-[90vh] para evitar overflow
 */
const DrawerContent = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DrawerPortal>
		<DrawerOverlay />
		<DrawerPrimitive.Content
			className={cn(
				'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col',
				'rounded-t-dt-lg border-2 border-border bg-background shadow-dt-4',
				'max-h-[90vh] overflow-hidden',
				// Animaciones de entrada/salida
				'data-[state=closed]:animate-out data-[state=open]:animate-in',
				'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				// Reduced motion: sin animaciones
				'motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none',
				className
			)}
			ref={ref}
			{...props}
		>
			{/* Handle visual mejorado */}
			<div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/50" />
			<div className="overflow-y-auto">{children}</div>
		</DrawerPrimitive.Content>
	</DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DrawerPrimitive.Title
		className={cn('font-semibold text-foreground text-lg leading-none tracking-tight', className)}
		ref={ref}
		{...props}
	/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DrawerPrimitive.Description className={cn('text-muted-foreground text-sm', className)} ref={ref} {...props} />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
};
