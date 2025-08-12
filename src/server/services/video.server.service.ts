import * as crypto from 'crypto';
import { and, asc, count, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { folders, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { createEntityNotFoundError, toServiceError } from '@/lib/utils/errors/service-errors';

const SERVICE_NAME = 'VideoServerService';
const videoLogger = serverLogger.withContext(SERVICE_NAME);

const CreateVideoSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(255),
	description: z.string().max(1000).optional().nullable(),
	path: z.string().min(1, 'La ruta es requerida'),
	size: z.number().int().positive(),
	mimeType: z.string().max(100),

	// Identificador de integridad
	hash: z.string().min(1, 'El hash es requerido'),

	// Metadatos de video específicos
	duration: z.number().positive().optional().nullable(),
	width: z.number().int().positive().optional().nullable(),
	height: z.number().int().positive().optional().nullable(),
	framerate: z.number().positive().optional().nullable(),
	bitrate: z.number().int().positive().optional().nullable(),
	codec: z.string().max(50).optional().nullable(),
	format: z.string().max(50).optional().nullable(),

	// Propiedades base
	isHidden: z.boolean().default(false).optional(),
	isFavorite: z.boolean().default(false).optional(),
	tags: z.string().default('[]').optional(),
	notes: z.string().default('').optional(),

	// Relaciones opcionales
	folderId: z.string().uuid().optional().nullable(),
});

const UpdateVideoSchema = CreateVideoSchema.partial();

const VideoFiltersSchema = z.object({
	folderId: z.string().uuid().optional(),
	codec: z.string().optional(),
	format: z.string().optional(),
	isFavorite: z.boolean().optional(),
	isHidden: z.boolean().optional(),
	minDuration: z.number().positive().optional(),
	maxDuration: z.number().positive().optional(),
	minWidth: z.number().int().positive().optional(),
	maxWidth: z.number().int().positive().optional(),
	minHeight: z.number().int().positive().optional(),
	maxHeight: z.number().int().positive().optional(),
	minSize: z.number().int().positive().optional(),
	maxSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	limit: z.number().int().positive().max(100).default(20).optional(),
	offset: z.number().int().min(0).default(0).optional(),
	sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'duration', 'width', 'height']).default('name').optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

// Función auxiliar para crear errores de video
const createVideoError = (message: string, code = 'VIDEO_ERROR') => {
	return new Error(`[${code}] ${message}`);
};

