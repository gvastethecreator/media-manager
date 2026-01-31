'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Provider de Tooltips con configuración global optimizada
 * - delayDuration: 300ms (tiempo óptimo entre rápido y no intrusivo)
 * - skipDelayDuration: 100ms (para tooltips consecutivos)
 * - disableHoverableContent: false (permite interactuar con el contenido)
 */
const TooltipProvider = ({
	delayDuration = 300,
	skipDelayDuration = 100,
	...props
}: TooltipPrimitive.TooltipProviderProps) => (
	<TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props} />
);

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * TooltipContent con Design Tokens v2 y mejoras de UX
 * - Borde 2px sutil
 * - Sombra elevada (shadow-dt-3)
 * - Gradiente de fondo para profundidad
 * - avoidCollisions: evita que se corte en bordes de viewport
 * - collisionPadding: 16px de margen de seguridad
 * - sideOffset: 8px de separación del trigger (mejor legibilidad)
 */
const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			avoidCollisions={true}
			className={cn(
				'fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-[--radix-tooltip-content-transform-origin] animate-in overflow-hidden rounded-dt-sm border-2 border-primary/20 bg-linear-to-b from-primary to-primary/95 px-3 py-1.5 text-primary-foreground text-sm shadow-dt-3 data-[state=closed]:animate-out',
				className
			)}
			collisionPadding={16}
			ref={ref}
			sideOffset={sideOffset}
			{...props}
		/>
	</TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
