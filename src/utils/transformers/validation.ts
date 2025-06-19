import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';

const logger = new Logger({ context: 'TransformerValidation' });

/**
 * 🔍 Valida campos base de una entidad
 */
export function validateBaseEntity(data: unknown) {
	try {
		return BaseEntitySchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error validando campos base:', { error: error.errors });
			throw new Error(`Error de validación: ${error.errors.map((e) => e.message).join(', ')}`);
		}
		throw error;
	}
}

/**
 * 🎨 Valida campos de UI
 */
export function validateUIFields(data: unknown) {
	try {
		return UIFieldsSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error validando campos UI:', { error: error.errors });
			throw new Error(`Error de validación UI: ${error.errors.map((e) => e.message).join(', ')}`);
		}
		throw error;
	}
}

/**
 * 📊 Valida campos de metadata
 */
export function validateMetadataFields(data: unknown) {
	try {
		return MetadataFieldsSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error validando campos de metadata:', { error: error.errors });
			throw new Error(`Error de validación metadata: ${error.errors.map((e) => e.message).join(', ')}`);
		}
		throw error;
	}
}

/**
 * 🔄 Valida relaciones
 */
export function validateRelations(relations: unknown, allowedRelations: string[]) {
	if (!relations || typeof relations !== 'object') {
		throw new Error('Las relaciones deben ser un objeto');
	}

	const invalidRelations = Object.keys(relations as object).filter((key) => !allowedRelations.includes(key));

	if (invalidRelations.length > 0) {
		throw new Error(`Relaciones inválidas: ${invalidRelations.join(', ')}`);
	}
}

/**
 * 🎯 Valida tipos de datos
 */
export function validateDataTypes(data: Record<string, unknown>, typeMap: Record<string, string>) {
	for (const [field, expectedType] of Object.entries(typeMap)) {
		const value = data[field];
		if (value !== undefined && value !== null) {
			if (expectedType === 'array') {
				if (!Array.isArray(value)) {
					throw new Error(`El campo ${field} debe ser un array`);
				}
			} else if (
				(expectedType === 'string' && typeof value !== 'string') ||
				(expectedType === 'number' && typeof value !== 'number') ||
				(expectedType === 'boolean' && typeof value !== 'boolean') ||
				(expectedType === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value)))
			) {
				throw new Error(`El campo ${field} debe ser de tipo ${expectedType}`);
			}
		}
	}
}

/**
 * 📝 Valida filtros de búsqueda
 */
export function validateSearchFilters(filters: unknown) {
	const searchFilterSchema = z.object({
		search: z.string().optional(),
		categories: z.array(z.string()).optional(),
		tags: z.array(z.string()).optional(),
		dateRange: z
			.object({
				start: z.date().optional(),
				end: z.date().optional(),
			})
			.optional(),
		isFavorite: z.boolean().optional(),
	});

	try {
		return searchFilterSchema.parse(filters);
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error validando filtros de búsqueda:', { error: error.errors });
			throw new Error(`Error de validación de filtros: ${error.errors.map((e) => e.message).join(', ')}`);
		}
		throw error;
	}
}

/**
 * 🔍 Valida opciones de búsqueda
 */
export function validateSearchOptions(options: unknown) {
	const searchOptionsSchema = z.object({
		skip: z.number().int().min(0).optional(),
		take: z.number().int().min(1).optional(),
		orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
		where: z.record(z.unknown()).optional(),
		include: z.record(z.boolean()).optional(),
	});

	try {
		return searchOptionsSchema.parse(options);
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error validando opciones de búsqueda:', { error: error.errors });
			throw new Error(`Error de validación de opciones: ${error.errors.map((e) => e.message).join(', ')}`);
		}
		throw error;
	}
}
