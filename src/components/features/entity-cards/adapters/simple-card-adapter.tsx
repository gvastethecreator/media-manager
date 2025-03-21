'use client';

/**
 * ADAPTADOR SIMPLIFICADO TEMPORAL
 *
 * Esta versión simplificada del adaptador resuelve problemas de rendimiento
 * utilizando la implementación mínima de EntityCard
 */

import { useCardDisplay } from '../context/card-display-context';
import { createDebugger } from '../debug/render-debug';
import { EntityCard } from '../entity-card';
import { JsonEntityCard } from '../json-entity-card';
import type { CardOptions } from '../types/unified-card-types';
import { cn } from '../utils/cn';
import { normalizeEntityData } from '../utils/data-validator';

// Crear debugger para el adaptador
const debug = createDebugger('SimpleCardAdapter', process.env.NODE_ENV === 'development');

// Propiedad base para todas las entidades
export interface SimpleEntity {
	id: string;
	name: string;
	description?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
	image?: string;
	[key: string]: unknown;
}

export interface SimpleCardAdapterProps {
	entityType: string;
	entity: SimpleEntity;
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
}

/**
 * Adaptador simplificado para entidades
 * Esta versión soporta los diferentes modos de visualización
 */
export function SimpleCardAdapter({
	entityType,
	entity,
	options = {},
	onClick,
	className,
}: SimpleCardAdapterProps) {
	// Acceder al contexto de modo de visualización
	const { displayMode } = useCardDisplay();

	// Verificar que la entidad existe
	if (!entity) {
		console.error(`Error: La entidad de tipo ${entityType} es undefined`);
		return (
			<div className="error-card p-4 border border-red-500 rounded-md">
				<h3 className="text-red-500 font-medium">Error de datos</h3>
				<p className="text-sm text-gray-500">No se pudo cargar la información de la entidad</p>
			</div>
		);
	}

	// Normalizar la entidad de forma básica
	const normalizedEntity = normalizeEntityData(entity, entityType);

	// Extraer propiedades básicas
	const {
		name: title,
		description,
		image,
		featuredImage,
		thumbnailUrl,
		coverImage,
	} = normalizedEntity;

	// Determinar la imagen a mostrar usando cualquier propiedad de imagen disponible
	const displayImage =
		image ||
		featuredImage ||
		thumbnailUrl ||
		coverImage ||
		(typeof normalizedEntity.avatar === 'string' ? normalizedEntity.avatar : undefined);

	// Logs de depuración en desarrollo
	if (process.env.NODE_ENV === 'development') {
		debug.logRender({
			message: `Renderizando SimpleCardAdapter en modo: ${displayMode}`,
			entityType,
			entityId: normalizedEntity.id
		});
	}

	// Renderizar según el modo seleccionado
	switch (displayMode) {
		case 'json':
			return (
				<JsonEntityCard
					entity={normalizedEntity}
					entityType={entityType}
					className={className}
					onClick={onClick ? () => onClick() : undefined}
				/>
			);

		case 'compact':
			return (
				<CompactCard
					name={title}
					description={description}
					image={displayImage}
					icon={icon}
					metadata={metadata}
					badges={badges}
					className={cn('compact-card', className)}
					onClick={onClick ? () => onClick() : undefined}
				/>
			);

		default:
			return (
				<EntityCard
					id={normalizedEntity.id}
					title={title || 'Sin título'}
					description={description || ''}
					image={displayImage}
					options={options as any}
					onClick={onClick ? () => onClick() : undefined}
					className={cn('simple-card', className)}
				/>
			);
	}
}