'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

type CheckboxSize = 'sm' | 'md' | 'lg';

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
	size?: CheckboxSize;
};

const sizeClasses: Record<CheckboxSize, { root: string; icon: string }> = {
	sm: { root: 'h-4 w-4', icon: 'h-3 w-3' },
	md: { root: 'h-5 w-5', icon: 'h-4 w-4' },
	lg: { root: 'h-6 w-6', icon: 'h-5 w-5' },
};

/**
 * Checkbox con Design Tokens v2
 * - Borde 2px para mayor definición
 * - Gradiente en estado checked
 * - Sombra sutil
 * - Transiciones suaves
 */
const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
	({ className, size = 'md', ...props }, ref) => (
		<CheckboxPrimitive.Root
			className={cn(
				'peer grid shrink-0 place-content-center rounded-dt-xs border-2 border-primary/50 bg-background shadow-dt-1 transition-all duration-dt-fast ease-dt-out hover:border-primary hover:shadow-dt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary/30 data-[state=checked]:bg-linear-to-b data-[state=checked]:from-primary data-[state=checked]:to-primary/90 data-[state=checked]:text-primary-foreground',
				sizeClasses[size].root,
				className
			)}
			ref={ref}
			{...props}
		>
			<CheckboxPrimitive.Indicator className={cn('grid place-content-center text-current')}>
				<Check className={cn(sizeClasses[size].icon)} />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	)
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
