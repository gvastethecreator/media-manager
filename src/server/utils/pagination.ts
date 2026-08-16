/**
 * @file Utilidades de paginación y sanitización de query params
 * @module server/utils/pagination
 * @description Funciones compartidas para sanitizar y validar parámetros de paginación
 */

/**
 * Sanitiza el parámetro limit.
 * - Convierte a entero, fallback a defaultLimit si NaN
 * - Limita entre 1 y maxLimit
 */
export function sanitizeLimit(raw: unknown, defaultLimit = 50, maxLimit = 500): number {
	const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
	if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return defaultLimit;
	return Math.min(Math.max(1, parsed), maxLimit);
}

/**
 * Sanitiza el parámetro offset.
 * - Convierte a entero, fallback a 0 si NaN
 * - No permite valores negativos
 */
export function sanitizeOffset(raw: unknown): number {
	const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
	if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 0;
	return Math.max(0, parsed);
}

/**
 * Constante máxima para operaciones batch.
 * Protege contra DoS por arrays excesivamente grandes.
 */
export const MAX_BATCH_SIZE = 1000;

/**
 * Valida que un array de IDs no exceda el tamaño máximo de batch.
 * @throws Error si excede el límite
 */
export function validateBatchSize(ids: unknown[], maxSize = MAX_BATCH_SIZE): void {
	if (ids.length > maxSize) {
		throw new Error(`Batch size ${ids.length} exceeds maximum of ${maxSize}`);
	}
}
