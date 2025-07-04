/**
 * 🖼️ THUMBNAIL VALIDATORS
 *
 * Funciones de validación para la entidad Thumbnail usando Zod.
 *
 * @updated 2025-01-27
 */

import {
	ZodThumbnailSchema,
	ZodThumbnailCreateSchema,
	ZodThumbnailUpdateSchema,
	type ZodThumbnailType,
	type ZodThumbnailCreateType,
	type ZodThumbnailUpdateType,
} from './schema';

/**
 * Valida un objeto Thumbnail completo
 */
export function validateThumbnail(data: unknown): ZodThumbnailType {
	return ZodThumbnailSchema.parse(data);
}

/**
 * Valida datos para crear un Thumbnail
 */
export function validateThumbnailCreate(data: unknown): ZodThumbnailCreateType {
	return ZodThumbnailCreateSchema.parse(data);
}

/**
 * Valida datos para actualizar un Thumbnail
 */
export function validateThumbnailUpdate(data: unknown): ZodThumbnailUpdateType {
	return ZodThumbnailUpdateSchema.parse(data);
}

/**
 * Verifica si un objeto es un Thumbnail válido sin lanzar errores
 */
export function isThumbnail(data: unknown): data is ZodThumbnailType {
	const result = ZodThumbnailSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para crear un Thumbnail
 */
export function isThumbnailCreateValid(data: unknown): data is ZodThumbnailCreateType {
	const result = ZodThumbnailCreateSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para actualizar un Thumbnail
 */
export function isThumbnailUpdateValid(data: unknown): data is ZodThumbnailUpdateType {
	const result = ZodThumbnailUpdateSchema.safeParse(data);
	return result.success;
}
