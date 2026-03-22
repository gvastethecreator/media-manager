/**
 * @file Componente para mostrar información de tipo de entidad
 * @module components/entity/entity-type-badge
 * @description Badge que muestra información visual del tipo de entidad con iconos y colores
 */

import { motion } from '@/components/ui/motion-shim';
// imports limpios: eliminados ComponentProps y Badge no usados
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEntityTypeConfig } from '@/hooks/use-entity-type-config';
import { cn } from '@/lib/utils';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

/**
 * 🏷️ Props para EntityTypeBadge
 */
export interface EntityTypeBadgeProps {
	/** Mostrar animación al hacer hover */
	animated?: boolean;
	/** Clase CSS adicional */
	className?: string;
	/** Mostrar texto además del icono */
	showText?: boolean;
	/** Mostrar tooltip con información adicional */
	showTooltip?: boolean;
	/** Tamaño del badge */
	size?: 'sm' | 'md' | 'lg';
	/** Tipo de entidad */
	type: EntityStatsType;
	/** Variante visual */
	variant?: 'solid' | 'outline' | 'ghost';
}

/**
 * 🎨 Badge que muestra el tipo de entidad con icono y color
 */
export function EntityTypeBadge({
	type,
	showText = false,
	showTooltip = true,
	size = 'md',
	variant = 'solid',
	animated = true,
	className,
}: EntityTypeBadgeProps) {
	const { color, secondaryColor, icon: Icon, displayName, emoji, metadata } = useEntityTypeConfig(type);

	// Estilos según el tamaño
	const sizeClasses = {
		sm: 'h-5 px-1.5 text-xs gap-1',
		md: 'h-6 px-2 text-sm gap-1.5',
		lg: 'h-7 px-2.5 text-sm gap-2',
	};

	// Estilos según la variante
	const getVariantStyles = () => {
		const baseStyles: React.CSSProperties = {
			'--entity-color': color,
		} as any;

		switch (variant) {
			case 'solid':
				return {
					...baseStyles,
					backgroundColor: 'var(--entity-color)',
					color: 'white',
					border: 'none',
				};
			case 'outline':
				return {
					...baseStyles,
					backgroundColor: 'transparent',
					color: 'var(--entity-color)',
					borderColor: 'var(--entity-color)',
					borderWidth: '1px',
					borderStyle: 'solid',
				};
			case 'ghost':
				return {
					...baseStyles,
					backgroundColor: 'color-mix(in oklab, var(--entity-color), transparent 90%)',
					color: 'var(--entity-color)',
					border: 'none',
				};
			default:
				return baseStyles;
		}
	};

	const badgeContent = (
		<motion.div
			className={cn(
				'inline-flex items-center rounded-full font-medium transition-all duration-200',
				sizeClasses[size],
				className
			)}
			initial={animated ? { scale: 1 } : false}
			style={getVariantStyles()}
			whileHover={animated ? { scale: 1.05 } : {}}
			whileTap={animated ? { scale: 0.95 } : {}}
		>
			<Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5')} />
			{showText && <span className="truncate">{displayName}</span>}
		</motion.div>
	);

	if (!showTooltip) {
		return badgeContent;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
				<TooltipContent className="max-w-xs" side="top">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="text-lg">{emoji}</span>
							<span className="font-semibold">{displayName}</span>
						</div>

						{metadata?.hasPreview === true && (
							<div className="text-muted-foreground text-xs">✨ Soporta vista previa</div>
						)}

						{metadata?.isContainer === true && (
							<div className="text-muted-foreground text-xs">📦 Contenedor de elementos</div>
						)}

						{metadata?.isRelational === true && (
							<div className="text-muted-foreground text-xs">🔗 Entidad relacional</div>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * 📊 Componente para mostrar estadísticas de tipos de entidad
 */
export interface EntityTypeStatsProps {
	/** Mostrar solo tipos con elementos */
	hideEmpty?: boolean;
	/** Límite de tipos a mostrar */
	limit?: number;
	/** Orientación del  */
	orientation?: 'horizontal' | 'vertical';
	/** Estadísticas por tipo */
	stats: Record<EntityStatsType, number>;
}

export function EntityTypeStats({ stats, hideEmpty = true, limit, orientation = 'horizontal' }: EntityTypeStatsProps) {
	// Filtrar y ordenar estadísticas
	const sortedStats = Object.entries(stats)
		.filter(([_, count]) => !hideEmpty || count > 0)
		.sort(([, a], [, b]) => b - a)
		.slice(0, limit);

	if (sortedStats.length === 0) {
		return (
			<div className="flex items-center justify-center py-4 text-muted-foreground">
				<span className="text-sm">No hay elementos</span>
			</div>
		);
	}

	const containerClasses = orientation === 'horizontal' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2';

	return (
		<div className={containerClasses}>
			{sortedStats.map(([type, count]) => (
				<div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2" key={type}>
					<EntityTypeBadge showTooltip={false} size="sm" type={type as EntityStatsType} variant="ghost" />
					<span className="font-medium text-sm">{count}</span>
				</div>
			))}
		</div>
	);
}

/**
 * 🎨 Componente para selector de tipo de entidad
 */
export interface EntityTypeSelectorProps {
	/** Tipos disponibles (si no se especifica, muestra todos) */
	availableTypes?: EntityStatsType[];
	/** Permitir selección múltiple */
	multiple?: boolean;
	/** Callback cuando cambia la selección */
	onSelectionChange?: (types: EntityStatsType[]) => void;
	/** Tipo seleccionado actualmente */
	selected?: EntityStatsType[];
	/** Tamaño de los badges */
	size?: 'sm' | 'md' | 'lg';
}

export function EntityTypeSelector({
	selected = [],
	onSelectionChange,
	availableTypes,
	multiple = true,
	size = 'md',
}: EntityTypeSelectorProps) {
	const types = availableTypes || Object.values(EntityStatsType);

	const handleTypeToggle = (type: EntityStatsType) => {
		if (!onSelectionChange) {
			return;
		}

		if (!multiple) {
			onSelectionChange([type]);
			return;
		}

		const isSelected = selected.includes(type);
		if (isSelected) {
			onSelectionChange(selected.filter((t) => t !== type));
		} else {
			onSelectionChange([...selected, type]);
		}
	};

	return (
		<div className="flex flex-wrap gap-2">
			{types.map((type) => {
				const isSelected = selected.includes(type);

				return (
					<button
						className={cn(
							'transition-all duration-200',
							isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
						)}
						key={type}
						onClick={() => handleTypeToggle(type)}
						type="button"
					>
						<EntityTypeBadge animated showText size={size} type={type} variant={isSelected ? 'solid' : 'outline'} />
					</button>
				);
			})}
		</div>
	);
}
