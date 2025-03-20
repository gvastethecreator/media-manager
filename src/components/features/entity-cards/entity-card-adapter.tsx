'use client';

import type { Folder } from '@/types/entities/folders';
import { EntityCard } from './entity-card';

export interface EntityCardAdapterProps {
	entityType: string;
	entity: any;
	options?: any;
	className?: string;
	onClick?: () => void;
}

/**
 * Adaptador que mapea entidades a la estructura que espera EntityCard
 * Versión simplificada para la refactorización
 */
export function EntityCardAdapter({
	entityType,
	entity,
	options = {},
	className,
	onClick,
}: EntityCardAdapterProps) {
	// Extraer información básica de la entidad según su tipo
	const extractEntityInfo = () => {
		if (!entity) return { id: 'unknown', title: 'Entidad desconocida' };

		// Datos comunes para todos los tipos
		const baseInfo = {
			id: entity.id || 'unknown',
			title: entity.name || entity.title || 'Sin título',
			description: entity.description || '',
			image: entity.featuredImage || entity.image || null,
		};

		// Metadata según el tipo de entidad
		const metadata: Record<string, string | number> = {};

		switch (entityType) {
			case 'folder':
				const folder = entity as Folder;
				if (folder._count?.images || folder.imageCount) {
					metadata['Imágenes'] = folder._count?.images || folder.imageCount || 0;
				}
				if (folder.totalSize) {
					metadata['Tamaño'] = formatBytes(folder.totalSize);
				}
				break;

			// Se pueden añadir más casos para otros tipos de entidades

			default:
				// Para tipos desconocidos, mostrar ID como metadata
				metadata['ID'] = entity.id || 'unknown';
		}

		return {
			...baseInfo,
			metadata,
		};
	};

	// Función auxiliar para formatear bytes
	function formatBytes(bytes: number, decimals = 2) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
	}

	// Extraer información de la entidad
	const entityInfo = extractEntityInfo();

	// Transformar opciones recibidas al formato que espera EntityCard
	const entityCardOptions = {
		primaryColor: options.primaryColor || '#3b82f6',
		secondaryColor: options.secondaryColor || '#1e40af',
	};

	return (
		<EntityCard
			id={entityInfo.id}
			title={entityInfo.title}
			className={className}
			onClick={onClick ? (e) => onClick() : undefined}
			options={entityCardOptions}
		/>
	);
}
