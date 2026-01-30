/**
 * @file Transformador principal para la entidad Audio
 * @module transformers/audio/transformer
 * @description Contiene la lógica para convertir un objeto Audio de Drizzle a nuestro tipo canónico.
 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import { createDefaultEntityStats } from '../../lib/utils';
import type { AudioBase, AudioWithStats } from '../../types/entities/audio';

const logger = serverLogger.withContext('AudioTransformer');

/**
 * 🔄 Transforma un objeto Audio de Drizzle a nuestro tipo canónico AudioWithStats.
 *
 * @param drizzleAudio - El objeto AudioBase obtenido de Drizzle.
 * @returns Un objeto AudioWithStats compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromDrizzleAudio(drizzleAudio: AudioBase): AudioWithStats {
	if (!drizzleAudio) {
		throw new TransformerError('El objeto de audio de Drizzle no puede ser nulo.');
	}

	try {
		// TODO: Implementar la lógica real para calcular estas estadísticas
		const audioStats = {
			...createDefaultEntityStats(),
			duration: drizzleAudio.duration || 0,
			format: drizzleAudio.format || 'unknown',
			bitrate: drizzleAudio.bitrate || 0,
			volumePeaks: [],
			sampleRate: drizzleAudio.sampleRate || 0,
			channels: 2, // Default stereo
			isDirectory: false,
			isFile: true,
		};

		const audioWithStats: AudioWithStats = {
			...drizzleAudio,
			entityType: 'audio',
			statistics: audioStats,
			stats: audioStats,
		};

		return audioWithStats;
	} catch (error) {
		logger.error('Error transformando audio desde Drizzle', {
			error,
			audioId: drizzleAudio?.id,
		});
		throw new TransformerError(`Error al transformar el audio: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de audios de Drizzle a una lista de AudioWithStats.
 *
 * @param drizzleAudios - Un array de objetos Audio de Drizzle.
 * @returns Un array de objetos AudioWithStats.
 */
export function fromDrizzleAudios(drizzleAudios: AudioBase[]): AudioWithStats[] {
	return drizzleAudios.map(fromDrizzleAudio);
}
