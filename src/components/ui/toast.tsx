'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import React from 'react';
import { toast as sonnerToast } from 'sonner';

import { cn } from '@/lib/utils';

// Variantes de toast usando CVA
const toastVariants = cva(
	'group data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[swipe=end]:animate-out data-[swipe=move]:transition-none',
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

// Tipos para mantener compatibilidad
type ToastProps = VariantProps<typeof toastVariants> & {
	title?: React.ReactNode;
	description?: React.ReactNode;
	action?: React.ReactElement;
	id?: string;
	className?: string;
} & React.ComponentProps<'div'>;

interface ToastActionElement extends React.ReactElement {}

// Hook para usar toast con sonner
function useToast() {
	return {
		toast: (props: Omit<ToastProps, 'id'>) => {
			const { title, description, variant = 'default', action } = props;

			const toastContent = (
				<div className="grid gap-1">
					{title && <div className="font-semibold text-sm">{title}</div>}
					{description && <div className="text-sm opacity-90">{description}</div>}
					{action && action}
				</div>
			);

			switch (variant) {
				case 'destructive':
					return sonnerToast.error(toastContent);
				default:
					return sonnerToast(toastContent);
			}
		},
		dismiss: (toastId?: string | number) => {
			if (toastId) {
				sonnerToast.dismiss(toastId);
			} else {
				sonnerToast.dismiss();
			}
		},
	};
}

// Componentes de compatibilidad (no se usan con sonner pero mantienen la API)
function Toast({ className, variant, title, description, action, ...props }: ToastProps) {
	return (
		<div className={cn(toastVariants({ variant }), className)} {...props}>
			<div className="grid gap-1">
				{title && <ToastTitle>{title}</ToastTitle>}
				{description && <ToastDescription>{description}</ToastDescription>}
			</div>
			{action}
			<ToastClose />
		</div>
	);
}

function ToastAction({ className, ...props }: React.ComponentProps<'button'>) {
	return (
		<button
			className={cn(
				'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 font-medium text-sm ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:focus:ring-destructive group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground',
				className
			)}
			{...props}
		/>
	);
}

function ToastClose({ className, ...props }: React.ComponentProps<'button'>) {
	return (
		<button
			className={cn(
				'absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 group-[.destructive]:hover:text-red-50',
				className
			)}
			{...props}
		>
			<X className="h-4 w-4" />
		</button>
	);
}

function ToastTitle({ className, ...props }: React.ComponentProps<'div'>) {
	return <div className={cn('font-semibold text-sm', className)} {...props} />;
}

function ToastDescription({ className, ...props }: React.ComponentProps<'div'>) {
	return <div className={cn('text-sm opacity-90', className)} {...props} />;
}

// Viewport para compatibilidad (no se usa con sonner)
function ToastViewport({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]',
				className
			)}
			{...props}
		/>
	);
}

// Provider para compatibilidad (no se usa con sonner)
function ToastProvider({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
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
	type ToastActionElement,
	type ToastProps,
};
