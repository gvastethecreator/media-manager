'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Checkbox Rediseñado v3 - Elegante y Animado
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
	size?: CheckboxSize;
	animated?: boolean;
}

const sizeClasses: Record<CheckboxSize, { root: string; icon: string }> = {
	sm: { root: 'h-4 w-4', icon: 'h-2.5 w-2.5' },
	md: { root: 'h-5 w-5', icon: 'h-3.5 w-3.5' },
	lg: { root: 'h-6 w-6', icon: 'h-4 w-4' },
};

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
	({ className, size = 'md', animated = true, ...props }, ref) => {
		const indicatorRef = useRef<HTMLSpanElement>(null);
		const rootRef = useRef<HTMLButtonElement>(null);

		useEffect(() => {
			if (!(animated && indicatorRef.current)) return;

			const animateCheck = async () => {
				const { animate } = await import('animejs');

				// Animación de escala del indicador
				animate(indicatorRef.current!, {
					scale: [0.5, 1],
					opacity: [0, 1],
					ease: 'easeOutElastic(1, .6)',
					duration: 400,
				});
			};

			if (props.checked) {
				animateCheck();
			}
		}, [props.checked, animated]);

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
					'transition-all duration-200 ease-out',
					// Hover effects
					'hover:border-border/70 hover:shadow-dt-2',
					'hover:data-[state=checked]:shadow-[0_2px_12px_rgba(var(--primary-rgb),0.25)]',
					// Focus states
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
					// Disabled
					'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none',
					sizeClasses[size].root,
					className
				)}
				ref={(node) => {
					if (typeof ref === 'function') {
						ref(node);
					} else if (ref) {
						ref.current = node;
					}
					rootRef.current = node || null;
				}}
				{...props}
			>
				<CheckboxPrimitive.Indicator
					className={cn('grid place-content-center text-primary-foreground', 'origin-center')}
					ref={indicatorRef}
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
