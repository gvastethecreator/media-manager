'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Switch Rediseñado v3 - Elegante y Animado
 *
 * Características:
 * - Borde 2px semitransparente para definición sutil
 * - Animaciones fluidas con animejs
 * - Estados visuales claros con transiciones suaves
 * - Thumb con sombra elevada y brillo sutil
 */

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
	animated?: boolean;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
	({ className, animated = true, onCheckedChange, ...props }, ref) => {
		const thumbRef = useRef<HTMLSpanElement>(null);
		const [isChecked, setIsChecked] = React.useState(props.checked || props.defaultChecked);
		const animationRef = useRef<any>(null);

		useEffect(() => {
			if (!(animated && thumbRef.current)) return;

			const animateThumb = async () => {
				const { animate } = await import('animejs');

				if (animationRef.current) {
					animationRef.current.pause();
				}

				animationRef.current = animate(thumbRef.current!, {
					x: isChecked ? 20 : 0,
					ease: 'spring(1, 80, 10, 0)',
					duration: 500,
				});
			};

			animateThumb();
		}, [isChecked, animated]);

		const handleCheckedChange = (checked: boolean) => {
			setIsChecked(checked);
			onCheckedChange?.(checked);
		};

		return (
			<SwitchPrimitives.Root
				className={cn(
					// Base styles
					'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center',
					'rounded-full border-2 transition-all duration-300',
					// Borde semitransparente sutil
					'border-border/40',
					// Fondo según estado
					'data-[state=unchecked]:bg-muted/30',
					'data-[state=checked]:border-primary/40 data-[state=checked]:bg-primary/20',
					// Sombra interior sutil
					'shadow-dt-inset-1',
					// Focus states
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
					// Disabled
					'disabled:cursor-not-allowed disabled:opacity-40',
					// Hover effects
					'hover:border-border/60 hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.1)]',
					'data-[state=checked]:hover:border-primary/50',
					className
				)}
				onCheckedChange={handleCheckedChange}
				ref={ref}
				{...props}
			>
				<SwitchPrimitives.Thumb
					className={cn(
						'block h-5 w-5 rounded-full',
						// Fondo del thumb con gradiente sutil
						'bg-gradient-to-b from-background to-muted',
						// Borde semitransparente
						'border border-border/30',
						// Sombra elevada elegante
						'shadow-dt-2',
						// Brillo sutil en la parte superior
						'relative before:absolute before:inset-x-0 before:top-0.5 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary-foreground/50 before:to-transparent',
						// Transición suave para propiedades CSS
						'transition-[box-shadow,border-color] duration-200',
						// Posición base
						'ml-0.5'
					)}
					ref={thumbRef}
					style={{
						willChange: animated ? 'transform' : undefined,
					}}
				/>
			</SwitchPrimitives.Root>
		);
	}
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
export type { SwitchProps };
