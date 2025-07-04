/**
 * 📤 UPLOADED-IMAGE VALIDATORS
 *
 * Funciones de validación para la entidad UploadedImage usando Zod.
 *
 * @updated 2025-01-27
 */

import {
    ZodUploadedImageCreateSchema,
    type ZodUploadedImageCreateType,
    ZodUploadedImageSchema,
    type ZodUploadedImageType,
    ZodUploadedImageUpdateSchema,
    type ZodUploadedImageUpdateType,
} from './schema';

/**
 * Valida un objeto UploadedImage completo
 */
export function validateUploadedImage(data: unknown): ZodUploadedImageType {
	return ZodUploadedImageSchema.parse(data);
}

/**
 * Valida datos para crear un UploadedImage
 */
export function validateUploadedImageCreate(data: unknown): ZodUploadedImageCreateType {
	return ZodUploadedImageCreateSchema.parse(data);
}

/**
 * Valida datos para actualizar un UploadedImage
 */
export function validateUploadedImageUpdate(data: unknown): ZodUploadedImageUpdateType {
	return ZodUploadedImageUpdateSchema.parse(data);
}

/**
 * Verifica si un objeto es un UploadedImage válido sin lanzar errores
 */
export function isUploadedImage(data: unknown): data is ZodUploadedImageType {
	const result = ZodUploadedImageSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para crear un UploadedImage
 */
export function isUploadedImageCreateValid(data: unknown): data is ZodUploadedImageCreateType {
	const result = ZodUploadedImageCreateSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para actualizar un UploadedImage
 */
export function isUploadedImageUpdateValid(data: unknown): data is ZodUploadedImageUpdateType {
	const result = ZodUploadedImageUpdateSchema.safeParse(data);
	return result.success;
}
