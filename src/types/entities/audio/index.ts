/**
 * @file Exportaciones principales de tipos para la entidad Audio.
 * @module types/entities/audio
 * @description
 *   Este archivo centraliza todas las exportaciones de tipos para la entidad Audio.
 *   El tipo canónico para usar en la aplicación es **`AudioWithStats`**.
 */

// Re-export from Prisma for compatibility
export type { Audio } from '@prisma/client';
export type {
	AudioBase,
	AudioStatistics,
	AudioWithStats,
} from './base';

// export * from './audio.schema'; // Descomentar cuando se creen los esquemas Zod

// Los enums y constantes se crearán en el futuro cuando sean necesarios
// export {
// 	AUDIO_SORT_PROPERTY_MAP,
// 	AudioSortCriteria,
// 	AudioViewMode,
// } from './types';
