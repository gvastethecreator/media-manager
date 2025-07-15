/**
 * @file Exportaciones principales de tipos para la entidad File.
 * @module types/entities/file
 * @description
 *   Este archivo centraliza las exportaciones de tipos para la entidad File.
 *   El tipo canónico para usar en la aplicación es **`FileWithStats`**.
 *
 *   - `FileBase`: Tipo base desde Drizzle.
 *   - `FileStatistics`: Estadísticas calculadas.
 *   - `FileWithStats`: Tipo enriquecido con estadísticas (CANÓNICO).
 *
 * @see /src/types/entities/file/base.ts
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Tipos Canónicos ---
export type {
	FileBase,
	FileStatistics,
	FileWithStats,
} from './base';

// --- Enums ---
export { FileType } from './base';
export { FileErrorCode, FileEventType } from './enums';
