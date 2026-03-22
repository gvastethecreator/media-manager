'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import gsap from 'gsap';
import * as React from 'react';
import { useEffect, useRef } from 'react';
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
		const thumbsRef = useRef<(HTMLSpanElement | null)[]>([]);
		const [activeThumb, setActiveThumb] = React.useState<number | null>(null);

		useEffect(() => {
			if (!animated || activeThumb === null) return;

			const thumb = thumbsRef.current[activeThumb];
			if (!thumb) return;

			gsap.killTweensOf(thumb);
			gsap.fromTo(
				thumb,
				{ scale: 1 },
				{
					scale: 1.15,
					duration: 0.2,
					ease: 'power1.out',
					yoyo: true,
					repeat: 1,
				}
			);
		}, [activeThumb, animated]);

		const handlePointerDown = (index: number) => {
			setActiveThumb(index);
		};

		const handlePointerUp = () => {
			setActiveThumb(null);
		};

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
					className={cn(
						'relative flex w-full touch-none select-none items-center',
						'h-6' // Altura del área interactiva
					)}
					onPointerUp={handlePointerUp}
					ref={ref}
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
								'bg-gradient-to-r from-primary/90 to-primary',
								// Sombra interior
								'shadow-dt-inset-1'
							)}
						/>
					</SliderPrimitive.Track>
					{props.defaultValue?.map((_, index) => (
						<SliderPrimitive.Thumb
							className={cn(
								// Base
								'block h-5 w-5 rounded-full',
								// Fondo
								'bg-gradient-to-b from-background to-muted',
								// Borde 2px semitransparente
								'border-2 border-border/40',
								// Sombra elevada elegante
								'shadow-dt-2',
								// Brillo sutil
								'relative before:absolute before:inset-x-0 before:top-0.5 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary-foreground/50 before:to-transparent',
								// Estados
								'transition-[box-shadow,border-color] duration-200',
								'hover:border-primary/50 hover:shadow-[0_3px_12px_rgba(var(--primary-rgb),0.25)]',
								'focus-visible:border-primary/50 focus-visible:shadow-[0_3px_12px_rgba(var(--primary-rgb),0.3)]',
								// Focus ring
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
								// Disabled
								'disabled:pointer-events-none disabled:opacity-40'
							)}
							key={index}
							onPointerDown={() => handlePointerDown(index)}
							ref={(el) => {
								thumbsRef.current[index] = el;
							}}
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
