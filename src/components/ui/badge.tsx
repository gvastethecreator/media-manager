import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Badge con Design Tokens v2
 * - Borde 2px para mayor definición
 * - Gradientes sutiles same-family
 * - Sombra sutil para profundidad
 * - Transiciones suaves
 */
const badgeVariants = cva(
	'inline-flex items-center rounded-dt-xs border-2 px-3 py-1 font-semibold text-sm transition-all duration-dt-fast ease-dt-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	{
		variants: {
			variant: {
				default:
					'border-primary/20 bg-linear-to-b from-primary to-primary/90 text-primary-foreground shadow-dt-1 hover:from-primary/95 hover:to-primary/80 hover:shadow-dt-2',
				primary:
					'border-primary/20 bg-linear-to-b from-primary to-primary/90 text-primary-foreground shadow-dt-1 hover:from-primary/95 hover:to-primary/80 hover:shadow-dt-2',
				secondary:
					'border-secondary/30 bg-linear-to-b from-secondary to-secondary/90 text-secondary-foreground shadow-dt-0 hover:from-secondary/95 hover:to-secondary/80 hover:shadow-dt-1',
				destructive:
					'border-destructive/20 bg-linear-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-dt-1 hover:from-destructive/95 hover:to-destructive/80 hover:shadow-dt-2',
				outline: 'border-border bg-transparent text-foreground hover:bg-accent/50 hover:shadow-dt-1',
				success:
					'border-success/20 bg-linear-to-b from-success to-success/90 text-success-foreground shadow-dt-1 hover:shadow-dt-2',
				warning:
					'border-warning/20 bg-linear-to-b from-warning to-warning/90 text-warning-foreground shadow-dt-1 hover:shadow-dt-2',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
