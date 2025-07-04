/**
 * 🌍 WORLD-ITEM VALIDATORS
 *
 * Funciones de validación para la entidad WorldItem usando Zod.
 *
 * @updated 2025-01-27
 */

import {
    ZodWorldItemCreateSchema,
    type ZodWorldItemCreateType,
    ZodWorldItemSchema,
    type ZodWorldItemType,
    ZodWorldItemUpdateSchema,
    type ZodWorldItemUpdateType,
} from './schema';

/**
 * Valida un objeto WorldItem completo
 */
export function validateWorldItem(data: unknown): ZodWorldItemType {
	return ZodWorldItemSchema.parse(data);
}

/**
 * Valida datos para crear un WorldItem
 */
export function validateWorldItemCreate(data: unknown): ZodWorldItemCreateType {
	return ZodWorldItemCreateSchema.parse(data);
}

/**
 * Valida datos para actualizar un WorldItem
 */
export function validateWorldItemUpdate(data: unknown): ZodWorldItemUpdateType {
	return ZodWorldItemUpdateSchema.parse(data);
}

/**
 * Verifica si un objeto es un WorldItem válido sin lanzar errores
 */
export function isWorldItem(data: unknown): data is ZodWorldItemType {
	const result = ZodWorldItemSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para crear un WorldItem
 */
export function isWorldItemCreateValid(data: unknown): data is ZodWorldItemCreateType {
	const result = ZodWorldItemCreateSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para actualizar un WorldItem
 */
export function isWorldItemUpdateValid(data: unknown): data is ZodWorldItemUpdateType {
	const result = ZodWorldItemUpdateSchema.safeParse(data);
	return result.success;
}
