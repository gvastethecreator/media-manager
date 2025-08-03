/**
 * @file Componente de thumbnail unificado para entidades
 * @module components/common/thumbnails/entity-thumbnail
 * @description Componente que utiliza el sistema EntityTypeConfig para generar
 * thumbnails apropiados para cualquier tipo de entidad
 */

import { motion, type Transition } from 'motion/react';
import { memo } from 'react';
import { useEntityThumbnails, useEntityTypeConfig } from '@/hooks/use-entity-type-config';
import { cn } from '@/lib/utils';
import { type AnyEntityWithStats, EntityStatsType, getEntityStatsType } from '@/types/migration';
import { ImageThumbnail } from './image-thumbnail';

interface EntityThumbnailProps {
	/** Entidad para la cual generar el thumbnail */
	entity: AnyEntityWithStats;
	/** Tamaño del thumbnail */
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	/** Calidad del thumbnail a generar */
	quality?: 'low' | 'medium' | 'high';
	/** Clases CSS adicionales */
	className?: string;
	/** Si mostrar overlay con información */
	showOverlay?: boolean;
	/** Si aplicar animaciones */
	animated?: boolean;
	/** Callback cuando se hace clic */
	onClick?: () => void;
	/** Si está en modo de carga */
	loading?: boolean;
	/** Aspecto ratio personalizado */
	aspectRatio?: string;
}

const sizeClasses = {
	xs: 'w-8 h-8',
	sm: 'w-12 h-12',
	md: 'w-16 h-16',
	lg: 'w-24 h-24',
	xl: 'w-32 h-32',
};

const qualityToImageSize = {
	low: 128,
	medium: 256,
	high: 512,
};

/**
 * Componente unificado de thumbnail que usa el sistema EntityTypeConfig
 */
export const EntityThumbnail = memo<EntityThumbnailProps>(
	({
		entity,
		size = 'md',
		quality = 'medium',
		className,
		showOverlay = false,
		animated = true,
		onClick,
		loading = false,
		aspectRatio,
	}) => {
		// Obtener tipo de entidad y configuración (sin romper reglas de hooks)
		const entityType = getEntityStatsType(entity);
		// Fallback a un tipo seguro existente cuando no haya entityType
		const { config } = useEntityTypeConfig(entityType ?? EntityStatsType.IMAGE);
		const { getThumbnailUrl } = useEntityThumbnails();

		// Obtener URL del thumbnail
		const thumbnailUrl = entity ? getThumbnailUrl(entity) : undefined;

		// Manejar loading state
		const isLoading = loading;

		// Flags de guardas para el render (evitar return temprano antes de hooks)
		const cannotRender = !entityType || !config;

		// Clases CSS del contenedor
		const containerClasses = cn(
			'relative overflow-hidden rounded-lg border bg-muted/50',
			sizeClasses[size],
			onClick && 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200',
			isLoading && 'animate-pulse',
			className
		);

		// Props para el componente motion
		const motionProps = animated
			? {
					whileHover: { scale: 1.05 },
					whileTap: { scale: 0.95 },
					transition: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
				}
			: {};

		// Renderizar thumbnail específico según el tipo de entidad
		const renderThumbnail = () => {
			// Si no podemos determinar tipo o config, mostrar placeholder neutro
			if (cannotRender) {
				return (
					<div className="w-full h-full flex items-center justify-center bg-muted/40">
						<div className="w-4 h-4 border-2 border-muted-foreground/50 border-t-transparent rounded-full animate-spin" />
					</div>
				);
			}

			// Para imágenes, usar el componente ImageThumbnail existente
			if (entityType === EntityStatsType.IMAGE) {
				return (
					<ImageThumbnail
						path={(entity as any)?.path || '/placeholder.jpg'}
						name={entity?.name || 'Sin nombre'}
						size={qualityToImageSize[quality]}
						className="w-full h-full object-cover"
					/>
				);
			}

			// Para otros tipos, mostrar icono con color de fondo
			const IconComponent = config.icon;
			return (
				<div
					className="w-full h-full flex items-center justify-center"
					style={{ backgroundColor: `${config.color}20` }}
				>
					<IconComponent className="w-1/2 h-1/2 text-muted-foreground" style={{ color: config.color }} />
				</div>
			);
		};

		// Renderizar overlay con información
		const renderOverlay = () => {
			if (!showOverlay) return null;

			return (
				<div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
					<div className="text-white text-xs">
						<div className="font-medium truncate">{entity?.name || 'Sin nombre'}</div>
						<div className="text-white/80">{config?.displayName ?? ''}</div>
					</div>
				</div>
			);
		};

		// Renderizar loading state
		if (isLoading) {
			return (
				<motion.div className={containerClasses} {...motionProps}>
					<div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
						<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				</motion.div>
			);
		}

		return (
			<motion.div className={containerClasses} onClick={onClick} {...motionProps}>
				{renderThumbnail()}
				{renderOverlay()}
			</motion.div>
		);
	}
);

EntityThumbnail.displayName = 'EntityThumbnail';

/**
 * Componente compacto de thumbnail para listas densas
 */
export const EntityThumbnailCompact = memo<Omit<EntityThumbnailProps, 'size' | 'showOverlay' | 'animated'>>(
	({ entity, className, ...props }) => {
		const entityType = getEntityStatsType(entity);
		// Fallback a un tipo seguro existente cuando no haya entityType
		const { config } = useEntityTypeConfig(entityType ?? EntityStatsType.IMAGE);

		const IconComponent = config?.icon;

		return (
			<div
				className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0', className)}
				style={{ backgroundColor: `${config?.color ?? '#888'}20` }}
				role="img"
				aria-label={config?.displayName ?? 'thumbnail'}
			>
				{IconComponent ? (
					<IconComponent className="w-4 h-4" style={{ color: config?.color }} />
				) : (
					<div className="w-3 h-3 rounded-full bg-muted-foreground/60" />
				)}
			</div>
		);
	}
);

EntityThumbnailCompact.displayName = 'EntityThumbnailCompact';

/**
 * Grid de thumbnails para mostrar múltiples entidades
 */
interface EntityThumbnailGridProps {
	entities: AnyEntityWithStats[];
	maxItems?: number;
	size?: EntityThumbnailProps['size'];
	className?: string;
	onEntityClick?: (entity: AnyEntityWithStats) => void;
}

export const EntityThumbnailGrid = memo<EntityThumbnailGridProps>(
	({ entities, maxItems = 4, size = 'sm', className, onEntityClick }) => {
		const displayEntities = entities.slice(0, maxItems);
		const remainingCount = Math.max(0, entities.length - maxItems);

		// A11y: role group para colección de thumbnails
		return (
			<div className={cn('flex flex-wrap gap-1', className)}>
				{displayEntities.map((entity) => (
					<EntityThumbnail
						key={entity.id}
						entity={entity}
						size={size}
						onClick={() => onEntityClick?.(entity)}
						animated={false}
					/>
				))}
				{remainingCount > 0 && (
					<div
						className={cn(
							'flex items-center justify-center bg-muted rounded-lg border text-xs font-medium text-muted-foreground',
							sizeClasses[size]
						)}
					>
						+{remainingCount}
					</div>
				)}
			</div>
		);
	}
);

EntityThumbnailGrid.displayName = 'EntityThumbnailGrid';
