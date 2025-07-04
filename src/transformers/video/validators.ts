/**
 * 🎬 VIDEO VALIDATORS
 *
 * Funciones de validación para la entidad Video usando Zod.
 *
 * @updated 2025-01-27
 */

import {
	ZodVideoSchema,
	ZodVideoCreateSchema,
	ZodVideoUpdateSchema,
	type ZodVideoType,
	type ZodVideoCreateType,
	type ZodVideoUpdateType,
} from './schema';

/**
 * Valida un objeto Video completo
 */
export function validateVideo(data: unknown): ZodVideoType {
	return ZodVideoSchema.parse(data);
}

/**
 * Valida datos para crear un Video
 */
export function validateVideoCreate(data: unknown): ZodVideoCreateType {
	return ZodVideoCreateSchema.parse(data);
}

/**
 * Valida datos para actualizar un Video
 */
export function validateVideoUpdate(data: unknown): ZodVideoUpdateType {
	return ZodVideoUpdateSchema.parse(data);
}

/**
 * Verifica si un objeto es un Video válido sin lanzar errores
 */
export function isVideo(data: unknown): data is ZodVideoType {
	const result = ZodVideoSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para crear un Video
 */
export function isVideoCreateValid(data: unknown): data is ZodVideoCreateType {
	const result = ZodVideoCreateSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para actualizar un Video
 */
export function isVideoUpdateValid(data: unknown): data is ZodVideoUpdateType {
	const result = ZodVideoUpdateSchema.safeParse(data);
	return result.success;
}
