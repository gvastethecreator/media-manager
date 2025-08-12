/**
 * @file Adaptador de servicios de thumbnail integrado con EntityTypeConfig
 * @module services/thumbnails/entity-thumbnail-adapter
 * @description Integra el sistema EntityTypeConfig con los servicios existentes de thumbnails
 */

import { ENTITY_TYPE_CONFIGS } from '@/config/entity-type-configs';
import { serverLogger } from '@/lib/logger/server-logger';
import { imageService } from '@/services/image';
import { type AnyEntityWithStats, EntityStatsType, getEntityStatsType, isImageWithStats } from '@/types/migration';

/**
 * Opciones para la generación de thumbnails
 */
interface EntityThumbnailOptions {
	/** Tamaño del thumbnail en píxeles */
	size?: number;
	/** Calidad del thumbnail */
	quality?: 'low' | 'medium' | 'high';
	/** Forzar regeneración aunque exista caché */
	force?: boolean;
	/** Callback para progreso de generación */
	onProgress?: (progress: number) => void;
}

/**
 * Resultado de generación de thumbnail
 */
interface ThumbnailResult {
	url: string;
	cached: boolean;
	timestamp: number;
}

/**
 * Adaptador principal para thumbnails de entidades
 */
class EntityThumbnailAdapter {
	private readonly logger = serverLogger;

	/**
	 * Genera un thumbnail para cualquier tipo de entidad
	 */
	async generateThumbnail(entity: AnyEntityWithStats, options: EntityThumbnailOptions = {}): Promise<ThumbnailResult> {
		const entityType = getEntityStatsType(entity);
		if (!entityType) {
			throw new Error(`Cannot determine entity type for entity ${entity.id}`);
		}

		const config = ENTITY_TYPE_CONFIGS[entityType];
		if (!config) {
			throw new Error(`No configuration found for entity type ${entityType}`);
		}

		this.logger.info('Generating thumbnail for entity', {
			entityId: entity.id,
			entityType,
			entityName: entity.name,
			options,
		});

		// Generar thumbnail según el tipo de entidad
		try {
			const url = await this.generateThumbnailByType(entity, entityType, options);
			return {
				url,
				cached: false,
				timestamp: Date.now(),
			};
		} catch (error) {
			this.logger.error('Failed to generate thumbnail', {
				entityId: entity.id,
				entityType,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			// Retornar thumbnail por defecto basado en la configuración
			return {
				url: this.getDefaultThumbnail(entityType),
				cached: false,
				timestamp: Date.now(),
			};
		}
	}

	/**
	 * Genera thumbnail específico según el tipo de entidad
	 */
	private async generateThumbnailByType(
		entity: AnyEntityWithStats,
		entityType: EntityStatsType,
		options: EntityThumbnailOptions
	): Promise<string> {
		switch (entityType) {
			case EntityStatsType.IMAGE:
				if (isImageWithStats(entity)) {
					return await this.generateImageThumbnail(entity, options);
				}
				break;

			default:
				// Para otros tipos, generar un thumbnail basado en icono
				return await this.generateIconThumbnail(entityType, options);
		}

		throw new Error(`Unsupported entity type for thumbnail generation: ${entityType}`);
	}

	/**
	 * Genera thumbnail para imágenes usando el servicio existente
	 */
	private async generateImageThumbnail(entity: AnyEntityWithStats, _options: EntityThumbnailOptions): Promise<string> {
		// Usar el servicio existente de imágenes
		await imageService.generateThumbnail(entity.id);

		// Obtener la URL del thumbnail generado por el servicio
		const thumbnailBuffer = await imageService.getThumbnail(entity.id);
		if (thumbnailBuffer) {
			// Convertir buffer a data URL
			const base64 = thumbnailBuffer.toString('base64');
			return `data:image/jpeg;base64,${base64}`;
		}

		return this.getDefaultThumbnail(EntityStatsType.IMAGE);
	}

	/**
	 * Genera thumbnail basado en el icono del tipo de entidad
	 */
	private async generateIconThumbnail(entityType: EntityStatsType, options: EntityThumbnailOptions): Promise<string> {
		const config = ENTITY_TYPE_CONFIGS[entityType];
		if (!config) {
			throw new Error(`No configuration found for entity type ${entityType}`);
		}

		// Generar un thumbnail SVG basado en el icono y color
		const size = options.size || 256;
		const svg = `
			<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
				<rect width="100%" height="100%" fill="${config.color}20"/>
				<g transform="translate(${size / 4}, ${size / 4})">
					<rect width="${size / 2}" height="${size / 2}" fill="${config.color}" rx="8"/>
				</g>
			</svg>
		`.trim();

		// Convertir SVG a data URL
		const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
		return dataUrl;
	}

	/**
	 * Obtiene un thumbnail por defecto para el tipo de entidad
	 */
	private getDefaultThumbnail(entityType: EntityStatsType): string {
		const config = ENTITY_TYPE_CONFIGS[entityType];
		const color = config?.color || '#6b7280';

		// Generar un thumbnail SVG simple por defecto
		const svg = `
			<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
				<rect width="100%" height="100%" fill="${color}20"/>
				<circle cx="128" cy="128" r="32" fill="${color}"/>
			</svg>
		`.trim();

		return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
	}

	/**
	 * Genera thumbnails en lote para múltiples entidades
	 */
	async generateBatchThumbnails(
		entities: AnyEntityWithStats[],
		options: EntityThumbnailOptions = {}
	): Promise<Map<string, ThumbnailResult>> {
		const results = new Map<string, ThumbnailResult>();
		const batchSize = 5; // Procesar en lotes para evitar sobrecarga

		this.logger.info('Starting batch thumbnail generation', {
			entityCount: entities.length,
			batchSize,
		});

		for (let i = 0; i < entities.length; i += batchSize) {
			const batch = entities.slice(i, i + batchSize);
			const batchPromises = batch.map(async (entity) => {
				try {
					const result = await this.generateThumbnail(entity, options);
					results.set(entity.id, result);

					// Reportar progreso si se proporciona callback
					if (options.onProgress) {
						const progress = ((i + batch.indexOf(entity) + 1) / entities.length) * 100;
						options.onProgress(progress);
					}
				} catch (error) {
					this.logger.error('Failed to generate thumbnail in batch', {
						entityId: entity.id,
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			});

			await Promise.all(batchPromises);
		}

		this.logger.info('Completed batch thumbnail generation', {
			totalEntities: entities.length,
			successfulThumbnails: results.size,
		});

		return results;
	}

	/**
	 * Limpia thumbnails en caché para una entidad
	 */
	async clearThumbnailCache(entityId: string): Promise<void> {
		this.logger.info('Clearing thumbnail cache for entity', { entityId });
		// Implementar limpieza de caché según la implementación específica
		// Por ahora, esto es un stub
	}

	/**
	 * Obtiene información sobre el caché de thumbnails
	 */
	async getCacheInfo(): Promise<{
		totalCached: number;
		totalSize: number;
		oldestEntry: Date | null;
		newestEntry: Date | null;
	}> {
		// Implementar obtención de información de caché
		// Por ahora, retornar valores por defecto
		return {
			totalCached: 0,
			totalSize: 0,
			oldestEntry: null,
			newestEntry: null,
		};
	}
}

// Exportar singleton
export const entityThumbnailAdapter = new EntityThumbnailAdapter();

// Exportar tipos
export type { EntityThumbnailOptions, ThumbnailResult };
