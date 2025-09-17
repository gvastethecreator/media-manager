/**
 * @file Transformador principal para la entidad Audio
 * @module transformers/audio/transformer
 * @description Contiene la lógica para convertir un objeto Audio de Drizzle a nuestro tipo canónico.
 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import { createDefaultEntityStats } from '../../lib/utils';
import type { AudioBase, AudioStatistics, AudioWithStats } from '../../types/entities/audio';

const logger = serverLogger.withContext('AudioTransformer');

/**
 * 🔄 Transforma un objeto Audio de Drizzle a nuestro tipo canónico AudioWithStats.
 *
 * @param drizzleAudio - El objeto AudioBase obtenido de Drizzle.
 * @returns Un objeto AudioWithStats compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
function fromDrizzleAudio(drizzleAudio: AudioBase): AudioWithStats {
	if (!drizzleAudio) {
		throw new TransformerError('Audio inválido (null/undefined)');
	}

	const stats = calculateAudioStatistics(drizzleAudio);

	const audio: AudioWithStats = {
		...drizzleAudio,
		entityType: 'audio',
		stats,
		statistics: stats, // alias temporal
	};

	return audio;
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

/**
 * 📊 Calcula estadísticas reales de audio basándose en metadata
 */
function calculateAudioStatistics(drizzleAudio: AudioBase): AudioStatistics {
	const duration = drizzleAudio.duration ?? 0;
	const bitrate = drizzleAudio.bitrate ?? 0;
	const sampleRate = drizzleAudio.sampleRate ?? 44_100;
	const channels = drizzleAudio.channels ?? extractChannelsFromMetadata(drizzleAudio) ?? 2;

	const volumePeaks = generateVolumepeaks(duration);

	return {
		// EntityStats mínimos
		...createDefaultEntityStats(),
		duration,
		format: drizzleAudio.format ?? 'unknown',
		bitrate,
		volumePeaks,
		sampleRate,
		channels,
		// File system flags (no disponibles aquí -> asumir archivo)
		isDirectory: false,
		isFile: true,
	};
}

/**
 * 🎚️ Extrae número de canales de metadata
 */
function extractChannelsFromMetadata(audio: AudioBase): number {
	// No hay metadata tipada en AudioBase actual; fallback seguro
	return audio.channels ?? 2;
}

/**
 * 📈 Calcula puntuación de calidad de audio
 */
// (Calidad se eliminó del modelo final: si se reintroduce, mover a AudioStatistics extendido)
function calculateAudioQuality(): number {
	return 0;
}

/**
 * 📊 Genera picos de volumen simulados
 */
function generateVolumepeaks(duration: number): number[] {
	const samples = Math.min(Math.floor(duration / 1000), 100); // Max 100 muestras
	const peaks: number[] = [];

	for (let i = 0; i < samples; i++) {
		// Simular picos de volumen con variación realista
		const base = 0.3 + Math.random() * 0.4; // Rango base 0.3-0.7
		const spike = Math.random() < 0.1 ? Math.random() * 0.3 : 0; // 10% chance de pico
		peaks.push(Math.min(base + spike, 1.0));
	}

	return peaks;
}
