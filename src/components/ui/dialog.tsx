'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { FocusTrap } from './focus-trap';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

/**
 * DialogOverlay con Design Tokens v2
 * - Backdrop blur sutil para profundidad
 * - Transiciones suaves
 * - Scroll lock automático
 */
const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
	const prefersReducedMotion = useReducedMotion();

	return (
		<DialogPrimitive.Overlay
			className={cn(
				'ui-overlay-backdrop-medium fixed inset-0 z-50',
				'data-[state=closed]:animate-out data-[state=open]:animate-in',
				prefersReducedMotion ? '' : 'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
				className
			)}
			ref={ref}
			{...props}
		/>
	);
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * DialogContent con Design Tokens v2 y A11y mejorada
 * - FocusTrap integrado
 * - Borde 2px para mayor definición
 * - Sombra modal elevada (shadow-dt-4)
 * - Gradiente de fondo sutil
 * - Transiciones mejoradas con reduced-motion support
 * - ARIA labels automáticos
 */
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
	/** Si debe cerrar con Escape (default: true) */
	closeOnEscape?: boolean;
	/** Callback al cerrar con Escape */
	onEscapeKeyDown?: (event: KeyboardEvent) => void;
	/** Si debe usar FocusTrap (default: true) */
	trapFocus?: boolean;
}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
	({ className, children, trapFocus = true, closeOnEscape = true, onEscapeKeyDown, ...props }, ref) => {
		const prefersReducedMotion = useReducedMotion();
		const [isOpen, setIsOpen] = React.useState(false);

		// Manejar escape key
		const handleEscape = React.useCallback(
			(event: KeyboardEvent) => {
				if (!closeOnEscape) {
					event.preventDefault();
					return;
				}
				onEscapeKeyDown?.(event);
			},
			[closeOnEscape, onEscapeKeyDown]
		);

		// Efecto para manejar scroll lock
		React.useEffect(() => {
			if (!isOpen) return;

			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';

			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}, [isOpen]);

		const content = (
			<DialogPrimitive.Content
				className={cn(
					'fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
					'border-2 border-border/50 bg-linear-to-b from-background to-background/98 p-6 shadow-dt-4',
					'sm:rounded-dt-lg',
					'focus:outline-none',
					'data-[state=closed]:animate-out data-[state=closed]:duration-dt-fast data-[state=closed]:ease-dt-in',
					'data-[state=open]:animate-in data-[state=open]:duration-dt-normal data-[state=open]:ease-dt-bounce',
					'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
					'data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
					'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
					prefersReducedMotion && 'duration-0',
					className
				)}
				ref={ref}
				{...props}
			>
				{children}
				<DialogPrimitive.Close
					aria-label="Close dialog"
					className={cn(
						'absolute top-4 right-4 rounded-dt-xs p-1 opacity-70',
						'ring-offset-background transition-all duration-dt-fast',
						'hover:bg-accent hover:opacity-100',
						'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
						'focus-visible:ring-2 focus-visible:ring-primary',
						'disabled:pointer-events-none',
						'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'
					)}
				>
					<X aria-hidden="true" className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		);

		return (
			<DialogPortal>
				<DialogOverlay />
				{trapFocus ? (
					<FocusTrap active={isOpen} initialFocus="first" onEscape={() => {}}>
						{content}
					</FocusTrap>
				) : (
					content
				)}
			</DialogPortal>
		);
	}
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2', className)}
		{...props}
	/>
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		className={cn('font-semibold text-lg leading-none tracking-tight', className)}
		ref={ref}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description className={cn('text-muted-foreground text-sm', className)} ref={ref} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
export type { DialogContentProps };
