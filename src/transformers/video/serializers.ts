/**
 * @file Funciones para serializar y deserializar datos de videos
 * @module transformers/video/serializers
 */

import { VideoSchema } from '@/types/entities/video/schema';
import type {
    VideoBase,
    VideoComplete,
    VideoCreateInput,
    VideoMetadata,
    VideoRelations,
    VideoUpdateInput,
    VideoVisualConfig,
    VideoVisualConfigComplete
} from '@/types/entities/video/types';
import { createLogger } from '@/utils/logger';

// Logger específico para el transformer de Video
const log = createLogger('video-transformer');

/**
 * 🎯 Opciones para serializar/deserializar videos
 */
interface VideoTransformOptions {
	validateFields?: boolean;
	deserializeMetadata?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
}

/**
 * 🔄 Serializa un video completo para Prisma
 * @param video Objeto VideoComplete con metadatos deserializados
 * @returns Objeto formateado para Prisma
 */
export function toPrismaVideo(
	video: VideoComplete | VideoCreateInput | VideoUpdateInput,
	options: VideoTransformOptions = {}
): Record<string, any> {
	try {
		const { validateFields = true, deserializeMetadata = true } = options;

		// Validar datos de entrada si es requerido
		if (validateFields) {
			VideoSchema.parse(video);
		}

		// Base de datos para Prisma
		const prismaData: Record<string, any> = {
			...(video as Record<string, any>)
		};

		// Serializar metadatos si está presente y es un objeto
		if (video.metadata && deserializeMetadata && typeof video.metadata !== 'string') {
			prismaData.metadata = serializeVideoMetadata(video.metadata as VideoMetadata);
		}

		// Eliminar campos que no pertenecen al modelo Prisma
		delete prismaData.thumbnailUrl;
		delete prismaData.playState;
		delete prismaData.chapters;
		delete prismaData.isSelected;

		// Eliminar relaciones que se manejan de forma separada
		delete prismaData.folder;
		delete prismaData.albums;
		delete prismaData.collections;
		delete prismaData.tags;
		delete prismaData.characters;
		delete prismaData.places;
		delete prismaData.worldItems;
		delete prismaData.concepts;
		delete prismaData.prompts;
		delete prismaData.notes;
		delete prismaData.wildcards;
		delete prismaData.properties;
		delete prismaData.groups;
		delete prismaData._count;

		return prismaData;
	} catch (error) {
		log.error('Error transformando video a formato Prisma', { error });
		throw new Error(`Error transformando video a formato Prisma: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Deserializa un video desde Prisma
 * @param prismaVideo Objeto de video desde Prisma
 * @param options Opciones de transformación
 * @returns Video completo con metadatos deserializados
 */
export function fromPrismaVideo(
	prismaVideo: VideoBase & Record<string, any>,
	options: VideoTransformOptions = {}
): VideoComplete {
	try {
		const { deserializeMetadata = true, includeRelations = false, includeUI = false } = options;

		// Base del video
		const videoComplete: Record<string, any> = {
			...prismaVideo
		};

		// Deserializar metadatos si es un string y está habilitada la opción
		if (deserializeMetadata && prismaVideo.metadata && typeof prismaVideo.metadata === 'string') {
			videoComplete.metadata = deserializeVideoMetadata(prismaVideo.metadata);
		}

		// Incluir relaciones si están presentes y habilitadas
		if (includeRelations) {
			// Mantener todas las relaciones que existan en el objeto Prisma
			const relationsFields: (keyof VideoRelations)[] = [
				'folder', 'albums', 'collections', 'tags', 'characters',
				'places', 'worldItems', 'concepts', 'prompts', 'notes',
				'wildcards', 'properties', 'groups'
			];

			relationsFields.forEach(field => {
				if (prismaVideo[field]) {
					videoComplete[field] = prismaVideo[field];
				}
			});

			// Incluir contadores si están presentes
			if (prismaVideo._count) {
				videoComplete._count = prismaVideo._count;
			}
		}

		// Incluir campos UI si se solicita
		if (includeUI) {
			// Generar thumbnailUrl si corresponde
			if (prismaVideo.id) {
				videoComplete.thumbnailUrl = `/api/videos/${prismaVideo.id}/thumbnail`;
			}
		}

		return videoComplete as VideoComplete;
	} catch (error) {
		log.error('Error transformando video desde formato Prisma', { error });
		throw new Error(`Error transformando video desde formato Prisma: ${(error as Error).message}`);
	}
}

/**
 * 🔍 Deserializa los metadatos de un video
 * @param metadata String serializado de metadatos
 * @returns Objeto de metadatos deserializado o null
 */
export function deserializeVideoMetadata(metadata: string | null): VideoMetadata | null {
	if (!metadata) return null;

	try {
		return JSON.parse(metadata) as VideoMetadata;
	} catch (error) {
		log.error('Error deserializando metadatos de video', { error, metadata });
		return null;
	}
}

/**
 * 💾 Serializa los metadatos de un video
 * @param metadata Objeto de metadatos
 * @returns String serializado o null
 */
export function serializeVideoMetadata(metadata: VideoMetadata | null): string | null {
	if (!metadata) return null;

	try {
		return JSON.stringify(metadata);
	} catch (error) {
		log.error('Error serializando metadatos de video', { error });
		return null;
	}
}

/**
 * 🔄 Serializa la configuración visual de un video
 * @param config Configuración visual completa
 * @returns Configuración visual con campos serializados
 */
export function fromVideoVisualConfigComplete(
	config: VideoVisualConfigComplete
): VideoVisualConfig {
	const baseConfig: VideoVisualConfig = {
		...config
	};

	// Serializar campos JSON
	if (config.layersConfig) {
		try {
			baseConfig.layerSystem = JSON.stringify(config.layersConfig);
		} catch (error) {
			log.error('Error serializando layersConfig', { error });
		}
	}

	if (config.effectsConfig) {
		try {
			baseConfig.effects = JSON.stringify(config.effectsConfig);
		} catch (error) {
			log.error('Error serializando effectsConfig', { error });
		}
	}

	if (config.performanceConfig) {
		try {
			baseConfig.performance = JSON.stringify(config.performanceConfig);
		} catch (error) {
			log.error('Error serializando performanceConfig', { error });
		}
	}

	if (config.statesConfig) {
		try {
			baseConfig.states = JSON.stringify(config.statesConfig);
		} catch (error) {
			log.error('Error serializando statesConfig', { error });
		}
	}

	return baseConfig;
}

/**
 * 🔄 Deserializa la configuración visual de un video
 * @param config Configuración visual con campos serializados
 * @returns Configuración visual completa con campos deserializados
 */
export function toVideoVisualConfigComplete(
	config: VideoVisualConfig
): VideoVisualConfigComplete {
	const completeConfig: VideoVisualConfigComplete = {
		...config
	};

	// Deserializar campos JSON
	if (config.layerSystem) {
		try {
			completeConfig.layersConfig = JSON.parse(config.layerSystem);
		} catch (error) {
			log.error('Error deserializando layerSystem', { error });
		}
	}

	if (config.effects) {
		try {
			completeConfig.effectsConfig = JSON.parse(config.effects);
		} catch (error) {
			log.error('Error deserializando effects', { error });
		}
	}

	if (config.performance) {
		try {
			completeConfig.performanceConfig = JSON.parse(config.performance);
		} catch (error) {
			log.error('Error deserializando performance', { error });
		}
	}

	if (config.states) {
		try {
			completeConfig.statesConfig = JSON.parse(config.states);
		} catch (error) {
			log.error('Error deserializando states', { error });
		}
	}

	return completeConfig;
}

/**
 * 🔍 Valida y formatea un video para su uso
 * @param video Datos del video a validar
 * @returns Video validado y formateado
 */
export function validateVideo(video: Record<string, any>): VideoComplete {
	try {
		const validatedData = VideoSchema.parse(video);
		return validatedData as unknown as VideoComplete;
	} catch (error) {
		log.error('Error validando datos de video', { error, video });
		throw new Error(`Error validando datos de video: ${(error as Error).message}`);
	}
}

/**
 * 🎯 Extiende un video con campos adicionales
 * @param video Video base a extender
 * @param options Opciones de extensión
 * @returns Video extendido con campos adicionales
 */
export function extendVideo(
	video: VideoBase & Record<string, any>,
	options: VideoTransformOptions = {}
): VideoComplete {
	try {
		// Crear el video completo
		const extendedVideo = fromPrismaVideo(video, options);

		// UI por defecto
		if (!extendedVideo.thumbnailUrl && video.id) {
			extendedVideo.thumbnailUrl = `/api/videos/${video.id}/thumbnail`;
		}

		if (!extendedVideo.privacyLevel) {
			extendedVideo.privacyLevel = video.isPublic ? 'PUBLIC' : 'PRIVATE';
		}

		return extendedVideo;
	} catch (error) {
		log.error('Error extendiendo video', { error, video });
		throw new Error(`Error extendiendo video: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Extiende varios videos con campos adicionales
 * @param videos Lista de videos a extender
 * @param options Opciones de extensión
 * @returns Lista de videos extendidos
 */
export function extendVideos(
	videos: (VideoBase & Record<string, any>)[],
	options: VideoTransformOptions = {}
): VideoComplete[] {
	return videos.map(video => extendVideo(video, options));
}

// Exportar funciones obsoletas con alias para mantener compatibilidad
export const parseVideo = extendVideo;
export const toVideoComplete = fromPrismaVideo;
export const fromVideoComplete = toPrismaVideo;
