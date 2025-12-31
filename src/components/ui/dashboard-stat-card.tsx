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
				blue: 'border-blue-300/30 bg-linear-to-br from-blue-500/15 to-blue-600/25 hover:from-blue-500/25 hover:to-blue-600/35',
				purple:
					'border-purple-300/30 bg-linear-to-br from-purple-500/15 to-purple-600/25 hover:from-purple-500/25 hover:to-purple-600/35',
				green:
					'border-green-300/30 bg-linear-to-br from-green-500/15 to-green-600/25 hover:from-green-500/25 hover:to-green-600/35',
				orange:
					'border-orange-300/30 bg-linear-to-br from-orange-500/15 to-orange-600/25 hover:from-orange-500/25 hover:to-orange-600/35',
				yellow:
					'border-yellow-300/30 bg-linear-to-br from-yellow-500/15 to-yellow-600/25 hover:from-yellow-500/25 hover:to-yellow-600/35',
				indigo:
					'border-indigo-300/30 bg-linear-to-br from-indigo-500/15 to-indigo-600/25 hover:from-indigo-500/25 hover:to-indigo-600/35',
				cyan: 'border-cyan-300/30 bg-linear-to-br from-cyan-500/15 to-cyan-600/25 hover:from-cyan-500/25 hover:to-cyan-600/35',
				amber:
					'border-amber-300/30 bg-linear-to-br from-amber-500/15 to-amber-600/25 hover:from-amber-500/25 hover:to-amber-600/35',
				teal: 'border-teal-300/30 bg-linear-to-br from-teal-500/15 to-teal-600/25 hover:from-teal-500/25 hover:to-teal-600/35',
				rose: 'border-rose-300/30 bg-linear-to-br from-rose-500/15 to-rose-600/25 hover:from-rose-500/25 hover:to-rose-600/35',
				emerald:
					'border-emerald-300/30 bg-linear-to-br from-emerald-500/15 to-emerald-600/25 hover:from-emerald-500/25 hover:to-emerald-600/35',
				violet:
					'border-violet-300/30 bg-linear-to-br from-violet-500/15 to-violet-600/25 hover:from-violet-500/25 hover:to-violet-600/35',
				slate:
					'border-slate-300/30 bg-linear-to-br from-slate-500/15 to-slate-600/25 hover:from-slate-500/25 hover:to-slate-600/35',
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
	blue: 'text-blue-400',
	purple: 'text-purple-400',
	green: 'text-green-400',
	orange: 'text-orange-400',
	yellow: 'text-yellow-400',
	indigo: 'text-indigo-400',
	cyan: 'text-cyan-400',
	amber: 'text-amber-400',
	teal: 'text-teal-400',
	rose: 'text-rose-400',
	emerald: 'text-emerald-400',
	violet: 'text-violet-400',
	slate: 'text-slate-400',
};

const subtitleColorMap: Record<string, string> = {
	default: 'text-muted-foreground',
	blue: 'text-blue-200',
	purple: 'text-purple-200',
	green: 'text-green-200',
	orange: 'text-orange-200',
	yellow: 'text-yellow-200',
	indigo: 'text-indigo-200',
	cyan: 'text-cyan-200',
	amber: 'text-amber-200',
	teal: 'text-teal-200',
	rose: 'text-rose-200',
	emerald: 'text-emerald-200',
	violet: 'text-violet-200',
	slate: 'text-slate-200',
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
			<div className="font-bold text-lg text-white tabular-nums">{value}</div>

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
