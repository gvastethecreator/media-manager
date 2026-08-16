'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

/**
 * Slider final - Elegante y Animado
 *
 * Características:
 * - Track con borde 2px semitransparente
 * - Thumb con sombra elevada y animación al interactuar
 * - Range fill con gradiente sutil
 * - Marcadores (ticks) opcionales
 * - Animación de escala del thumb con GSAP
 */

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
	animated?: boolean;
	showTicks?: boolean;
	tickCount?: number;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
	({ className, animated = true, showTicks, tickCount = 5, ...props }, ref) => {
		const prefersReducedMotion = useReducedMotion();
		const isAnimated = animated && !prefersReducedMotion;
		const values = React.useMemo(() => {
			const raw = props.value ?? props.defaultValue;
			return Array.isArray(raw) && raw.length > 0 ? raw : [0];
		}, [props.value, props.defaultValue]);
		const ariaProps =
			props['aria-label'] || props['aria-labelledby'] ? {} : ({ 'aria-label': 'Control deslizante' } as const);

		// Generar ticks
		const ticks = showTicks
			? Array.from({ length: tickCount }, (_, i) => (
					<div
						className="absolute top-1/2 h-1.5 w-0.5 -translate-y-1/2 rounded-full bg-border/60"
						key={i}
						style={{ left: `${(i / (tickCount - 1)) * 100}%` }}
					/>
				))
			: null;

		return (
			<div className={cn('relative w-full', className)}>
				<SliderPrimitive.Root
					className={cn('relative flex w-full touch-none select-none items-center', 'min-h-11')}
					ref={ref}
					{...ariaProps}
					{...props}
				>
					<SliderPrimitive.Track
						className={cn(
							'relative h-2.5 w-full grow overflow-hidden rounded-full',
							// Borde 2px semitransparente
							'border-2 border-border/30',
							// Fondo
							'bg-muted/50',
							// Sombra interior sutil
							'shadow-dt-inset-1'
						)}
					>
						{showTicks && <div className="pointer-events-none absolute inset-0 px-2">{ticks}</div>}
						<SliderPrimitive.Range
							className={cn(
								'absolute h-full',
								// Gradiente sutil
								'bg-linear-to-r from-primary/90 to-primary',
								// Sombra interior
								'shadow-dt-inset-1'
							)}
						/>
					</SliderPrimitive.Track>
					{values.map((_, index) => (
						<SliderPrimitive.Thumb
							className={cn(
								'block h-5 w-5 rounded-full',
								'bg-linear-to-b from-background to-muted',
								'border-2 border-border/40',
								'shadow-dt-2',
								'relative before:absolute before:inset-x-0 before:top-0.5 before:h-px before:bg-linear-to-r before:from-transparent before:via-primary-foreground/50 before:to-transparent',
								isAnimated
									? 'transition-[transform,box-shadow,border-color] duration-dt-fast ease-dt-out hover:scale-[1.04] active:scale-[0.98]'
									: 'transition-none',
								'hover:border-primary/50 hover:shadow-[0_3px_12px_rgba(var(--primary-rgb),0.25)]',
								'focus-visible:border-primary/50 focus-visible:shadow-[0_3px_12px_rgba(var(--primary-rgb),0.3)]',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
								'disabled:pointer-events-none disabled:opacity-50'
							)}
							key={index}
						/>
					))}
				</SliderPrimitive.Root>
			</div>
		);
	}
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
export type { SliderProps };
