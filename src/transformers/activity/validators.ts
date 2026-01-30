/**
 * @file Validadores para la entidad Activity
 * @module transformers/activity/validators
 */

import { type Activity, type ActivityFilters, type CreateActivityData } from '../../types/entities/activity';
import type { ActivityFiltersSchemaType, ActivitySchemaType, CreateActivitySchemaType } from './schema';
import { activityFiltersSchema, activitySchema, activityTypeSchema, createActivitySchema } from './schema';

/**
 * Valida los datos para crear una actividad
 * @param data Datos a validar
 * @returns Datos validados o error
 */
export function validateCreateActivityData(
	data: CreateActivityData
): { success: true; data: CreateActivitySchemaType } | { success: false; error: string } {
	try {
		const result = createActivitySchema.parse(data);
		return { success: true, data: result };
	} catch (error) {
		// Si es un error de Zod, formateamos el mensaje
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Datos de actividad inválidos' };
	}
}

/**
 * Valida una actividad completa
 * @param activity Actividad a validar
 * @returns Actividad validada o error
 */
export function validateActivity(
	activity: Activity
): { success: true; data: ActivitySchemaType } | { success: false; error: string } {
	try {
		// Transformar createdAt a string si es Date para la validación
		const activityForValidation = {
			...activity,
			createdAt: activity.createdAt instanceof Date ? activity.createdAt.toISOString() : activity.createdAt,
		};

		const result = activitySchema.parse(activityForValidation);
		return { success: true, data: result };
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Actividad inválida' };
	}
}

/**
 * Valida filtros para búsqueda de actividades
 * @param filters Filtros a validar
 * @returns Filtros validados o error
 */
export function validateActivityFilters(
	filters: ActivityFilters
): { success: true; data: ActivityFiltersSchemaType } | { success: false; error: string } {
	try {
		// Transformar fechas a strings si son Date para la validación
		const filtersForValidation = {
			...filters,
			startDate: filters.startDate instanceof Date ? filters.startDate.toISOString() : filters.startDate,
			endDate: filters.endDate instanceof Date ? filters.endDate.toISOString() : filters.endDate,
		};

		const result = activityFiltersSchema.parse(filtersForValidation);
		return { success: true, data: result };
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Filtros inválidos' };
	}
}

/**
 * Valida un tipo de actividad
 * @param type Tipo a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidActivityType(type: string): boolean {
	try {
		activityTypeSchema.parse(type);
		return true;
	} catch {
		return false;
	}
}

/**
 * Normaliza los datos de filtros para garantizar valores por defecto
 * @param filters Filtros a normalizar
 * @returns Filtros normalizados
 */
export function normalizeActivityFilters(filters: ActivityFilters): ActivityFilters {
	return {
		types: filters.types || [],
		searchQuery: filters.searchQuery || '',
		limit: filters.limit || 20,
		offset: filters.offset || 0,
		...(filters.startDate ? { startDate: filters.startDate } : {}),
		...(filters.endDate ? { endDate: filters.endDate } : {}),
		...(filters.imageId ? { imageId: filters.imageId } : {}),
	};
}
