'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type CheckboxSize = 'sm' | 'md' | 'lg';

function Checkbox({
	className,
	size,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { size?: CheckboxSize }) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				'aria-invalid:border-destructive aria-invalid:ring-destructive/20 border border-input dark:aria-invalid:ring-destructive/40 dark:bg-input/30 dark:data-[state=checked]:bg-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none peer rounded-[4px] shadow-xs shrink-0 transition-shadow',
				size === 'sm' && 'size-4',
				size === 'md' && 'size-5',
				size === 'lg' && 'size-6',
				!size && 'size-4',
				className
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="flex items-center justify-center text-current transition-none"
			>
				<CheckIcon className={cn('size-3.5', size === 'md' && 'size-4', size === 'lg' && 'size-5')} />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
