/**
 * @file Exportaciones principales de tipos para la entidad Audio.
 * @module types/entities/audio
 * @description
 *   Este archivo centraliza todas las exportaciones de tipos para la entidad Audio.
 *   El tipo canónico para usar en la aplicación es **`AudioWithStats`**.
 */

export type {
	AudioBase,
	AudioCreateInput,
	AudioStatistics,
	AudioUpdateInput,
	AudioWithStats,
} from './base';

// Alias para compatibilidad
export type Audio = AudioWithStats;
export type AudioFormData = AudioCreateInput;
export type AudioUIInput = AudioCreateInput;
