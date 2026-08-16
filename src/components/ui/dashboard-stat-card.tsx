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

const statCardVariants = cva('group relative overflow-hidden rounded-dt-xs border transition-all duration-dt-normal', {
	variants: {
		variant: {
			default: 'border-border/15 bg-card hover:border-border/25 hover:bg-card/90',
			primary: 'border-primary/10 bg-card hover:border-primary/20 hover:bg-primary/5',
			secondary: 'border-secondary/10 bg-card hover:border-secondary/20 hover:bg-secondary/5',
			success: 'border-success/10 bg-card hover:border-success/20 hover:bg-success/5',
			warning: 'border-warning/10 bg-card hover:border-warning/20 hover:bg-warning/5',
			destructive: 'border-destructive/10 bg-card hover:border-destructive/20 hover:bg-destructive/5',
			info: 'border-info/10 bg-card hover:border-info/20 hover:bg-info/5',
			accent: 'border-accent/10 bg-card hover:border-accent/20 hover:bg-accent/5',
			muted: 'border-muted/10 bg-card hover:border-muted/20 hover:bg-muted/5',
			image:
				'border-[var(--entity-image)]/10 bg-card hover:border-[var(--entity-image)]/20 hover:bg-[var(--entity-image)]/5',
			video:
				'border-[var(--entity-video)]/10 bg-card hover:border-[var(--entity-video)]/20 hover:bg-[var(--entity-video)]/5',
			folder:
				'border-[var(--entity-folder)]/10 bg-card hover:border-[var(--entity-folder)]/20 hover:bg-[var(--entity-folder)]/5',
			album:
				'border-[var(--entity-album)]/10 bg-card hover:border-[var(--entity-album)]/20 hover:bg-[var(--entity-album)]/5',
			collection:
				'border-[var(--entity-collection)]/10 bg-card hover:border-[var(--entity-collection)]/20 hover:bg-[var(--entity-collection)]/5',
			character:
				'border-[var(--entity-character)]/10 bg-card hover:border-[var(--entity-character)]/20 hover:bg-[var(--entity-character)]/5',
			place:
				'border-[var(--entity-place)]/10 bg-card hover:border-[var(--entity-place)]/20 hover:bg-[var(--entity-place)]/5',
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
});

const iconColorMap: Record<string, string> = {
	default: 'text-foreground',
	primary: 'text-primary',
	secondary: 'text-secondary',
	success: 'text-success',
	warning: 'text-warning',
	destructive: 'text-destructive',
	info: 'text-info',
	accent: 'text-accent',
	muted: 'text-muted-foreground',
	image: 'text-[var(--entity-image)]',
	video: 'text-[var(--entity-video)]',
	folder: 'text-[var(--entity-folder)]',
	album: 'text-[var(--entity-album)]',
	collection: 'text-[var(--entity-collection)]',
	character: 'text-[var(--entity-character)]',
	place: 'text-[var(--entity-place)]',
};

const subtitleColorMap: Record<string, string> = {
	default: 'text-muted-foreground',
	primary: 'text-primary/80',
	secondary: 'text-secondary/80',
	success: 'text-success/80',
	warning: 'text-warning/80',
	destructive: 'text-destructive/80',
	info: 'text-info/80',
	accent: 'text-accent/80',
	muted: 'text-muted-foreground/80',
	image: 'text-[var(--entity-image)]/80',
	video: 'text-[var(--entity-video)]/80',
	folder: 'text-[var(--entity-folder)]/80',
	album: 'text-[var(--entity-album)]/80',
	collection: 'text-[var(--entity-collection)]/80',
	character: 'text-[var(--entity-character)]/80',
	place: 'text-[var(--entity-place)]/80',
};

/* =====================================================
 * 📦 TYPES
 * ===================================================== */

export interface DashboardStatCardProps
	extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statCardVariants> {
	/** Contenido adicional (badges, trends, etc) */
	extra?: ReactNode;
	/** Icono de la tarjeta */
	icon: LucideIcon;
	/** Si está en estado de carga */
	isLoading?: boolean;
	/** Título/etiqueta de la estadística */
	label: string;
	/** Subtítulo o descripción adicional */
	subtitle?: string;
	/** Valor principal a mostrar */
	value: string | number;
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
