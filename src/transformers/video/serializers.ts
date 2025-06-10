/**
 * @file Funciones para serializar y deserializar datos de videos
 * @module transformers/video/serializers
 */

import { createLogger } from '@/lib/logger';
import { VideoSchema } from '@/types/entities/video/schema';
import type {
    VideoBase,
    VideoComplete,
    VideoCreateInput,
    VideoMetadata,
    VideoRelations,
    VideoUpdateInput,
    VideoVisualConfig,
    VideoVisualConfigComplete,
} from '@/types/entities/video/types';
import { TransformerError } from '@/utils/transformers/errors';

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
 * 🔄 Maneja errores durante la transformación de videos
 * @param error Error capturado
 * @param message Mensaje personalizado
 * @param defaultReturn Valor por defecto a retornar si se habilita recuperación
 * @param recover Si se debe intentar recuperación parcial
 * @returns Nunca retorna si recover es false, retorna defaultReturn si recover es true
 */
export function handleTransformerError<T>(
	error: unknown,
	message: string,
	defaultReturn?: T,
	recover = false
): T | never {
	const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
	const fullMessage = `${message}: ${errorMessage}`;

	// Registrar en el log
	log.error(fullMessage, { error });

	// Si se permite recuperación, retornar valor por defecto
	if (recover && defaultReturn !== undefined) {
		log.warn('Recuperando de error con valor por defecto en transformador');
		return defaultReturn;
	}

	// De lo contrario, lanzar el error
	throw new TransformerError(fullMessage);
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

		// Extraer campos que no deben ir al modelo Prisma
		const {
			thumbnailUrl,
			playState,
			chapters,
			isSelected,
			folder,
			albums,
			collections,
			tags,
			characters,
			places,
			worldItems,
			concepts,
			prompts,
			notes,
			wildcards,
			properties,
			groups,
			_count,
			...prismaData
		} = video as Record<string, any>;

		// Serializar metadatos si está presente y es un objeto
		if (video.metadata && deserializeMetadata && typeof video.metadata !== 'string') {
			prismaData.metadata = serializeVideoMetadata(video.metadata as VideoMetadata);
		}

		return prismaData;
	} catch (error) {
		return handleTransformerError(error, 'Error transformando video a formato Prisma', undefined, false);
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
			...prismaVideo,
		};

		// Deserializar metadatos si es un string y está habilitada la opción
		if (deserializeMetadata && prismaVideo.metadata && typeof prismaVideo.metadata === 'string') {
			videoComplete.metadata = deserializeVideoMetadata(prismaVideo.metadata);
		}

		// Incluir relaciones si están presentes y habilitadas
		if (includeRelations) {
			// Mantener todas las relaciones que existan en el objeto Prisma
			const relationsFields: (keyof VideoRelations)[] = [
				'folder',
				'albums',
				'collections',
				'tags',
				'characters',
				'places',
				'worldItems',
				'concepts',
				'prompts',
				'notes',
				'wildcards',
				'properties',
				'groups',
			];

			for (const field of relationsFields) {
				if (prismaVideo[field]) {
					videoComplete[field] = prismaVideo[field];
				}
			}

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
		return handleTransformerError(
			error,
			'Error transformando video desde formato Prisma',
			{
				id: prismaVideo?.id || 'error',
				name: prismaVideo?.name || 'Error al transformar video',
				path: prismaVideo?.path || '',
				size: prismaVideo?.size || 0,
				duration: prismaVideo?.duration || 0,
				width: prismaVideo?.width || 0,
				height: prismaVideo?.height || 0,
				createdAt: prismaVideo?.createdAt || new Date(),
				updatedAt: prismaVideo?.updatedAt || new Date(),
				folderId: prismaVideo?.folderId || null,
			} as VideoComplete,
			true
		);
	}
}

/**
 * 🔢 Serializa metadatos de video a formato JSON
 * @param metadata Objeto de metadatos
 * @returns String JSON
 */
