/**
 * @file Validadores para datos de actividades
 * @module utils/activity/validators
 */

import { z } from 'zod';
import type { ActivityType } from '@/types/entities/activity';

/**
 * Determina si un tipo de actividad es válido
 * @param type Tipo a validar
 * @returns true si el tipo es válido
 */
export function isValidActivityType(type: string): boolean {
	return Object.values(ActivityType).includes(type as ActivityType);
}

/**
 * Esquema Zod para validación de creación de actividad
 */
export const createActivitySchema = z.object({
	type: z.string().refine((type) => isValidActivityType(type), { message: 'Tipo de actividad no válido' }),
	description: z.string().min(1, 'La descripción es obligatoria'),
	imageId: z.string().optional(),
	metadata: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
});

/**
 * Esquema Zod para validación de filtros de actividad
 */
export const activityFiltersSchema = z.object({
	types: z.array(z.string()).optional(),
	startDate: z.union([z.string(), z.date()]).optional(),
	endDate: z.union([z.string(), z.date()]).optional(),
	imageId: z.string().optional(),
	searchQuery: z.string().optional(),
	limit: z.number().int().positive().optional().default(20),
	offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * Valida datos de creación de actividad
 * @param data Datos a validar
 * @returns Resultado de validación (éxito/error)
 */
export function validateCreateActivityData(data: unknown) {
	try {
		return {
			success: true,
			data: createActivitySchema.parse(data),
		};
	} catch (error) {
		return {
			success: false,
			error,
		};
	}
}

/**
 * Valida filtros de búsqueda de actividades
 * @param filters Filtros a validar
 * @returns Resultado de validación (éxito/error)
 */
export function validateActivityFilters(filters: unknown) {
	try {
		return {
			success: true,
			data: activityFiltersSchema.parse(filters),
		};
	} catch (error) {
		return {
			success: false,
			error,
		};
	}
}

/**
 * Esquema Zod para validación de una lista de tipos de actividad
 */
export const activityTypesSchema = z.array(
	z.string().refine((type) => isValidActivityType(type), { message: 'Tipo de actividad no válido' })
);

/**
 * Valida que una lista de tipos de actividad sea válida
 * @param types Lista de tipos a validar
 * @returns true si todos los tipos son válidos
 */
export function validateActivityTypes(types: string[]): boolean {
	try {
		activityTypesSchema.parse(types);
		return true;
	} catch (_error) {
		return false;
	}
}
