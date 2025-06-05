import { z } from 'zod';

/**
 * Validación para crear un comodín
 */
export const createWildcardSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede tener más de 50 caracteres'),
	emoji: z.string().default('✨'),
	color: z.string().default('#ec4899'),
	description: z.string().optional(),
	shortcut: z.string().optional(),
	category: z.string().default('general'),
	children: z.array(z.string()).default([]),
	parentId: z.string().nullable().optional(),
	featuredImage: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

/**
 * Validación para actualizar un comodín
 */
export const updateWildcardSchema = createWildcardSchema.partial();

/**
 * Validación para filtrar comodines
 */
export const wildcardFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	onlyFavorites: z.boolean().optional(),
	showOnlyRoots: z.boolean().optional(),
	sortBy: z.enum(['name', 'category', 'createdAt']).optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
	parentId: z.string().nullable().optional(),
	page: z.number().int().min(1).optional(),
	limit: z.number().int().min(1).max(100).optional(),
});
