/**
 * 🃏 WILDCARD VALIDATORS
 *
 * Funciones de validación para la entidad Wildcard usando Zod.
 *
 * @updated 2025-01-27
 */

import {
	ZodWildcardCreateSchema,
	type ZodWildcardCreateType,
	ZodWildcardSchema,
	type ZodWildcardType,
	ZodWildcardUpdateSchema,
	type ZodWildcardUpdateType,
} from './schema';

/**
 * Valida un objeto Wildcard completo
 */
export function validateWildcard(data: unknown): ZodWildcardType {
	return ZodWildcardSchema.parse(data);
}

/**
 * Valida datos para crear un Wildcard
 */
export function validateWildcardCreate(data: unknown): ZodWildcardCreateType {
	return ZodWildcardCreateSchema.parse(data);
}

/**
 * Valida datos para actualizar un Wildcard
 */
export function validateWildcardUpdate(data: unknown): ZodWildcardUpdateType {
	return ZodWildcardUpdateSchema.parse(data);
}

/**
 * Verifica si un objeto es un Wildcard válido sin lanzar errores
 */
export function isWildcard(data: unknown): data is ZodWildcardType {
	const result = ZodWildcardSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para crear un Wildcard
 */
export function isWildcardCreateValid(data: unknown): data is ZodWildcardCreateType {
	const result = ZodWildcardCreateSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para actualizar un Wildcard
 */
export function isWildcardUpdateValid(data: unknown): data is ZodWildcardUpdateType {
	const result = ZodWildcardUpdateSchema.safeParse(data);
	return result.success;
}
