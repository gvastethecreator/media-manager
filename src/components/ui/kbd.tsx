'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const kbdVariants = cva('inline-flex items-center justify-center rounded-md font-mono', {
	variants: {
		variant: {
			default: 'border border-border bg-accent text-accent-foreground',
			outline: 'border border-input text-accent-foreground',
		},
		size: {
			md: 'h-7 min-w-7 px-1.5 text-xs [&_svg]:size-3.5',
			sm: 'h-6 min-w-6 px-1 text-[0.75rem] leading-[0.75rem] [&_svg]:size-3',
			xs: 'h-5 min-w-5 px-1 text-[0.6875rem] leading-[0.75rem] [&_svg]:size-3',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'md',
	},
});

function Kbd({ className, variant, size, ...props }: React.ComponentProps<'kbd'> & VariantProps<typeof kbdVariants>) {
	return <kbd className={cn(kbdVariants({ variant, size }), className)} data-slot="kbd" {...props} />;
}

export { Kbd, kbdVariants };
