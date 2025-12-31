'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Progress con Design Tokens v2
 * - Borde 2px para mayor definición
 * - Sombra inset en track
 * - Gradiente en indicator
 * - Transiciones suaves
 */
const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
	<ProgressPrimitive.Root
		className={cn(
			'relative h-3 w-full overflow-hidden rounded-dt-xl border-2 border-border/30 bg-primary/10 shadow-dt-inset-1',
			className
		)}
		ref={ref}
		{...props}
	>
		<ProgressPrimitive.Indicator
			className="h-full w-full flex-1 bg-linear-to-r from-primary to-primary/85 transition-all duration-dt-normal ease-dt-out"
			style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
		/>
	</ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
