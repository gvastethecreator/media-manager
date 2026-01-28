/**
 * 📊 DASHBOARD STAT CARD
 * ======================
 * Tarjeta de estadística reutilizable para dashboard
 * Usa Design Tokens v2 para consistencia visual
 */

import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* =====================================================
 * 🎨 VARIANTS
 * ===================================================== */

const statCardVariants = cva(
	'group relative overflow-hidden rounded-dt-md border backdrop-blur-sm transition-all duration-dt-normal',
	{
		variants: {
			variant: {
				default: 'border-border/30 bg-card/80 hover:bg-card/95',
				blue: 'border-blue-500/30 bg-linear-to-br from-blue-500/10 to-blue-600/20 hover:from-blue-500/20 hover:to-blue-600/30',
				purple:
					'border-purple-500/30 bg-linear-to-br from-purple-500/10 to-purple-600/20 hover:from-purple-500/20 hover:to-purple-600/30',
				green:
					'border-green-500/30 bg-linear-to-br from-green-500/10 to-green-600/20 hover:from-green-500/20 hover:to-green-600/30',
				orange:
					'border-orange-500/30 bg-linear-to-br from-orange-500/10 to-orange-600/20 hover:from-orange-500/20 hover:to-orange-600/30',
				yellow:
					'border-yellow-500/30 bg-linear-to-br from-yellow-500/10 to-yellow-600/20 hover:from-yellow-500/20 hover:to-yellow-600/30',
				indigo:
					'border-indigo-500/30 bg-linear-to-br from-indigo-500/10 to-indigo-600/20 hover:from-indigo-500/20 hover:to-indigo-600/30',
				cyan: 'border-cyan-500/30 bg-linear-to-br from-cyan-500/10 to-cyan-600/20 hover:from-cyan-500/20 hover:to-cyan-600/30',
				amber:
					'border-amber-500/30 bg-linear-to-br from-amber-500/10 to-amber-600/20 hover:from-amber-500/20 hover:to-amber-600/30',
				teal: 'border-teal-500/30 bg-linear-to-br from-teal-500/10 to-teal-600/20 hover:from-teal-500/20 hover:to-teal-600/30',
				rose: 'border-rose-500/30 bg-linear-to-br from-rose-500/10 to-rose-600/20 hover:from-rose-500/20 hover:to-rose-600/30',
				emerald:
					'border-emerald-500/30 bg-linear-to-br from-emerald-500/10 to-emerald-600/20 hover:from-emerald-500/20 hover:to-emerald-600/30',
				violet:
					'border-violet-500/30 bg-linear-to-br from-violet-500/10 to-violet-600/20 hover:from-violet-500/20 hover:to-violet-600/30',
				slate:
					'border-slate-500/30 bg-linear-to-br from-slate-500/10 to-slate-600/20 hover:from-slate-500/20 hover:to-slate-600/30',
			},
			size: {
				sm: 'p-2',
				md: 'p-3',
				lg: 'p-4',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'sm',
		},
	}
);

const iconColorMap: Record<string, string> = {
	default: 'text-foreground',
	blue: 'text-ui-info-text',
	purple: 'text-entity-character',
	green: 'text-ui-success-text',
	orange: 'text-ui-warning-text',
	yellow: 'text-ui-warning-text',
	indigo: 'text-entity-file-3d',
	cyan: 'text-entity-collection',
	amber: 'text-ui-warning-text',
	teal: 'text-entity-group',
	rose: 'text-ui-error-text',
	emerald: 'text-ui-success-text',
	violet: 'text-entity-album',
	slate: 'text-muted-foreground',
};

const subtitleColorMap: Record<string, string> = {
	default: 'text-muted-foreground',
	blue: 'text-ui-info-text/70',
	purple: 'text-entity-character/70',
	green: 'text-ui-success-text/70',
	orange: 'text-ui-warning-text/70',
	yellow: 'text-ui-warning-text/70',
	indigo: 'text-entity-file-3d/70',
	cyan: 'text-entity-collection/70',
	amber: 'text-ui-warning-text/70',
	teal: 'text-entity-group/70',
	rose: 'text-ui-error-text/70',
	emerald: 'text-ui-success-text/70',
	violet: 'text-entity-album/70',
	slate: 'text-muted-foreground/70',
};

/* =====================================================
 * 📦 TYPES
 * ===================================================== */

export interface DashboardStatCardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof statCardVariants> {
	/** Icono de la tarjeta */
	icon: LucideIcon;
	/** Título/etiqueta de la estadística */
	label: string;
	/** Valor principal a mostrar */
	value: string | number;
	/** Subtítulo o descripción adicional */
	subtitle?: string;
	/** Contenido adicional (badges, trends, etc) */
	extra?: ReactNode;
	/** Si está en estado de carga */
	isLoading?: boolean;
}

/* =====================================================
 * 🧩 COMPONENT
 * ===================================================== */

export const DashboardStatCard = memo(function DashboardStatCard({
	icon: Icon,
	label,
	value,
	subtitle,
	extra,
	variant = 'default',
	size = 'sm',
	isLoading = false,
	className,
	...props
}: DashboardStatCardProps) {
	const iconColor = iconColorMap[variant || 'default'];
	const subtitleColor = subtitleColorMap[variant || 'default'];

	if (isLoading) {
		return (
			<div className={cn(statCardVariants({ variant, size }), className)} {...props}>
				<div className="animate-pulse space-y-2">
					<div className="flex items-center gap-1.5">
						<div className="h-4 w-4 rounded bg-current/20" />
						<div className="h-3 w-16 rounded bg-current/20" />
					</div>
					<div className="h-5 w-12 rounded bg-current/30" />
					{subtitle && <div className="h-2 w-20 rounded bg-current/10" />}
				</div>
			</div>
		);
	}

	return (
		<div className={cn(statCardVariants({ variant, size }), className)} {...props}>
			{/* Header con icono y label */}
			<div className="flex items-center gap-1.5 pb-1">
				<Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
				<span className="truncate font-medium text-xs">{label}</span>
			</div>

			{/* Valor principal */}
			<div className="font-bold text-foreground text-lg tabular-nums">{value}</div>

			{/* Subtítulo */}
			{subtitle && <div className={cn('truncate text-[10px]', subtitleColor)}>{subtitle}</div>}

			{/* Contenido extra */}
			{extra && <div className="mt-1">{extra}</div>}
		</div>
	);
});

/* =====================================================
 * 📊 GRID COMPONENT
 * Contenedor grid para múltiples stat cards
 * ===================================================== */

export interface DashboardStatGridProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Número de columnas por breakpoint */
	columns?: {
		default?: number;
		sm?: number;
		md?: number;
		lg?: number;
		xl?: number;
	};
}

export const DashboardStatGrid = memo(function DashboardStatGrid({
	columns = { default: 2, sm: 3, md: 4, lg: 5, xl: 6 },
	className,
	children,
	...props
}: DashboardStatGridProps) {
	// Construir clases de grid dinámicamente
	const gridCols = cn(
		'grid gap-2',
		columns.default && `grid-cols-${columns.default}`,
		columns.sm && `sm:grid-cols-${columns.sm}`,
		columns.md && `md:grid-cols-${columns.md}`,
		columns.lg && `lg:grid-cols-${columns.lg}`,
		columns.xl && `xl:grid-cols-${columns.xl}`
	);

	return (
		<div className={cn(gridCols, className)} {...props}>
			{children}
		</div>
	);
});

export default DashboardStatCard;
