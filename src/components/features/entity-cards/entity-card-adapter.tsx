'use client';

import type { Folder } from '@/types/entities/folders';
import { EntityCardDev } from './entity-card-dev';
import type { EntityBasicInfo } from './types/unified-types';

export interface EntityCardAdapterProps {
	entityType: string;
	entity: any;
	options?: any;
	className?: string;
	onClick?: () => void;
}

/**
 * Adaptador que mapea entidades a la estructura que espera EntityCardDev
 * Versión simplificada para la refactorización
 *
 * IMPORTANTE: Este componente mantiene la misma API que antes pero ahora utiliza
 * internamente EntityCardDev, lo que simplifica el renderizado
 */
export function EntityCardAdapter({ entityType, entity, options = {}, className, onClick }: EntityCardAdapterProps) {
	// Extraer información básica de la entidad según su tipo
	const extractEntityInfo = (): EntityBasicInfo => {
		if (!entity)
			return {
				id: 'unknown',
				title: 'Entidad desconocida',
				description: '',
				metadata: {},
			};

		// Datos comunes para todos los tipos
		const baseInfo = {
			id: entity.id || 'unknown',
			title: entity.name || entity.title || 'Sin título',
			description: entity.description || '',
			image: entity.featuredImage || entity.image || entity.thumbnail,
		};

		// Metadata según el tipo de entidad
		const metadata: Record<string, string | number> = {};

		switch (entityType) {
			case 'folder': {
				const folder = entity as Folder;
				if (folder._count?.images || folder.imageCount) {
					metadata.Imágenes = folder._count?.images || folder.imageCount || 0;
				}
				if (folder.totalSize) {
					metadata.Tamaño = formatBytes(folder.totalSize);
				}
				break;
			}

			case 'collection':
			case 'album': {
				if (entity._count?.images || entity.imageCount) {
					metadata.Imágenes = entity._count?.images || entity.imageCount || 0;
				}
				if (entity.createdAt) {
					metadata.Creado = formatDate(entity.createdAt);
				}
				break;
			}

			case 'character':
			case 'place':
			case 'concept':
			case 'world-item':
			case 'prompt':
			case 'note': {
				// Metadatos genéricos para estos tipos
				if (entity.createdAt) {
					metadata.Creado = formatDate(entity.createdAt);
				}
				if (entity.type) {
					metadata.Tipo = entity.type;
				}
				break;
			}

			// Para tipos desconocidos, mostrar ID como metadata
			default:
				metadata.ID = entity.id || 'unknown';
				if (entity.type) {
					metadata.Tipo = entity.type;
				}
		}

		return {
			...baseInfo,
			metadata,
		};
	};

	// Función auxiliar para formatear bytes
	function formatBytes(bytes: number, decimals = 2): string {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
	}

	// Función auxiliar para formatear fechas
	function formatDate(date: Date | string): string {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleDateString();
	}

	// Extraer información de la entidad
	const entityInfo = extractEntityInfo();

	// Transformar opciones recibidas al formato que espera EntityCardDev
	const entityCardOptions = {
		primaryColor: options.primaryColor || '#3b82f6',
		secondaryColor: options.secondaryColor || '#1e40af',
	};

	return (
		<EntityCardDev
			id={entityInfo.id}
			title={entityInfo.title}
			description={entityInfo.description}
			image={entityInfo.image}
			metadata={entityInfo.metadata}
			className={className}
			onClick={onClick ? (e) => onClick() : undefined}
			options={entityCardOptions}
		/>
	);
}