export function serializeVideoMetadata(metadata: VideoMetadata): string {
	try {
		return JSON.stringify(metadata);
	} catch (error) {
		return handleTransformerError(error, 'Error serializando metadatos de video', '{}', true);
	}
}

/**
 * 🔢 Deserializa metadatos de video desde formato JSON
 * @param metadataStr String JSON
 * @returns Objeto de metadatos
 */
export function deserializeVideoMetadata(metadataStr: string): VideoMetadata {
	try {
		return JSON.parse(metadataStr) as VideoMetadata;
	} catch (error) {
		return handleTransformerError(error, 'Error deserializando metadatos de video', {} as VideoMetadata, true);
	}
}

/**
 * 🔄 Serializa configuración visual de video para Prisma
 * @param config Configuración visual
 * @returns Objeto formateado para Prisma
 */
export function toPrismaVideoVisualConfig(config: VideoVisualConfig): Record<string, any> {
	try {
		// Extraer campos que no deben ir al modelo Prisma
		const { ...prismaData } = config;
		return prismaData;
	} catch (error) {
		return handleTransformerError(
			error,
			'Error transformando configuración visual de video a formato Prisma',
			{},
			true
		);
	}
}

/**
 * 🔄 Deserializa configuración visual de video desde Prisma
 * @param prismaConfig Configuración visual desde Prisma
 * @returns Configuración visual completa
 */
export function fromVideoVisualConfigComplete(
	prismaConfig: VideoVisualConfig & Record<string, any>
): VideoVisualConfigComplete {
	try {
		// Crear configuración visual completa
		const visualConfig: VideoVisualConfigComplete = {
			...prismaConfig,
		};

		return visualConfig;
	} catch (error) {
		return handleTransformerError(
			error,
			'Error transformando configuración visual de video desde formato Prisma',
			{
				id: prismaConfig?.id || 'error',
				videoId: prismaConfig?.videoId || 'error',
				brightness: prismaConfig?.brightness || 1,
				contrast: prismaConfig?.contrast || 1,
				saturation: prismaConfig?.saturation || 1,
				createdAt: prismaConfig?.createdAt || new Date(),
				updatedAt: prismaConfig?.updatedAt || new Date(),
			},
			true
		);
	}
}

/**
 * 🧪 Valida un video contra el esquema
 * @param video Video a validar
 * @returns Video validado
 */
export function validateVideo(video: unknown): VideoBase {
	try {
		return VideoSchema.parse(video);
	} catch (error) {
		return handleTransformerError(error, 'Error validando video contra esquema', undefined, false);
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
		return handleTransformerError(
			error,
			'Error extendiendo video',
			{
				id: video?.id || 'error',
				name: video?.name || 'Error al extender video',
				path: video?.path || '',
				size: video?.size || 0,
				duration: video?.duration || 0,
				width: video?.width || 0,
				height: video?.height || 0,
				createdAt: video?.createdAt || new Date(),
				updatedAt: video?.updatedAt || new Date(),
				folderId: video?.folderId || null,
				thumbnailUrl: video?.id ? `/api/videos/${video.id}/thumbnail` : null,
			} as VideoComplete,
			true
		);
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
	try {
		return videos.map((video) => extendVideo(video, options));
	} catch (error) {
		log.error('Error extendiendo múltiples videos', { error });
		// Intentar procesar cada uno individualmente para recuperar los que se puedan
		const results: VideoComplete[] = [];
		for (const video of videos) {
			try {
				results.push(extendVideo(video, options));
			} catch (innerError) {
				log.error(`Error procesando video individual ${video?.id || 'desconocido'}`, { innerError });
				// Continuar con el siguiente
			}
		}
		log.warn(`Recuperados ${results.length} de ${videos.length} videos`);
		return results;
	}
}

// Exportar funciones obsoletas con alias para mantener compatibilidad
export const parseVideo = extendVideo;
export const toVideoComplete = fromPrismaVideo;
export const fromVideoComplete = toPrismaVideo;
