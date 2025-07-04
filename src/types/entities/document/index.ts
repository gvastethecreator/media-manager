/**
 * @file Exportaciones principales de tipos para la entidad Document.
 * @module types/entities/document
 * @description
 *   Este archivo centraliza las exportaciones de tipos para la entidad Document.
 *   El tipo canónico para usar en la aplicación es **`DocumentWithStats`**.
 *
 *   - `DocumentBase`: Tipo base desde Drizzle.
 *   - `DocumentStatistics`: Estadísticas calculadas.
 *   - `DocumentWithStats`: Tipo enriquecido con estadísticas (CANÓNICO).
 *
 * @see /src/types/entities/document/base.ts
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Tipos Canónicos ---
export type {
	DocumentBase,
	DocumentStatistics,
	DocumentWithStats,
} from './base';
