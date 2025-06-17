'use client';

import { type VariantProps, cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Definir tipos e interfaces para el toast
type ToastProps = React.ComponentProps<'div'> &
	VariantProps<typeof toastVariants> & {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	};

interface ToastActionElement extends React.ReactElement { }

// Provider y context
type ToastContextValue = {
	toasts: Array<{
		id: string;
		title?: React.ReactNode;
		description?: React.ReactNode;
		action?: ToastActionElement;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}>;
	toast: (props: Omit<ToastProps, 'id'>) => { id: string; dismiss: () => void; update: (props: ToastProps) => void };
	dismiss: (toastId?: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

function useToast() {
	const context = React.useContext(ToastContext);
	if (!context) {
		throw new Error('useToast debe ser usado dentro de un ToastProvider');
	}
	return context;
}

// Componentes
const ToastProvider = React.forwardRef<HTMLDivElement, React.PropsWithChildren<Record<string, unknown>>>(
	({ children }, _ref) => {
		const [toasts, setToasts] = React.useState<ToastContextValue['toasts']>([]);

		// Mover toast y dismiss fuera de useCallback para evitar referencia circular
		const dismiss = (toastId?: string) => {
			setToasts((prev) => prev.map((t) => (toastId === undefined || t.id === toastId ? { ...t, open: false } : t)));

			setTimeout(() => {
				setToasts((prev) => prev.filter((t) => (toastId === undefined ? false : t.id !== toastId)));
			}, 300);
		};

		const toast = (props: Omit<ToastProps, 'id'>) => {
			const id = Math.random().toString(36).substring(2, 9);
			const newToast = {
				id,
				...props,
				open: true,
				onOpenChange: (open: boolean) => {
					if (!open) {
						dismiss(id);
					}
				},
			};

			setToasts((prev) => [newToast, ...prev].slice(0, 5));

			return {
				id,
				dismiss: () => dismiss(id),
				update: (props: ToastProps) => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...props } : t))),
			};
		};

		return <ToastContext.Provider value={{ toasts, toast, dismiss }}>{children as React.ReactNode}</ToastContext.Provider>;
	}
);
ToastProvider.displayName = 'ToastProvider';

const ToastViewport = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
				className
			)}
			{...props}
		/>
	)
);
ToastViewport.displayName = 'ToastViewport';

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

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ className, variant, ...props }, ref) => {
	return <div ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
});
Toast.displayName = 'Toast';

const ToastAction = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
	({ className, ...props }, ref) => (
		<button
			ref={ref}
			className={cn(
				'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
				className
			)}
			{...props}
		/>
	)
);
ToastAction.displayName = 'ToastAction';

const ToastClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
	({ className, ...props }, ref) => (
		<button
			ref={ref}
			className={cn(
				'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
				className
			)}
			{...props}
		>
			<X className="h-4 w-4" />
		</button>
	)
);
ToastClose.displayName = 'ToastClose';

const ToastTitle = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
	({ className, ...props }, ref) => <div ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
);
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
	({ className, ...props }, ref) => <div ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
);
ToastDescription.displayName = 'ToastDescription';

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
	type ToastProps
};

