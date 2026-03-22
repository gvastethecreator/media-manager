'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Checkbox final - Elegante y Animado
 *
 * Características:
 * - Borde 2px semitransparente con transiciones suaves
 * - Animación de escala al hacer check
 * - Icono de check con animación de stroke
 * - Estados indeterminado, checked y unchecked visuamente distintos
 * - Efectos hover sutiles con sombra
 */

type CheckboxSize = 'sm' | 'md' | 'lg';

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
	animated?: boolean;
	size?: CheckboxSize;
}

const sizeClasses: Record<CheckboxSize, { root: string; icon: string }> = {
	sm: { root: 'h-4 w-4', icon: 'h-2.5 w-2.5' },
	md: { root: 'h-5 w-5', icon: 'h-3.5 w-3.5' },
	lg: { root: 'h-6 w-6', icon: 'h-4 w-4' },
};

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
	({ className, size = 'md', animated = true, ...props }, ref) => {
		return (
			<CheckboxPrimitive.Root
				className={cn(
					// Base layout
					'peer grid shrink-0 place-content-center rounded-md',
					// Borde 2px semitransparente
					'border-2 border-border/50',
					// Fondo según estado
					'bg-background',
					'data-[state=checked]:border-primary/50 data-[state=checked]:bg-primary',
					'data-[state=indeterminate]:border-primary/50 data-[state=indeterminate]:bg-primary/80',
					// Sombra sutil
					'shadow-dt-1',
					// Transiciones suaves
					animated ? 'transition-all duration-dt-fast ease-dt-out active:scale-[0.98]' : 'transition-none',
					// Hover effects
					'hover:border-border/70 hover:shadow-dt-2',
					'hover:data-[state=checked]:shadow-[0_2px_12px_rgba(var(--primary-rgb),0.25)]',
					// Focus states
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					// Disabled
					'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none',
					sizeClasses[size].root,
					className
				)}
				ref={ref}
				{...props}
			>
				<CheckboxPrimitive.Indicator
					className={cn(
						'grid place-content-center origin-center text-primary-foreground',
						animated && 'transition-transform duration-dt-fast ease-dt-out'
					)}
				>
					{props.checked === 'indeterminate' ? (
						<Minus className={cn(sizeClasses[size].icon)} strokeWidth={3} />
					) : (
						<Check className={cn(sizeClasses[size].icon)} strokeWidth={3} />
					)}
				</CheckboxPrimitive.Indicator>
			</CheckboxPrimitive.Root>
		);
	}
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
export type { CheckboxProps };
