/**
 * @file Transformador principal para la entidad Video.
 * @module transformers/video/transformer
 * @description Contiene la lógica para convertir un objeto Video de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoComplete } from '@/types/entities/video';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('VideoTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones.
type VideoFromPrisma = Prisma.VideoGetPayload<{
	include: {
		folder: true;
		tags: true;
		albums: true;
		collections: true;
		// Añade aquí otras relaciones que necesites en el tipo completo
	};
}>;

/**
 * 🔄 Transforma un objeto Video de Prisma a nuestro tipo canónico VideoComplete.
 * @param videoFromPrisma - El objeto de video obtenido de Prisma.
 * @returns Un objeto VideoComplete.
 * @throws {TransformerError} si la transformación falla.
 */
export function fromPrismaVideo(videoFromPrisma: VideoFromPrisma): VideoComplete {
	try {
		return {
			...videoFromPrisma,
			// Mantener metadata como string tal como viene de Prisma
			metadata: videoFromPrisma.metadata || null,
			// Convertir Uint8Array a Buffer si es necesario
			thumbnail: videoFromPrisma.thumbnail ? Buffer.from(videoFromPrisma.thumbnail) : null,
		};
	} catch (error) {
		logger.error(`Error transformando video desde Prisma: ${videoFromPrisma.id}`, {
			error,
			videoId: videoFromPrisma.id,
		});
		throw new TransformerError('No se pudo transformar el video desde la base de datos.');
	}
}

/**
 * 🔄 Transforma un array de videos de Prisma a un array de VideoComplete.
 * @param videos - El array de videos de Prisma.
 * @returns Un array de VideoComplete.
 */
export function fromPrismaVideos(videos: VideoFromPrisma[]): VideoComplete[] {
	return videos.map(fromPrismaVideo);
}
