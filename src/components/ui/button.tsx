'use client';

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';
import { isValidElement, memo, useMemo } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
				destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
				outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
				secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2',
				sm: 'h-8 rounded-md px-3 text-xs',
				lg: 'h-10 rounded-md px-8',
				icon: 'h-9 w-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

const OptimizedSlot = memo(
	function OptimizedSlot(props: React.ComponentProps<typeof Slot>) {
		return <Slot {...props} />;
	},
	(prevProps, nextProps) => {
		if (prevProps.className !== nextProps.className) return false;
		if (prevProps.onClick !== nextProps.onClick) return false;
		if (prevProps.type !== nextProps.type) return false;

		if (prevProps.children !== nextProps.children) {
			if (isValidElement(prevProps.children) || isValidElement(nextProps.children)) {
				return false;
			}

			if (typeof prevProps.children === 'string' && typeof nextProps.children === 'string') {
				return prevProps.children === nextProps.children;
			}

			return false;
		}

		const eventHandlers = [
			'onMouseEnter',
			'onMouseLeave',
			'onFocus',
			'onBlur',
			'onPointerDown',
			'onPointerMove',
			'onPointerLeave',
		];
		for (const handler of eventHandlers) {
			if (prevProps[handler] !== nextProps[handler]) return false;
		}

		return true;
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export const Button = memo(
	function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
		const buttonClassName = useMemo(() => {
			return cn(buttonVariants({ variant, size }), className);
		}, [variant, size, className]);

		if (asChild) {
			return <OptimizedSlot data-slot="button" type={props.type} className={buttonClassName} {...props} />;
		}

		return <button data-slot="button" type={props.type || 'button'} className={buttonClassName} {...props} />;
	},
	(prevProps, nextProps) => {
		if (prevProps.variant !== nextProps.variant) return false;
		if (prevProps.size !== nextProps.size) return false;
		if (prevProps.className !== nextProps.className) return false;
		if (prevProps.asChild !== nextProps.asChild) return false;
		if (prevProps.onClick !== nextProps.onClick) return false;
		if (prevProps.disabled !== nextProps.disabled) return false;

		if (prevProps.children !== nextProps.children) {
			if (isValidElement(prevProps.children) || isValidElement(nextProps.children)) {
				return false;
			}

			if (typeof prevProps.children === 'string' && typeof nextProps.children === 'string') {
				return prevProps.children === nextProps.children;
			}

			return false;
		}

		return true;
	}
);
Button.displayName = 'Button';

export { buttonVariants };
