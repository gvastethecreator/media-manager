'use client';

import { Toast as ToastPrimitive } from '@base-ui-components/react/toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Crear el manager global de toasts
const toastManager = ToastPrimitive.createToastManager();

// Tipos para mantener compatibilidad
type ToastProps = React.ComponentProps<typeof ToastPrimitive.Root> &
	VariantProps<typeof toastVariants> & {
		title?: React.ReactNode;
		description?: React.ReactNode;
		action?: React.ReactElement;
	};

interface ToastActionElement extends React.ReactElement {}

// Hook para usar el toast manager
function useToast() {
	return {
		toast: (props: Omit<ToastProps, 'id'>) => {
			const id = toastManager.add({
				title: props.title as string,
				description: props.description as string,
				type: props.variant || 'default',
				...props,
			});
			return {
				id,
				dismiss: () => toastManager.remove(id),
				update: (newProps: ToastProps) => toastManager.update(id, newProps),
			};
		},
		dismiss: (toastId?: string) => {
			if (toastId) {
				toastManager.remove(toastId);
			} else {
				toastManager.clear();
			}
		},
		toasts: toastManager.toasts,
	};
}

// Provider component
function ToastProvider({ children }: { children: React.ReactNode }) {
	return (
		<ToastPrimitive.Provider toastManager={toastManager}>
			{children}
		</ToastPrimitive.Provider>
	);
}

// Viewport component
function ToastViewport({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
	return (
		<ToastPrimitive.Portal>
			<ToastPrimitive.Viewport
				data-slot="toast-viewport"
				className={cn(
					'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
					className
				)}
				{...props}
			/>
		</ToastPrimitive.Portal>
	);
}

// Toast variants
const toastVariants = cva(
	'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-right-full sm:data-[state=open]:slide-in-from-bottom-full',
	{
		variants: {
			variant: {
				default: 'border bg-background text-foreground',
				destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

// Toast root component
function Toast({ className, variant, title, description, action, ...props }: ToastProps) {
	return (
		<ToastPrimitive.Root
			data-slot="toast"
			className={cn(toastVariants({ variant }), className)}
			{...props}
		>
			<div className="grid gap-1">
				{title && <ToastTitle>{title}</ToastTitle>}
				{description && <ToastDescription>{description}</ToastDescription>}
			</div>
			{action}
			<ToastClose />
		</ToastPrimitive.Root>
	);
}

// Toast action component
function ToastAction({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Action>) {
	return (
		<ToastPrimitive.Action
			data-slot="toast-action"
			className={cn(
				'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
				className
			)}
			{...props}
		/>
	);
}

// Toast close component
function ToastClose({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Close>) {
	return (
		<ToastPrimitive.Close
			data-slot="toast-close"
			className={cn(
				'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
				className
			)}
			{...props}
		>
			<X className="h-4 w-4" />
		</ToastPrimitive.Close>
	);
}

// Toast title component
function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
	return (
		<ToastPrimitive.Title
			data-slot="toast-title"
			className={cn('text-sm font-semibold', className)}
			{...props}
		/>
	);
}

// Toast description component
function ToastDescription({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) {
	return (
		<ToastPrimitive.Description
			data-slot="toast-description"
			className={cn('text-sm opacity-90', className)}
			{...props}
		/>
	);
}

export {
	Toast,
	ToastAction,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
	useToast,
	toastManager,
	type ToastActionElement,
	type ToastProps,
};
