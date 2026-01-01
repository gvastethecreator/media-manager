import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Input con Design Tokens v2
 * - Borde 2px para mayor definición
 * - Sombra inset sutil en idle
 * - Ring y sombra elevada en focus
 * - Transición suave con tokens de motion
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				className={cn(
					'flex h-9 w-full rounded-dt-sm border-2 border-input bg-background px-3 py-1 text-base shadow-dt-inset-1 transition-all duration-dt-normal ease-dt-out file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground hover:border-muted-foreground/50 focus-visible:border-primary focus-visible:shadow-dt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive md:text-sm',
					className
				)}
				ref={ref}
				type={type}
				{...props}
			/>
		);
	}
);
Input.displayName = 'Input';

export { Input };