export async function getVideos(filters: z.infer<typeof VideoFiltersSchema>) {
	try {
		const conditions = [];

		// Construir condiciones WHERE
		if (filters.folderId) {
			conditions.push(eq(videos.folderId, filters.folderId));
		}
		if (filters.isFavorite !== undefined) {
			conditions.push(eq(videos.isFavorite, filters.isFavorite));
		}
		if (filters.minDuration) {
			conditions.push(gte(videos.duration, filters.minDuration));
		}
		if (filters.maxDuration) {
			conditions.push(lte(videos.duration, filters.maxDuration));
		}
		if (filters.minWidth && videos.width) {
			conditions.push(gte(videos.width, filters.minWidth));
		}
		if (filters.maxWidth && videos.width) {
			conditions.push(lte(videos.width, filters.maxWidth));
		}
		if (filters.minHeight && videos.height) {
			conditions.push(gte(videos.height, filters.minHeight));
		}
		if (filters.maxHeight && videos.height) {
			conditions.push(lte(videos.height, filters.maxHeight));
		}
		if (filters.minSize) {
			conditions.push(gte(videos.size, filters.minSize));
		}
		if (filters.maxSize) {
			conditions.push(lte(videos.size, filters.maxSize));
		}

		// Búsqueda por texto
		if (filters.search) {
			conditions.push(or(like(videos.name, `%${filters.search}%`), like(videos.description, `%${filters.search}%`)));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Determinar orden
		const orderByClause =
			filters.sortOrder === 'desc'
				? desc(videos[filters.sortBy || 'name'] as any)
				: asc(videos[filters.sortBy || 'name'] as any);

		// Ejecutar consultas en paralelo
		const [videoResults, totalCount] = await Promise.all([
			db
				.select({
					id: videos.id,
					name: videos.name,
					description: videos.description,
					path: videos.path,
					hash: videos.hash,
					size: videos.size,
					duration: videos.duration,
					width: videos.width,
					height: videos.height,
					metadata: videos.metadata,
					thumbnail: videos.thumbnail,
					thumbnailSize: videos.thumbnailSize,
					thumbnailWidth: videos.thumbnailWidth,
					thumbnailHeight: videos.thumbnailHeight,

					isFavorite: videos.isFavorite,
					folderId: videos.folderId,
					createdAt: videos.createdAt,
					updatedAt: videos.updatedAt,
					// Incluir datos de folder
					folder: {
						id: folders.id,
						name: folders.name,
						path: folders.path,
					},
				})
				.from(videos)
				.leftJoin(folders, eq(videos.folderId, folders.id))
				.where(whereClause)
				.orderBy(orderByClause)
				.limit(filters.limit || 20)
				.offset(filters.offset || 0),

			db
				.select({ count: count() })
				.from(videos)
				.where(whereClause)
				.then((result: any) => result[0]?.count || 0),
		]);

		return {
			data: videoResults,
			pagination: {
				total: totalCount,
				limit: filters.limit || 20,
				offset: filters.offset || 0,
				hasNext: (filters.offset || 0) + (filters.limit || 20) < totalCount,
				hasPrev: (filters.offset || 0) > 0,
			},
		};
	} catch (error) {
		videoLogger.error('Error al obtener videos:', error);
		throw toServiceError(error, {
			serviceName: SERVICE_NAME,
			message: 'No se pudieron obtener los videos',
		});
	}
}

export async function getVideoById(id: string) {
	try {
		const videoResult = await db
			.select({
				id: videos.id,
				name: videos.name,
				description: videos.description,
				path: videos.path,
				hash: videos.hash,
				size: videos.size,
				duration: videos.duration,
				width: videos.width,
				height: videos.height,
				metadata: videos.metadata,
				thumbnail: videos.thumbnail,
				thumbnailSize: videos.thumbnailSize,
				thumbnailWidth: videos.thumbnailWidth,
				thumbnailHeight: videos.thumbnailHeight,

				isFavorite: videos.isFavorite,
				folderId: videos.folderId,
				createdAt: videos.createdAt,
				updatedAt: videos.updatedAt,
				// Incluir datos de folder
				folder: {
					id: folders.id,
					name: folders.name,
					path: folders.path,
				},
			})
			.from(videos)
			.leftJoin(folders, eq(videos.folderId, folders.id))
			.where(eq(videos.id, id))
			.limit(1);

		if (!videoResult.length) {
			throw createEntityNotFoundError('Video', id, SERVICE_NAME);
		}

		// TODO: Implementar conteos de relaciones cuando sea necesario
		const video = {
			...videoResult[0],
			_count: {
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		return video;
	} catch (error) {
		videoLogger.error('Error al obtener video por ID:', error);
		throw toServiceError(error, {
			serviceName: SERVICE_NAME,
			message: 'No se pudo obtener el video',
		});
	}
}

export async function createVideo(data: z.infer<typeof CreateVideoSchema>) {
	try {
		videoLogger.info('Creando nuevo video:', data.name);

		const newVideo = await db
			.insert(videos)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description,
				path: data.path,
				size: data.size,
				hash: data.hash,
				mimeType: data.mimeType,
				duration: data.duration,
				width: data.width,
				height: data.height,
				framerate: data.framerate,
				bitrate: data.bitrate,
				codec: data.codec,
				format: data.format,
				isHidden: data.isHidden,
				isFavorite: data.isFavorite,
				tags: data.tags || '[]',
				notes: data.notes || '',
				folderId: data.folderId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		videoLogger.info('Video creado exitosamente:', newVideo[0].id);
		return newVideo[0];
	} catch (error) {
		videoLogger.error('Error al crear video:', error);
		throw toServiceError(error, {
			serviceName: SERVICE_NAME,
			message: 'No se pudo crear el video',
		});
	}
}

export async function getVideoByHash(hash: string) {
	try {
		videoLogger.info('Buscando video por hash:', hash);

		const videoResult = await db
			.select({
				id: videos.id,
				name: videos.name,
				description: videos.description,
				path: videos.path,
				hash: videos.hash,
				size: videos.size,
				duration: videos.duration,
				width: videos.width,
				height: videos.height,
				metadata: videos.metadata,
				thumbnail: videos.thumbnail,
				thumbnailSize: videos.thumbnailSize,
				thumbnailWidth: videos.thumbnailWidth,
				thumbnailHeight: videos.thumbnailHeight,

				isFavorite: videos.isFavorite,
				folderId: videos.folderId,
				createdAt: videos.createdAt,
				updatedAt: videos.updatedAt,
				folder: {
					id: folders.id,
					name: folders.name,
					path: folders.path,
				},
			})
			.from(videos)
			.leftJoin(folders, eq(videos.folderId, folders.id))
			.where(eq(videos.hash, hash))
			.limit(1);

		if (!videoResult.length) {
			return null;
		}

		const video = {
			...videoResult[0],
			_count: {
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		return video;
	} catch (error) {
		videoLogger.error('Error al obtener video por hash:', error);
		throw toServiceError(error, {
			serviceName: SERVICE_NAME,
			message: 'No se pudo obtener el video por hash',
		});
	}
}

export async function updateVideo(id: string, data: z.infer<typeof UpdateVideoSchema>) {
	try {
		videoLogger.info('Actualizando video:', id);

		const updatedVideo = await db
			.update(videos)
			.set({
				name: data.name,
				description: data.description,
				path: data.path,
				size: data.size,
				mimeType: data.mimeType,
				duration: data.duration,
				width: data.width,
				height: data.height,
				framerate: data.framerate,
				bitrate: data.bitrate,
				codec: data.codec,
				format: data.format,
				isHidden: data.isHidden,
				isFavorite: data.isFavorite,
				tags: data.tags,
				notes: data.notes,
				folderId: data.folderId,
				updatedAt: new Date(),
			})
			.where(eq(videos.id, id))
			.returning();

		if (!updatedVideo.length) {
			throw createEntityNotFoundError('Video', id, SERVICE_NAME);
		}

		videoLogger.info('Video actualizado exitosamente:', updatedVideo[0].id);
		return updatedVideo[0];
	} catch (error) {
		videoLogger.error('Error al actualizar video:', error);
		throw toServiceError(error, {
			serviceName: SERVICE_NAME,
			message: 'No se pudo actualizar el video',
		});
	}
}

export async function deleteVideo(id: string) {
	try {
		videoLogger.info('Eliminando video:', id);

		const deletedVideo = await db.delete(videos).where(eq(videos.id, id)).returning();

		if (!deletedVideo.length) {
			throw createEntityNotFoundError('Video', id, SERVICE_NAME);
		}

		videoLogger.info('Video eliminado exitosamente:', deletedVideo[0].id);
		return { success: true, deletedId: deletedVideo[0].id };
	} catch (error) {
		videoLogger.error('Error al eliminar video:', error);
		throw toServiceError(error, {
			serviceName: SERVICE_NAME,
			message: 'No se pudo eliminar el video',
		});
	}
}

export async function getVideoFormatStats() {
	try {
		videoLogger.info('Obteniendo estadísticas de formato de video');

		// TODO: Implementar estadísticas por formato cuando se agregue el campo format al esquema
		// Por ahora retornamos estadísticas generales
		const allVideos = await db
			.select({
				size: videos.size,
				duration: videos.duration,
				width: videos.width,
				height: videos.height,
			})
			.from(videos);

		if (allVideos.length === 0) {
			return [];
		}

		// Estadísticas generales para todos los videos
		const totalCount = allVideos.length;
		const totalSize = allVideos.reduce((sum: number, video: any) => sum + (video.size || 0), 0);
		const validDurations = allVideos.filter((v: any) => v.duration && v.duration > 0);
		const avgDuration =
			validDurations.length > 0
				? validDurations.reduce((sum: number, v: any) => sum + v.duration!, 0) / validDurations.length
				: 0;

		const validSizes = allVideos.filter((v: any) => v.width && v.height);
		const avgWidth =
			validSizes.length > 0 ? validSizes.reduce((sum: number, v: any) => sum + v.width!, 0) / validSizes.length : 0;
		const avgHeight =
			validSizes.length > 0 ? validSizes.reduce((sum: number, v: any) => sum + v.height!, 0) / validSizes.length : 0;

		return [
			{
				format: 'all',
				count: totalCount,
				sumSize: totalSize,
				avgDuration,
				avgWidth,
				avgHeight,
			},
		];
	} catch (error) {
		videoLogger.error('Error al obtener estadísticas de formato de video:', error);
		throw error;
	}
}
