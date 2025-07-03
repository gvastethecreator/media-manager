/**
 * @file Exportaciones principales de tipos para la entidad Document.
 * @module types/entities/document
 * @description
 *   Este archivo centraliza las exportaciones de tipos para la entidad Document.
 *   El tipo canónico para usar en la aplicación es **`DocumentWithStats`**.
 *
 *   - `DocumentBase`: Tipo base de Prisma (modificado).
 *   - `DocumentWithStats`: Tipo enriquecido con estadísticas de contenido.
 *
 * @see /src/types/entities/document/base.ts
 * @updated 2025-01-27
 */

// --- Tipos Canónicos (NUEVO) ---
export type {
    DocumentBase,
    DocumentCreateInput,
    DocumentStatistics,
    DocumentUpdateInput,
    DocumentWithStats
} from './base';

// --- Esquemas de Validación ---
export { documentSchema } from './document.schema';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos de `types.ts` están obsoletos.
 * Usar `DocumentWithStats` y otros tipos canónicos desde `base.ts`.
 * @see /src/types/entities/document/base.ts
 */
// export * from './types';
