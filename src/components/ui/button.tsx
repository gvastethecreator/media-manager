import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Button variants con Design Tokens v2
 * - Bordes de 2px para mayor definición
 * - Sombras outset+inset por estado (idle, hover, active)
 * - Gradientes sutiles same-family para profundidad
 * - Border-pulse en active state
 * - Transiciones suaves con tokens de motion
 */
const buttonVariants = cva(
	'btn-pulse inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-dt-sm font-medium text-sm transition-all duration-dt-normal ease-dt-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default:
					'border-2 border-primary/20 bg-linear-to-b from-primary to-primary/90 text-primary-foreground shadow-dt-2 hover:from-primary/95 hover:to-primary/85 hover:shadow-dt-3 active:translate-y-px active:shadow-dt-1',
				primary:
					'border-2 border-primary/20 bg-linear-to-b from-primary to-primary/90 text-primary-foreground shadow-dt-2 hover:from-primary/95 hover:to-primary/85 hover:shadow-dt-3 active:translate-y-px active:shadow-dt-1',
				destructive:
					'border-2 border-destructive/20 bg-linear-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-dt-2 hover:from-destructive/95 hover:to-destructive/85 hover:shadow-dt-3 active:translate-y-px active:shadow-dt-1',
				outline:
					'border-2 border-input bg-background shadow-dt-1 hover:border-accent hover:bg-accent hover:text-accent-foreground hover:shadow-dt-2 active:translate-y-px active:shadow-dt-0',
				secondary:
					'border-2 border-secondary/30 bg-linear-to-b from-secondary to-secondary/90 text-secondary-foreground shadow-dt-1 hover:from-secondary/95 hover:to-secondary/80 hover:shadow-dt-2 active:translate-y-px active:shadow-dt-0',
				dim: 'border-2 border-transparent bg-muted/40 text-muted-foreground shadow-dt-0 hover:bg-muted/60 hover:text-foreground hover:shadow-dt-1 active:translate-y-px active:bg-muted/70',
				ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-dt-1 active:bg-accent/80',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2',
				sm: 'h-8 rounded-dt-xs px-3 text-xs',
				md: 'h-9 px-4 py-2',
				lg: 'h-10 rounded-dt-md px-8',
				icon: 'h-9 w-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	loading?: boolean;
	/**
	 * Prop legacy para algunos componentes (ej. data-grid) que lo usan
	 * como señal semántica (icon vs default). No afecta estilos: usa `size`.
	 */
	mode?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, mode: _mode, asChild = false, loading = false, children, disabled, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				disabled={loading || disabled}
				ref={ref}
				{...props}
			>
				{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
				{children}
			</Comp>
		);
	}
);
Button.displayName = 'Button';

export { Button, buttonVariants };
