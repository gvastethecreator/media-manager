'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Radio Group final - Elegante y Animado
 *
 * Características:
 * - Items con borde 2px semitransparente
 * - Círculo interior animado con efecto spring
 * - Transiciones suaves entre estados
 * - Estados hover y focus elegantes
 * - Animación de escala al seleccionar
 */

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
	animated?: boolean;
}

const RadioGroup = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
	({ className, animated = true, ...props }, ref) => {
		return <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} ref={ref} {...props} />;
	}
);
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
	animated?: boolean;
}

const RadioGroupItem = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
	({ className, animated = true, ...props }, ref) => {
		return (
			<RadioGroupPrimitive.Item
				className={cn(
					// Base layout
					'group aspect-square h-5 w-5 rounded-full',
					// Borde 2px semitransparente
					'border-2 border-border/50',
					// Fondo
					'bg-background',
					// Sombra sutil
					'shadow-dt-1',
					// Transiciones
					animated ? 'transition-all duration-dt-fast ease-dt-out active:scale-[0.98]' : 'transition-none',
					// Hover
					'hover:border-border/70 hover:shadow-dt-2',
					// Data states
					'data-[state=checked]:border-primary/50 data-[state=checked]:shadow-[0_2px_12px_rgba(var(--primary-rgb),0.2)]',
					// Focus
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					// Disabled
					'disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				ref={ref}
				{...props}
			>
				<RadioGroupPrimitive.Indicator
					className={cn(
						'flex items-center justify-center',
						animated && 'transition-transform duration-dt-fast ease-dt-out'
					)}
				>
					<div className={cn('h-2.5 w-2.5 rounded-full bg-primary origin-center')} />
				</RadioGroupPrimitive.Indicator>
			</RadioGroupPrimitive.Item>
		);
	}
);
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
export type { RadioGroupProps, RadioGroupItemProps };
