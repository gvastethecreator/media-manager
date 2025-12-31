import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Card con Design Tokens v2
 * - Borde 2px para mayor definición
 * - Sombra elevada con sistema dt
 * - Hover lift sutil con transición
 * - Gradiente de fondo sutil para profundidad
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div
		className={cn(
			'rounded-dt-lg border-2 border-border/50 bg-linear-to-b from-card to-card/95 text-card-foreground shadow-dt-2 transition-all duration-dt-normal ease-dt-out hover:-translate-y-0.5 hover:shadow-dt-3',
			className
		)}
		ref={ref}
		{...props}
	/>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div className={cn('flex flex-col space-y-1.5 p-6', className)} ref={ref} {...props} />
	)
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div className={cn('font-semibold leading-none tracking-tight', className)} ref={ref} {...props} />
	)
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div className={cn('text-muted-foreground text-sm', className)} ref={ref} {...props} />
	)
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => <div className={cn('p-6 pt-0', className)} ref={ref} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => <div className={cn('flex items-center p-6 pt-0', className)} ref={ref} {...props} />
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
