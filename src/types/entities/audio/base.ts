/**
 * @file Tipos base para la entidad Audio.
 * @module types/entities/audio/base
 * @description Define los tipos canónicos para la entidad Audio, siguiendo el nuevo patrón de `...WithStats`.
 */

import type { Audio } from '@prisma/client';

/**
 * 🎵 Tipo base de Audio directamente desde el schema de Prisma.
 */
export type AudioBase = Audio;

/**
 * 📊 Métricas y estadísticas calculadas para un archivo de Audio.
 * Estas métricas se enfocan en las características técnicas y de calidad del audio.
 */
export interface AudioStatistics {
	/** Duración del audio en segundos */
	duration: number;
	/** Formato del archivo (por ejemplo, 'mp3', 'wav') */
	format: string;
	/** Tasa de bits en kbps, una medida de la calidad */
	bitrate: number;
	/** Un array de los picos de volumen para visualización */
	volumePeaks: number[];
	/** Tasa de muestreo en Hz */
	sampleRate: number;
}

/**
 * ✨ Tipo enriquecido de Audio que incluye estadísticas.
 * Este es el tipo canónico para usar en la aplicación.
 */
export interface AudioWithStats extends AudioBase {
	stats: AudioStatistics;
}

// --- TIPOS PARA MUTACIONES ---

/**
 * 🆕 Tipo para crear un nuevo Audio
 * Omite campos autogenerados (id, timestamps)
 */
export type AudioCreateInput = Omit<AudioBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ✏️ Tipo para actualizar un Audio existente
 * Todos los campos son opcionales excepto id
 */
export type AudioUpdateInput = Partial<AudioCreateInput>;
