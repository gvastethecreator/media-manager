import { cn } from '@/lib/utils';

/**
 * Kbd con Design Tokens v2
 * - Borde sutil con sombra inset
 * - Gradiente de fondo para profundidad 3D
 * - Soporte para temas claro/oscuro
 */
function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
	return (
		<kbd
			className={cn(
				// Base
				'pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1',
				// Typography
				'font-medium font-mono text-xs tracking-wide',
				// Shape & Border - Design Tokens v2
				'rounded-dt-xs border border-border/60 px-1.5',
				// Background con gradiente sutil para efecto 3D
				'bg-linear-to-b from-muted to-muted/80',
				// Sombra para efecto de tecla elevada
				'shadow-[0_1px_0_1px_var(--border),inset_0_0.5px_0_var(--background)]',
				// Color de texto
				'text-muted-foreground',
				// Icons
				"[&_svg:not([class*='size-'])]:size-3",
				// Dentro de tooltips: invertir colores
				'in-data-[slot=tooltip-content]:border-primary-foreground/20 in-data-[slot=tooltip-content]:bg-linear-to-b in-data-[slot=tooltip-content]:from-primary-foreground/20 in-data-[slot=tooltip-content]:to-primary-foreground/10 in-data-[slot=tooltip-content]:text-primary-foreground in-data-[slot=tooltip-content]:shadow-[0_1px_0_1px_color-mix(in_oklch,var(--primary-foreground),transparent_80%)]',
				className
			)}
			data-slot="kbd"
			{...props}
		/>
	);
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return <span className={cn('inline-flex items-center gap-0.5', className)} data-slot="kbd-group" {...props} />;
}

export { Kbd, KbdGroup };
