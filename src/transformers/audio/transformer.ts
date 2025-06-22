/**
 * @file Transformador principal para la entidad Audio
 * @module transformers/audio/transformer
 * @description Contiene la lógica para convertir un objeto Audio de Prisma a nuestro tipo canónico.
 */
import { serverLogger } from '@/lib/logger/server-logger';
import type { AudioBase, AudioWithStats } from '@/types/entities/audio';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('AudioTransformer');

/**
 * 🔄 Transforma un objeto Audio de Prisma a nuestro tipo canónico AudioWithStats.
 *
 * @param prismaAudio - El objeto AudioBase obtenido de Prisma.
 * @returns Un objeto AudioWithStats compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaAudio(prismaAudio: AudioBase): AudioWithStats {
	if (!prismaAudio) {
		throw new TransformerError('El objeto de audio de Prisma no puede ser nulo.');
	}

	try {
		// TODO: Implementar la lógica real para calcular estas estadísticas
		const stats = {
			duration: prismaAudio.duration ?? 0,
			format: prismaAudio.format,
			bitrate: 0,
			volumePeaks: [],
			sampleRate: 0,
		};

		const audioWithStats: AudioWithStats = {
			...prismaAudio,
			stats,
		};

		return audioWithStats;
	} catch (error) {
		logger.error('Error transformando audio desde Prisma', {
			error,
			audioId: prismaAudio?.id,
		});
		throw new TransformerError(`Error al transformar el audio: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de audios de Prisma a una lista de AudioWithStats.
 *
 * @param prismaAudios - Un array de objetos Audio de Prisma.
 * @returns Un array de objetos AudioWithStats.
 */
export function fromPrismaAudios(prismaAudios: AudioBase[]): AudioWithStats[] {
	return prismaAudios.map(fromPrismaAudio);
}
