/**
 * @file Transformador principal para la entidad Video.
 * @module transformers/video/transformer
 * @description Convierte objetos Video de la base de datos a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { VideoComplete } from '@/types/entities/video';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('VideoTransformer');

// Tipo genérico del payload proveniente de la BD ✅
type VideoFromPrisma = Record<string, any>;

/**
 * 🔄 Transforma un registro de video de la BD a `VideoComplete`.
 * @param videoFromPrisma - El objeto de video obtenido de la BD.
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
                logger.error(`Error transformando video desde la BD: ${videoFromPrisma.id}`, {
			error,
			videoId: videoFromPrisma.id,
		});
		throw new TransformerError('No se pudo transformar el video desde la base de datos.');
	}
}

/**
 * 🔄 Transforma un array de registros de video a `VideoComplete`.
 * @param videos - El array de videos recibido de la BD.
 * @returns Un array de VideoComplete.
 */
export function fromPrismaVideos(videos: VideoFromPrisma[]): VideoComplete[] {
	return videos.map(fromPrismaVideo);
}
