/**
 * @file Theme Preview
 * @module components/settings/themes/theme-preview
 * @description Componente de preview en vivo de un tema
 */

import { cn } from '@/lib/utils';
import type { ThemeColors } from '@/types/theme';

interface ThemePreviewProps {
	/** Colores del tema a previsualizar */
	colors: ThemeColors;
	/** Nombre del tema */
	name?: string;
	/** Si está seleccionado */
	isSelected?: boolean;
	/** Callback al hacer click */
	onClick?: () => void;
	/** Tamaño del preview */
	size?: 'sm' | 'md' | 'lg';
	/** Clase adicional */
	className?: string;
}

/**
 * Preview visual de un tema mostrando los colores principales
 */
export function ThemePreview({ colors, name, isSelected, onClick, size = 'md', className }: ThemePreviewProps) {
	const sizeClasses = {
		sm: 'h-24 w-32',
		md: 'h-32 w-44',
		lg: 'h-40 w-56',
	};

	return (
		<button
			className={cn(
				'group relative overflow-hidden rounded-lg border transition-all duration-200',
				isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-border hover:shadow-md',
				onClick && 'cursor-pointer',
				sizeClasses[size],
				className
			)}
			onClick={onClick}
			style={{ backgroundColor: colors.background }}
			type="button"
		>
			{/* Sidebar mock */}
			<div className="absolute top-0 left-0 h-full w-1/4" style={{ backgroundColor: colors.sidebarBackground }}>
				{/* Sidebar items */}
				<div className="flex flex-col gap-1 p-1">
					<div className="h-2 w-full rounded-sm" style={{ backgroundColor: colors.sidebarPrimary }} />
					<div className="h-1.5 w-3/4 rounded-sm opacity-50" style={{ backgroundColor: colors.sidebarForeground }} />
					<div className="h-1.5 w-2/3 rounded-sm opacity-30" style={{ backgroundColor: colors.sidebarForeground }} />
				</div>
			</div>

			{/* Main content area */}
			<div className="absolute top-0 right-0 h-full w-3/4 p-2">
				{/* Header */}
				<div className="mb-2 h-2 w-1/2 rounded-sm" style={{ backgroundColor: colors.foreground }} />

				{/* Cards grid */}
				<div className="flex gap-1">
					<div className="h-8 flex-1 rounded-sm" style={{ backgroundColor: colors.card, borderColor: colors.border }} />
					<div className="h-8 flex-1 rounded-sm" style={{ backgroundColor: colors.card, borderColor: colors.border }} />
				</div>

				{/* Primary button */}
				<div className="mt-2 h-3 w-1/3 rounded-sm" style={{ backgroundColor: colors.primary }} />

				{/* Muted text */}
				<div className="mt-1 h-1 w-1/2 rounded-sm opacity-50" style={{ backgroundColor: colors.mutedForeground }} />
			</div>

			{/* Selection indicator */}
			{isSelected && (
				<div className="absolute right-1 bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
					</svg>
				</div>
			)}

			{/* Name overlay on hover */}
			{name && (
				<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
					<span className="font-medium text-background text-xs">{name}</span>
				</div>
			)}
		</button>
	);
}

/**
 * Preview compacto de colores (para lista)
 */
export function ThemeColorStrip({ colors, className }: { colors: ThemeColors; className?: string }) {
	const displayColors = [colors.primary, colors.secondary, colors.accent, colors.background, colors.foreground];

	return (
		<div className={cn('flex h-3 w-full overflow-hidden rounded', className)}>
			{displayColors.map((color, i) => (
				<div className="flex-1" key={i} style={{ backgroundColor: color }} />
			))}
		</div>
	);
}

/**
 * Preview de colores en grid
 */
export function ThemeColorGrid({ colors, className }: { colors: Partial<ThemeColors>; className?: string }) {
	const colorEntries = Object.entries(colors).filter(([_, v]) => v);

	return (
		<div className={cn('grid grid-cols-4 gap-1', className)}>
			{colorEntries.slice(0, 8).map(([key, value]) => (
				<div
					className="aspect-square rounded-sm border border-border/20"
					key={key}
					style={{ backgroundColor: value }}
					title={key}
				/>
			))}
		</div>
	);
}
