'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * @deprecated Usa `@/components/ui/slider`.
 * Se mantiene temporalmente para compatibilidad retroactiva.
 */

/**
 * Slider legacy con Design Tokens v2
 * - Track con borde 2px y sombra inset
 * - Thumb con gradiente y sombra elevada
 * - Transiciones suaves
 */
const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
	<SliderPrimitive.Root
		className={cn('relative flex w-full touch-none select-none items-center', className)}
		ref={ref}
		{...props}
	>
		<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-dt-xl border-2 border-border/30 bg-primary/10 shadow-dt-inset-1">
			<SliderPrimitive.Range className="absolute h-full bg-linear-to-r from-primary to-primary/90" />
		</SliderPrimitive.Track>
		<SliderPrimitive.Thumb className="block h-5 w-5 rounded-dt-xl border-2 border-primary/30 bg-linear-to-b from-background to-background/95 shadow-dt-2 transition-all duration-dt-fast hover:scale-110 hover:shadow-dt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
