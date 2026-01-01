import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Textarea con Design Tokens v2
 * - Borde 2px para mayor definición
 * - Sombra inset sutil en idle
 * - Ring y sombra elevada en focus
 * - Transición suave con tokens de motion
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					'flex min-h-[60px] w-full rounded-dt-sm border-2 border-input bg-background px-3 py-2 text-base shadow-dt-inset-1 transition-all duration-dt-normal ease-dt-out placeholder:text-muted-foreground hover:border-muted-foreground/50 focus-visible:border-primary focus-visible:shadow-dt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive md:text-sm',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Textarea.displayName = 'Textarea';

export { Textarea };
