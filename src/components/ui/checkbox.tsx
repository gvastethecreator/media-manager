'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

type CheckboxSize = 'sm' | 'md' | 'lg';

function Checkbox({
	className,
	size,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { size?: CheckboxSize }) {
	return (
		<CheckboxPrimitive.Root
			className={cn(
				'peer shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:data-[state=checked]:bg-primary dark:aria-invalid:ring-destructive/40',
				size === 'sm' && 'size-4',
				size === 'md' && 'size-5',
				size === 'lg' && 'size-6',
				!size && 'size-4',
				className
			)}
			data-slot="checkbox"
			{...props}
		>
			<CheckboxPrimitive.Indicator
				className="flex items-center justify-center text-current transition-none"
				data-slot="checkbox-indicator"
			>
				<CheckIcon className={cn('size-3.5', size === 'md' && 'size-4', size === 'lg' && 'size-5')} />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
