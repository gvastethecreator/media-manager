'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Switch final - Elegante y Animado
 *
 * Características:
 * - Borde 2px semitransparente para definición sutil
 * - Animaciones fluidas con GSAP
 * - Estados visuales claros con transiciones suaves
 * - Thumb con sombra elevada y brillo sutil
 */

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
	animated?: boolean;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
	({ className, animated = true, onCheckedChange, ...props }, ref) => {
		return (
			<SwitchPrimitives.Root
				className={cn(
					// Base styles
					'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2',
					animated ? 'transition-all duration-dt-normal ease-dt-out' : 'transition-none',
					// Borde semitransparente sutil
					'border-border/40',
					// Fondo según estado
					'data-[state=unchecked]:bg-muted/30',
					'data-[state=checked]:border-primary/40 data-[state=checked]:bg-primary/20',
					// Sombra interior sutil
					'shadow-dt-inset-1',
					// Focus states
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					// Disabled
					'disabled:cursor-not-allowed disabled:opacity-50',
					// Hover effects
					'hover:border-border/60 hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.1)]',
					'data-[state=checked]:hover:border-primary/50',
					className
				)}
				onCheckedChange={onCheckedChange}
				ref={ref}
				{...props}
			>
				<SwitchPrimitives.Thumb
					className={cn(
						'block h-5 w-5 rounded-full',
						// Fondo del thumb con gradiente sutil
						'bg-linear-to-b from-background to-muted',
						// Borde semitransparente
						'border border-border/30',
						// Sombra elevada elegante
						'shadow-dt-2',
						// Brillo sutil en la parte superior
						'relative before:absolute before:inset-x-0 before:top-0.5 before:h-px before:bg-linear-to-r before:from-transparent before:via-primary-foreground/50 before:to-transparent',
						// Transición suave para propiedades CSS
						animated
							? 'transition-[transform,box-shadow,border-color] duration-dt-fast ease-dt-out data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
							: 'transition-none data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
						// Posición base
						'ml-0.5'
					)}
				/>
			</SwitchPrimitives.Root>
		);
	}
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
export type { SwitchProps };
