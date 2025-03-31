/**
 * @file Funciones de mapeo para la entidad Video
 * @module transformers/video/mappers
 */

import { createLogger } from '@/lib/logger';
import type {
    RelatedVideo,
    VideoComplete,
    VideoCreateInput,
    VideoFilters,
    VideoMetadata,
    VideoSearchOptions,
    VideoUpdateInput,
    VideoVisualConfigComplete
} from '@/types/entities/video/types';
import type { Prisma } from '@prisma/client';
import {
    fromVideoVisualConfigComplete,
    toPrismaVideo
} from './serializers';

// Logger específico para el transformer de Video
const log = createLogger('video-mapper');

/**
 * 🔄 Mapea datos de creación de video a formato compatible con Prisma
 * @param data Datos de creación de video
 * @returns Objeto formateado para Prisma
 */
export function mapCreateVideoDataToPrisma(data: VideoCreateInput): Prisma.VideoCreateInput {
	try {
		// Convertir a formato Prisma base
		const prismaData = toPrismaVideo(data) as Prisma.VideoCreateInput;

		// Manejar relaciones si existen
		const relations: Record<string, any> = {};

		// Relación con folder (requerida)
		relations.folder = {
			connect: { id: data.folderId }
		};

		// Relaciones opcionales
		if (data.albums && data.albums.length > 0) {
			relations.albums = {
				connect: data.albums.map(album => ({ id: typeof album === 'string' ? album : album.id }))
			};
		}

		if (data.collections && data.collections.length > 0) {
			relations.collections = {
				connect: data.collections.map(collection => ({ id: typeof collection === 'string' ? collection : collection.id }))
			};
		}

		if (data.tags && data.tags.length > 0) {
			relations.tags = {
				connect: data.tags.map(tag => ({ id: typeof tag === 'string' ? tag : tag.id }))
			};
		}

		if (data.characters && data.characters.length > 0) {
			relations.characters = {
				connect: data.characters.map(character => ({ id: typeof character === 'string' ? character : character.id }))
			};
		}

		if (data.places && data.places.length > 0) {
			relations.places = {
				connect: data.places.map(place => ({ id: typeof place === 'string' ? place : place.id }))
			};
		}

		if (data.worldItems && data.worldItems.length > 0) {
			relations.worldItems = {
				connect: data.worldItems.map(item => ({ id: typeof item === 'string' ? item : item.id }))
			};
		}

		if (data.concepts && data.concepts.length > 0) {
			relations.concepts = {
				connect: data.concepts.map(concept => ({ id: typeof concept === 'string' ? concept : concept.id }))
			};
		}

		if (data.prompts && data.prompts.length > 0) {
			relations.prompts = {
				connect: data.prompts.map(prompt => ({ id: typeof prompt === 'string' ? prompt : prompt.id }))
			};
		}

		if (data.notes && data.notes.length > 0) {
			relations.notes = {
				connect: data.notes.map(note => ({ id: typeof note === 'string' ? note : note.id }))
			};
		}

		if (data.wildcards && data.wildcards.length > 0) {
			relations.wildcards = {
				connect: data.wildcards.map(wildcard => ({ id: typeof wildcard === 'string' ? wildcard : wildcard.id }))
			};
		}

		if (data.properties && data.properties.length > 0) {
			relations.properties = {
				connect: data.properties.map(property => ({ id: typeof property === 'string' ? property : property.id }))
			};
		}

		if (data.groups && data.groups.length > 0) {
			relations.groups = {
				connect: data.groups.map(group => ({ id: typeof group === 'string' ? group : group.id }))
			};
		}

		// Combinar datos base con relaciones
		return {
			...prismaData,
			...relations
		};
	} catch (error) {
		log.error('Error mapeando datos de creación de video', { error, data });
		throw new Error(`Error mapeando datos de creación de video: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea datos de actualización de video a formato compatible con Prisma
 * @param videoId ID del video a actualizar
 * @param data Datos de actualización
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateVideoDataToPrisma(videoId: string, data: VideoUpdateInput): Prisma.VideoUpdateArgs {
	try {
		// Convertir a formato Prisma base
		const prismaData = toPrismaVideo(data) as Record<string, any>;

		// Manejar relaciones si existen
		const relations: Record<string, any> = {};

		// Relación con folder (si se actualiza)
		if (data.folderId) {
			relations.folder = {
				connect: { id: data.folderId }
			};
		}

		// Relaciones opcionales
		if (data.albums) {
			relations.albums = {
				set: data.albums.map(album => ({ id: typeof album === 'string' ? album : album.id }))
			};
		}

		if (data.collections) {
			relations.collections = {
				set: data.collections.map(collection => ({ id: typeof collection === 'string' ? collection : collection.id }))
			};
		}

		if (data.tags) {
			relations.tags = {
				set: data.tags.map(tag => ({ id: typeof tag === 'string' ? tag : tag.id }))
			};
		}

		if (data.characters) {
			relations.characters = {
				set: data.characters.map(character => ({ id: typeof character === 'string' ? character : character.id }))
			};
		}

		if (data.places) {
			relations.places = {
				set: data.places.map(place => ({ id: typeof place === 'string' ? place : place.id }))
			};
		}

		if (data.worldItems) {
			relations.worldItems = {
				set: data.worldItems.map(item => ({ id: typeof item === 'string' ? item : item.id }))
			};
		}

		if (data.concepts) {
			relations.concepts = {
				set: data.concepts.map(concept => ({ id: typeof concept === 'string' ? concept : concept.id }))
			};
		}

		if (data.prompts) {
			relations.prompts = {
				set: data.prompts.map(prompt => ({ id: typeof prompt === 'string' ? prompt : prompt.id }))
			};
		}

		if (data.notes) {
			relations.notes = {
				set: data.notes.map(note => ({ id: typeof note === 'string' ? note : note.id }))
			};
		}

		if (data.wildcards) {
			relations.wildcards = {
				set: data.wildcards.map(wildcard => ({ id: typeof wildcard === 'string' ? wildcard : wildcard.id }))
			};
		}

		if (data.properties) {
			relations.properties = {
				set: data.properties.map(property => ({ id: typeof property === 'string' ? property : property.id }))
			};
		}

		if (data.groups) {
			relations.groups = {
				set: data.groups.map(group => ({ id: typeof group === 'string' ? group : group.id }))
			};
		}

		// Eliminar campos UI que no deben ir a Prisma
		delete prismaData.thumbnailUrl;
		delete prismaData.playState;
		delete prismaData.chapters;
		delete prismaData.isSelected;
		delete prismaData.privacyLevel;
		delete prismaData.sharedWith;

		// Combinar datos base con relaciones
		return {
			where: { id: videoId },
			data: {
				...prismaData,
				...relations
			}
		};
	} catch (error) {
		log.error('Error mapeando datos de actualización de video', { error, data });
		throw new Error(`Error mapeando datos de actualización de video: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea opciones de búsqueda a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Objeto formateado para Prisma
 */
export function mapVideoSearchOptionsToPrisma(options: VideoSearchOptions): Prisma.VideoFindManyArgs {
	try {
		// Construir objeto para Prisma
		const prismaOptions: Prisma.VideoFindManyArgs = {};

		// Paginación
		if (options.skip !== undefined) {
			prismaOptions.skip = options.skip;
		}

		if (options.take !== undefined) {
			prismaOptions.take = options.take;
		}

		// Ordenamiento
		if (options.orderBy) {
			prismaOptions.orderBy = options.orderBy as any;
		}

		// Filtros
		if (options.where) {
			prismaOptions.where = mapVideoFiltersToPrisma(options.where);
		}

		// Incluir relaciones
		if (options.include) {
			prismaOptions.include = {};

			// Verificar cada relación individual
			if (options.include.folder) {
				prismaOptions.include.folder = true;
			}

			if (options.include.albums) {
				prismaOptions.include.albums = true;
			}

			if (options.include.collections) {
				prismaOptions.include.collections = true;
			}

			if (options.include.tags) {
				prismaOptions.include.tags = true;
			}

			if (options.include.characters) {
				prismaOptions.include.characters = true;
			}

			if (options.include.places) {
				prismaOptions.include.places = true;
			}

			if (options.include.worldItems) {
				prismaOptions.include.worldItems = true;
			}

			if (options.include.concepts) {
				prismaOptions.include.concepts = true;
			}

			if (options.include.prompts) {
				prismaOptions.include.prompts = true;
			}

			if (options.include.notes) {
				prismaOptions.include.notes = true;
			}

			if (options.include.wildcards) {
				prismaOptions.include.wildcards = true;
			}

			if (options.include.properties) {
				prismaOptions.include.properties = true;
			}

			if (options.include.groups) {
				prismaOptions.include.groups = true;
			}

			if (options.include._count) {
				prismaOptions.include._count = true;
			}
		}

		return prismaOptions;
	} catch (error) {
		log.error('Error mapeando opciones de búsqueda', { error, options });
		throw new Error(`Error mapeando opciones de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Mapea filtros de video a formato compatible con Prisma
 * @param filters Filtros de búsqueda
 * @returns Objeto formateado para Prisma
 */
export function mapVideoFiltersToPrisma(filters: VideoFilters): Prisma.VideoWhereInput {
	try {
		const prismaWhere: Prisma.VideoWhereInput = {};
		const AND: Prisma.VideoWhereInput[] = [];

		// Búsqueda por texto
		if (filters.search) {
			AND.push({
				OR: [
					{ name: { contains: filters.search, mode: 'insensitive' } },
					{ description: { contains: filters.search, mode: 'insensitive' } }
				]
			});
		}

		// Filtrar por duración
		if (filters.duration) {
			if (filters.duration.min !== undefined) {
				AND.push({ duration: { gte: filters.duration.min } });
			}

			if (filters.duration.max !== undefined) {
				AND.push({ duration: { lte: filters.duration.max } });
			}
		}

		// Filtrar por resolución
		if (filters.resolution) {
			if (filters.resolution.min !== undefined) {
				AND.push({ height: { gte: filters.resolution.min } });
			}

			if (filters.resolution.max !== undefined) {
				AND.push({ height: { lte: filters.resolution.max } });
			}
		}

		// Filtrar por formatos
		if (filters.formats && filters.formats.length > 0) {
			// Buscar en los metadatos serializados (esto es aproximado)
			const formatFilters = filters.formats.map(format => ({
				metadata: { contains: `"format":"${format}"` }
			}));
			AND.push({ OR: formatFilters });
		}

		// Filtrar por audio (esto es aproximado porque está en los metadatos)
		if (filters.hasAudio !== undefined) {
			AND.push({
				metadata: { contains: `"hasAudio":${filters.hasAudio}` }
			});
		}

		// Filtros directos
		if (filters.isPublic !== undefined) {
			AND.push({ isPublic: filters.isPublic });
		}

		if (filters.isFavorite !== undefined) {
			AND.push({ isFavorite: filters.isFavorite });
		}

		if (filters.folderId) {
			AND.push({ folderId: filters.folderId });
		}

		// Filtrar por relaciones
		if (filters.tags && filters.tags.length > 0) {
			AND.push({
				tags: {
					some: {
						id: { in: filters.tags }
					}
				}
			});
		}

		if (filters.albums && filters.albums.length > 0) {
			AND.push({
				albums: {
					some: {
						id: { in: filters.albums }
					}
				}
			});
		}

		if (filters.collections && filters.collections.length > 0) {
			AND.push({
				collections: {
					some: {
						id: { in: filters.collections }
					}
				}
			});
		}

		// Filtrar por rango de fechas
		if (filters.dateRange) {
			if (filters.dateRange.start) {
				AND.push({ createdAt: { gte: filters.dateRange.start } });
			}

			if (filters.dateRange.end) {
				AND.push({ createdAt: { lte: filters.dateRange.end } });
			}
		}

		// Combinar todos los filtros con AND
		if (AND.length > 0) {
			prismaWhere.AND = AND;
		}

		return prismaWhere;
	} catch (error) {
		log.error('Error mapeando filtros de video', { error, filters });
		throw new Error(`Error mapeando filtros de video: ${(error as Error).message}`);
	}
}

/**
 * 🎯 Extrae la duración formateada de los metadatos de un video
 * @param metadata Metadatos del video
 * @returns Duración formateada (HH:MM:SS)
 */
export function extractVideoDuration(metadata?: Partial<VideoMetadata>): string {
	if (!metadata || !metadata.duration) return '--:--';

	const totalSeconds = Math.floor(metadata.duration);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 🎯 Formatea la resolución de un video a partir de sus metadatos
 * @param metadata Metadatos del video
 * @returns Resolución formateada
 */
export function formatVideoResolution(metadata?: VideoMetadata): string {
	if (!metadata || !metadata.width || !metadata.height) return 'Desconocida';

	// Detectar si es HD, Full HD, 4K, etc.
	if (metadata.height >= 2160) return '4K';
	if (metadata.height >= 1440) return '2K';
	if (metadata.height >= 1080) return 'Full HD';
	if (metadata.height >= 720) return 'HD';
	if (metadata.height >= 480) return 'SD';

	return `${metadata.width}×${metadata.height}`;
}

/**
 * 🎯 Obtiene un frame específico del video como timestamp
 * @param totalDuration Duración total en segundos
 * @param percentage Porcentaje de la duración (0-1)
 * @returns Timestamp en formato HH:MM:SS
 */
export function getVideoFrameTimestamp(totalDuration: number, percentage: number): string {
	if (!totalDuration || percentage < 0 || percentage > 1) {
		return '00:00';
	}

	const targetSeconds = Math.floor(totalDuration * percentage);
	return extractVideoDuration({ duration: targetSeconds });
}

/**
 * 🔗 Mapea un video a formato para video relacionado
 * @param video Video completo a mapear
 * @param count Conteo de relación
 * @param strength Fuerza de la relación
 * @returns Objeto de video relacionado
 */
export function mapVideoToRelatedVideo(
	video: VideoComplete,
	count = 1,
	strength = 1
): RelatedVideo {
	return {
		id: video.id,
		name: video.name,
		thumbnailUrl: video.thumbnailUrl || `/api/videos/${video.id}/thumbnail`,
		duration: video.duration,
		count,
		strength
	};
}

/**
 * 🔄 Mapea datos de configuración visual para la creación
 * @param config Configuración visual completa
 * @returns Objeto formateado para Prisma
 */
export function mapVideoVisualConfigCompleteToPrisma(config: Partial<VideoVisualConfigComplete>) {
	// Convertir a configuración base con campos serializados
	const baseConfig = fromVideoVisualConfigComplete(config as VideoVisualConfigComplete);

	return {
		videoId: config.videoId,
		enable3DEffect: config.enable3DEffect ?? true,
		designSystem: config.designSystem,
		enableHolographicEffect: config.enableHolographicEffect ?? true,
		enableGlowEffect: config.enableGlowEffect ?? true,
		enableAnimatedBorder: config.enableAnimatedBorder ?? true,
		enableLightHalo: config.enableLightHalo ?? true,
		layerSystem: baseConfig.layerSystem,
		effects: baseConfig.effects,
		performance: baseConfig.performance,
		states: baseConfig.states,
		presetId: config.presetId,
	};
}

/**
 * 🔄 Mapea un objeto de VideoVisualConfigComplete a un formato para actualización
 * @param config Configuración visual completa
 * @returns Objeto formateado para Prisma
 */
export function mapVideoVisualConfigCompleteUpdateToPrisma(config: Partial<VideoVisualConfigComplete>) {
	const result: Record<string, any> = {};

	// Solo incluir campos que están definidos
	if (config.enable3DEffect !== undefined) result.enable3DEffect = config.enable3DEffect;
	if (config.designSystem !== undefined) result.designSystem = config.designSystem;
	if (config.enableHolographicEffect !== undefined) result.enableHolographicEffect = config.enableHolographicEffect;
	if (config.enableGlowEffect !== undefined) result.enableGlowEffect = config.enableGlowEffect;
	if (config.enableAnimatedBorder !== undefined) result.enableAnimatedBorder = config.enableAnimatedBorder;
	if (config.enableLightHalo !== undefined) result.enableLightHalo = config.enableLightHalo;
	if (config.presetId !== undefined) result.presetId = config.presetId;

	// Convertir configuración completa a formato base
	const baseConfig = fromVideoVisualConfigComplete(config as VideoVisualConfigComplete);

	// Agregar campos serializados si están definidos
	if (config.layerSystem !== undefined || config.layersConfig !== undefined) {
		result.layerSystem = baseConfig.layerSystem;
	}

	if (config.effects !== undefined || config.effectsConfig !== undefined) {
		result.effects = baseConfig.effects;
	}

	if (config.performance !== undefined || config.performanceConfig !== undefined) {
		result.performance = baseConfig.performance;
	}

	if (config.states !== undefined || config.statesConfig !== undefined) {
		result.states = baseConfig.states;
	}

	return result;
}
