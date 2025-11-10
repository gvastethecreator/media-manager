/**
 * @file Errores tipados para AudioService con Effect-TS
 * @module services/audio/audio-errors.effect
 * @description Errores tipados usando Data.TaggedError para AudioService
 * @created 2025-01-10 - Phase 6.3: Audio Error Types
 */

import { Data } from 'effect';

// =================================================================================
// AUDIO ERROR TYPES
// =================================================================================

/**
 * Error cuando un audio no se encuentra
 */
export class AudioNotFound extends Data.TaggedError('AudioNotFound')<{
	readonly id: string;
	readonly message: string;
}> {}

/**
 * Error cuando ya existe un audio con el mismo hash
 */
export class AudioHashConflict extends Data.TaggedError('AudioHashConflict')<{
	readonly hash: string;
	readonly existingId: string;
}> {}

/**
 * Error de base de datos durante operaciones de audio
 */
export class AudioDatabaseError extends Data.TaggedError('AudioDatabaseError')<{
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

/**
 * Error de validación de datos de audio
 */
export class AudioValidationError extends Data.TaggedError('AudioValidationError')<{
	readonly field: string;
	readonly value: unknown;
	readonly reason: string;
}> {}

/**
 * Error cuando un audio tiene relaciones que impiden su eliminación
 */
export class AudioHasRelationsError extends Data.TaggedError('AudioHasRelationsError')<{
	readonly id: string;
	readonly relationCounts: {
		tags: number;
		albums: number;
		characters: number;
		playlists: number;
		collections: number;
		places: number;
		concepts: number;
		events: number;
		groups: number;
		profiles: number;
		worldItems: number;
		notes: number;
	};
	readonly message: string;
}> {}

/**
 * Error en operaciones relacionadas con relaciones de audio
 */
export class AudioRelationError extends Data.TaggedError('AudioRelationError')<{
	readonly operation: string;
	readonly audioId: string;
	readonly relationType: string;
	readonly reason: string;
}> {}

/**
 * Error durante procesamiento de audio (transcoding, analysis, etc.)
 */
export class AudioProcessingError extends Data.TaggedError('AudioProcessingError')<{
	readonly audioId: string;
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

/**
 * Error cuando el archivo de audio no existe en el filesystem
 */
export class AudioFileNotFound extends Data.TaggedError('AudioFileNotFound')<{
	readonly path: string;
	readonly audioId?: string;
	readonly message: string;
}> {}

/**
 * Error desconocido durante operaciones de audio
 */
export class AudioUnknownError extends Data.TaggedError('AudioUnknownError')<{
	readonly operation: string;
	readonly reason: string;
	readonly originalError?: unknown;
}> {}

// =================================================================================
// UNION TYPE
// =================================================================================

/**
 * Unión de todos los tipos de error de audio
 */
export type AudioError =
	| AudioNotFound
	| AudioHashConflict
	| AudioDatabaseError
	| AudioValidationError
	| AudioHasRelationsError
	| AudioRelationError
	| AudioProcessingError
	| AudioFileNotFound
	| AudioUnknownError;

// =================================================================================
// ERROR HELPERS
// =================================================================================

/**
 * Helper para crear AudioNotFound
 */
export const audioNotFound = (id: string, message?: string) =>
	new AudioNotFound({
		id,
		message: message || `Audio con ID ${id} no encontrado`,
	});

/**
 * Helper para crear AudioHashConflict
 */
export const audioHashConflict = (hash: string, existingId: string) =>
	new AudioHashConflict({
		hash,
		existingId,
	});

/**
 * Helper para crear AudioDatabaseError
 */
export const audioDatabaseError = (operation: string, reason: string, originalError?: unknown) =>
	new AudioDatabaseError({
		operation,
		reason,
		originalError,
	});

/**
 * Helper para crear AudioValidationError
 */
export const audioValidationError = (field: string, value: unknown, reason: string) =>
	new AudioValidationError({
		field,
		value,
		reason,
	});

/**
 * Helper para crear AudioHasRelationsError
 */
export const audioHasRelationsError = (
	id: string,
	relationCounts: AudioHasRelationsError['relationCounts'],
	message?: string
) =>
	new AudioHasRelationsError({
		id,
		relationCounts,
		message: message || `Audio ${id} tiene relaciones activas que impiden su eliminación`,
	});

/**
 * Helper para crear AudioRelationError
 */
export const audioRelationError = (operation: string, audioId: string, relationType: string, reason: string) =>
	new AudioRelationError({
		operation,
		audioId,
		relationType,
		reason,
	});

/**
 * Helper para crear AudioProcessingError
 */
export const audioProcessingError = (audioId: string, operation: string, reason: string, originalError?: unknown) =>
	new AudioProcessingError({
		audioId,
		operation,
		reason,
		originalError,
	});

/**
 * Helper para crear AudioFileNotFound
 */
export const audioFileNotFound = (path: string, audioId?: string, message?: string) =>
	new AudioFileNotFound({
		path,
		audioId,
		message: message || `Archivo de audio no encontrado en ${path}`,
	});

/**
 * Helper para crear AudioUnknownError
 */
export const audioUnknownError = (operation: string, reason: string, originalError?: unknown) =>
	new AudioUnknownError({
		operation,
		reason,
		originalError,
	});
