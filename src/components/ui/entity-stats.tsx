import React, { useMemo } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export interface StatItem {
	/**
	 * Color personalizado para esta estadística (hex, rgb, nombre de color)
	 */
	color?: string;
	/**
	 * Descripción adicional para el tooltip
	 */
	description?: string;
	/**
	 * Icono opcional (componente de Lucide o SVG)
	 */
	icon?: React.ReactNode;
	/**
	 * Identificador único para la estadística, usado como key
	 */
	id?: string;
	/**
	 * Etiqueta para la estadística
	 */
	label: string;
	/**
	 * Valor numérico de la estadística
	 */
	value: number;
}

export interface EntityStatsProps {
	/**
	 * Activar animación al aparecer
	 */
	animated?: boolean;
	/**
	 * Mostrar como badges en lugar de lista
	 */
	asBadges?: boolean;
	/**
	 * Clases adicionales
	 */
	className?: string;
	/**
	 * Color principal para utilizar en las estadísticas (se usa como fallback)
	 */
	primaryColor?: string;
	/**
	 * Tamaño del componente
	 */
	size?: 'sm' | 'md' | 'lg';
	/**
	 * Estadísticas a mostrar
	 */
	stats: StatItem[];
}

/**
 * Componente para mostrar estadísticas relacionadas con entidades.
 * Puede mostrar números con etiquetas e iconos opcionales.
 */
export function EntityStats({
	stats,
	primaryColor = 'var(--dt-primary-500)',
	size = 'md',
	animated = true,
	asBadges = false,
	className,
}: EntityStatsProps) {
	// Calcular el tamaño de la fuente según el size prop
	const fontSize = useMemo(() => {
		switch (size) {
			case 'sm':
				return 'text-xs';
			case 'lg':
				return 'text-base';
			default:
				return 'text-sm';
		}
	}, [size]);

	// No renderizar si no hay estadísticas
	if (!stats || stats.length === 0) {
		return null;
	}

	// Generar claves únicas para cada estadística
	const statsWithKeys = stats.map((stat, idx) => ({
		...stat,
		key: stat.id || `stat-${stat.label}-${idx}`,
	}));

	// Renderizar como badges
	if (asBadges) {
		return (
			<div className={cn('flex flex-wrap gap-1', className)}>
				{statsWithKeys.map((stat) => (
					<TooltipProvider key={stat.key}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									className={cn(fontSize, 'whitespace-nowrap')}
									style={{
										borderColor: `color-mix(in oklab, ${stat.color || primaryColor}, transparent 50%)`,
									}}
									variant="outline"
								>
									{stat.icon ? <span className="mr-1">{stat.icon}</span> : null}
									{stat.value} {stat.label}
								</Badge>
							</TooltipTrigger>
							{stat.description && (
								<TooltipContent>
									<p>{stat.description}</p>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				))}
			</div>
		);
	}

	// Renderizar como lista de estadísticas
	return (
		<div className={cn('flex flex-wrap gap-2', className)}>
			{statsWithKeys.map((stat, index) => {
				const StatsContainer = animated ? (motion.div as any) : 'div';

				return (
					<TooltipProvider key={stat.key}>
						<Tooltip>
							<TooltipTrigger asChild>
								<StatsContainer
									className={cn(
										'flex items-center rounded-md px-2 py-1',
										fontSize,
										'bg-background-muted/10 transition-colors hover:bg-background-muted/20'
									)}
									style={{ borderLeft: `3px solid ${stat.color || primaryColor}` }}
									{...(animated
										? {
												initial: { opacity: 0, y: 5 },
												animate: { opacity: 1, y: 0 },
												transition: { delay: index * 0.1 },
											}
										: {})}
								>
									{stat.icon && <span className="mr-1.5">{stat.icon}</span>}
									<span className="mr-1 font-semibold">{stat.value}</span>
									<span className="text-muted-foreground">{stat.label}</span>
								</StatsContainer>
							</TooltipTrigger>
							{stat.description && (
								<TooltipContent>
									<p>{stat.description}</p>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				);
			})}
		</div>
	);
}
