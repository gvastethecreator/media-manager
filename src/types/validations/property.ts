import { z } from 'zod';

/**
 * Validación para crear una propiedad
 */
export const createPropertySchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede tener más de 50 caracteres'),
	emoji: z.string().default('🔍'),
	color: z.string().default('var(--dt-primary-500)'),
	description: z.string().optional(),
	shortcut: z.string().optional(),
	category: z.enum(['general', 'technical', 'artistic', 'management']).default('general'),
	featuredImage: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

/**
 * Validación para actualizar una propiedad
 */
export const updatePropertySchema = createPropertySchema.partial();

/**
 * Validación para filtrar propiedades
 */
export const propertyFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.enum(['general', 'technical', 'artistic', 'management'])).optional(),
	onlyFavorites: z.boolean().optional(),
	sortBy: z.enum(['name', 'category', 'createdAt']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
	page: z.number().int().min(1).optional(),
	limit: z.number().int().min(1).max(100).optional(),
});
