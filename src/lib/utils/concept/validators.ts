import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import { ConceptCategory } from '@/types/entities/concept';

const validatorsLogger = serverLogger.withContext('ConceptValidators');

/**
 * Esquema para validar la creación de un concepto
 */
export const conceptCreateSchema = z.object({
	name: z.string().min(1, { message: 'El nombre es obligatorio' }).max(100, {
		message: 'El nombre no puede exceder 100 caracteres',
	}),
	emoji: z.string().optional().default('💡'),
	color: z.string().optional().default('#3b82f6'),
	description: z.string().optional().nullable(),
	content: z.string().optional().default(''),
	category: z.nativeEnum(ConceptCategory).optional().default(ConceptCategory.GENERAL),
	tags: z.string().optional().default('[]'),
	featuredImage: z.string().optional().nullable(),
	isFavorite: z.boolean().optional().default(false),
});

/**
 * Tipo inferido para la creación de concepto
 */
export type ConceptCreateSchema = z.infer<typeof conceptCreateSchema>;

/**
 * Esquema para validar la actualización de un concepto
 */
export const conceptUpdateSchema = z.object({
	id: z.string().min(1, { message: 'El ID es obligatorio' }),
	name: z
		.string()
		.min(1, { message: 'El nombre es obligatorio' })
		.max(100, {
			message: 'El nombre no puede exceder 100 caracteres',
		})
		.optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	description: z.string().optional().nullable(),
	content: z.string().optional(),
	category: z.nativeEnum(ConceptCategory).optional(),
	tags: z.string().optional(),
	featuredImage: z.string().optional().nullable(),
	isFavorite: z.boolean().optional(),
});

/**
 * Tipo inferido para la actualización de concepto
 */
export type ConceptUpdateSchema = z.infer<typeof conceptUpdateSchema>;

/**
 * Esquema para validar los filtros de búsqueda de conceptos
 */
export const conceptFiltersSchema = z.object({
	search: z.string().optional(),
	category: z.nativeEnum(ConceptCategory).optional(),
	tags: z.array(z.string()).optional(),
	onlyFavorites: z.boolean().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
});

/**
 * Tipo inferido para los filtros de concepto
 */
export type ConceptFiltersSchema = z.infer<typeof conceptFiltersSchema>;

/**
 * Valida y transforma los datos para crear un concepto
 * @param data Datos a validar
 * @returns Datos validados y transformados
 */
export function validateConceptCreate(data: unknown): ConceptCreateSchema {
	try {
		return conceptCreateSchema.parse(data);
	} catch (error) {
		validatorsLogger.error('❌ Error de validación en creación de concepto:', error);
		throw error;
	}
}

/**
 * Valida y transforma los datos para actualizar un concepto
 * @param data Datos a validar
 * @returns Datos validados y transformados
 */
export function validateConceptUpdate(data: unknown): ConceptUpdateSchema {
	try {
		return conceptUpdateSchema.parse(data);
	} catch (error) {
		validatorsLogger.error('❌ Error de validación en actualización de concepto:', error);
		throw error;
	}
}

/**
 * Valida y transforma los filtros para buscar conceptos
 * @param filters Filtros a validar
 * @returns Filtros validados y transformados
 */
export function validateConceptFilters(filters: unknown): ConceptFiltersSchema {
	try {
		return conceptFiltersSchema.parse(filters);
	} catch (error) {
		validatorsLogger.error('❌ Error de validación en filtros de concepto:', error);
		throw error;
	}
}
