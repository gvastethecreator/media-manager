/**
 * @file Componente GridLayout estandarizado
 * @module components/layout/grid-layout
 * @description Layout grid responsive estandarizado para vistas de entidades
 *              Optimizado para mostrar 5 columnas en desktop (xl: 1280px+)
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { memo, type ReactNode } from 'react';
import { motion } from '@/components/ui/animejs-shim';
import { cn } from '@/lib/utils';

/**
 * Variantes del grid layout según densidad de contenido
 */
const gridLayoutVariants = cva(
	// Base: grid con gap estándar
	'grid gap-4',
	{
		variants: {
			/**
			 * Densidad del grid - afecta tamaño mínimo de items
			 */
			density: {
				compact: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7',
				default: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
				comfortable: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5',
				spacious: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4',
			},
			/**
			 * Tamaño del gap entre items
			 */
			gap: {
				none: 'gap-0',
				xs: 'gap-2',
				sm: 'gap-3',
				md: 'gap-4',
				lg: 'gap-6',
				xl: 'gap-8',
			},
			/**
			 * Padding interno del contenedor
			 */
			padding: {
				none: 'p-0',
				sm: 'p-2',
				md: 'p-4',
				lg: 'p-6',
				xl: 'p-8',
			},
			/**
			 * Si aplicar animaciones de entrada
			 */
			animated: {
				true: '',
				false: '',
			},
		},
		defaultVariants: {
			density: 'default',
			gap: 'md',
			padding: 'md',
			animated: true,
		},
	}
);

type GridLayoutVariantProps = VariantProps<typeof gridLayoutVariants>;

/**
 * Props del componente GridLayout
 */
export interface GridLayoutProps extends GridLayoutVariantProps {
	/** Contenido del grid (items) */
	children: ReactNode;
	/** Clases CSS adicionales */
	className?: string;
	/** Clases adicionales para cada item del grid */
	itemClassName?: string;
	/** Si animar los items individualmente */
	animateItems?: boolean;
	/** Delay base para animaciones (en segundos) */
	animationDelay?: number;
	/** Stagger entre items (en segundos) */
	animationStagger?: number;
	/** Si usar virtualización (para listas largas) */
	virtualized?: boolean;
}

/**
 * GridLayout estandarizado
 *
 * Configuración por defecto (density='default'):
 * - < 640px (sm): 2 columnas
 * - 640px+ (sm): 3 columnas
 * - 768px+ (md): 4 columnas
 * - 1024px+ (lg): 4 columnas
 * - 1280px+ (xl): 5 columnas ← TARGET PARA DESKTOP
 * - 1536px+ (2xl): 6 columnas
 *
 * @example
 * ```tsx
 * <GridLayout density="default" gap="md">
 *   {items.map(item => <Card key={item.id} data={item} />)}
 * </GridLayout>
 * ```
 */
export const GridLayout = memo(function GridLayout({
	children,
	className,
	density = 'default',
	gap = 'md',
	padding = 'md',
	animated = true,
	animateItems = true,
	animationDelay = 0,
	animationStagger = 0.05,
}: GridLayoutProps) {
	// Si no hay animaciones, renderizar directamente
	if (!(animated && animateItems)) {
		return <div className={cn(gridLayoutVariants({ density, gap, padding, animated }), className)}>{children}</div>;
	}

	// Con animaciones: wrappear cada hijo en motion.div
	// Nota: Esto requiere que children sea un array
	const childrenArray = Array.isArray(children) ? children : [children];

	return (
		<div className={cn(gridLayoutVariants({ density, gap, padding, animated }), className)}>
			{childrenArray.map((child, index) => (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					initial={{ opacity: 0, y: 20 }}
					key={index}
					transition={{
						duration: 0.3,
						delay: animationDelay + index * animationStagger,
						ease: 'cubicBezier(0.16, 1, 0.3, 1)',
					}}
				>
					{child}
				</motion.div>
			))}
		</div>
	);
});

/**
 * Wrapper para items dentro del GridLayout
 * Aplica animaciones individuales si es necesario
 */
export interface GridItemProps {
	/** Contenido del item */
	children: ReactNode;
	/** Index para animación staggered */
	index?: number;
	/** Si animar este item */
	animated?: boolean;
	/** Delay adicional */
	delay?: number;
	/** Clases adicionales */
	className?: string;
}

export const GridItem = memo(function GridItem({
	children,
	index = 0,
	animated = true,
	delay = 0,
	className,
}: GridItemProps) {
	if (!animated) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={className}
			initial={{ opacity: 0, y: 20 }}
			transition={{
				duration: 0.3,
				delay: delay + index * 0.05,
				ease: 'cubicBezier(0.16, 1, 0.3, 1)',
			}}
		>
			{children}
		</motion.div>
	);
});

/**
 * Configuraciones de grid predefinidas para diferentes casos de uso
 */
export const GRID_PRESETS = {
	/** Vista estándar de entidades - 5 columnas en desktop */
	default: {
		density: 'default' as const,
		gap: 'md' as const,
		padding: 'md' as const,
	},
	/** Vista compacta - más items por fila */
	compact: {
		density: 'compact' as const,
		gap: 'sm' as const,
		padding: 'sm' as const,
	},
	/** Vista cómoda - items más grandes */
	comfortable: {
		density: 'comfortable' as const,
		gap: 'md' as const,
		padding: 'md' as const,
	},
	/** Vista espaciosa - items grandes, pocos por fila */
	spacious: {
		density: 'spacious' as const,
		gap: 'lg' as const,
		padding: 'lg' as const,
	},
	/** Vista de files con más columnas */
	files: {
		density: 'compact' as const,
		gap: 'md' as const,
		padding: 'md' as const,
	},
};

export default GridLayout;
