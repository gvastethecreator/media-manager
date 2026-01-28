/**
 * @file Esquema Zod para la entidad Wildcard
 * @module types/entities/wildcard/schema
 */

import { z } from 'zod';
import { WildcardSortCriteria, WildcardViewMode } from './types';

/**
 * Esquema para filtros de búsqueda de comodines
 */
export const WildcardFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	onlyFavorites: z.boolean().optional(),
	parentId: z.string().nullable().optional(),
	hasChildren: z.boolean().optional(),
});

/**
 * Esquema para estadísticas de uso de comodines
 */
export const WildcardStatsSchema = z.object({
	usageCount: z.number().optional(),
	relatedEntitiesCount: z.number().optional(),
	lastUsed: z.date().optional(),
});

/**
 * Tipo para hijos de comodín (recursivo)
 */
export type WildcardChild = {
	id: string;
	name: string;
	children?: WildcardChild[];
};

/**
 * Esquema para hijos de comodín (estructura anidada)
 */
export const WildcardChildSchema: z.ZodType<WildcardChild> = z.object({
	id: z.string(),
	name: z.string(),
	children: z.array(z.lazy(() => WildcardChildSchema)).optional(),
});

/**
 * Esquema principal para la entidad Wildcard
 */
export const WildcardSchema = z.object({
	id: z.string(),
	name: z.string().min(1, 'El nombre es obligatorio'),
	emoji: z.string().default('🎭'),
	color: z
		.string()
		.refine(
			(val) => /^#[0-9A-Fa-f]{6}$/.test(val) || val.startsWith('var(--'),
			'Color debe ser un valor hexadecimal o una variable CSS válida'
		)
		.default('var(--entity-wildcard)'),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	children: z.string().default('[]'), // JSON string de hijos
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	parentId: z.string().nullable().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),

	// Configuración de visualización
	sortBy: z.enum(Object.values(WildcardSortCriteria) as [string, ...string[]]).optional(),
	viewMode: z.enum(Object.values(WildcardViewMode) as [string, ...string[]]).optional(),
});

/**
 * Esquema para crear un comodín
 */
export const CreateWildcardSchema = WildcardSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	name: z.string().min(1, 'El nombre es obligatorio'),
});

/**
 * Esquema para actualizar un comodín
 */
export const UpdateWildcardSchema = WildcardSchema.partial().omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * Esquema para relaciones de un comodín
 */
export const WildcardRelationsSchema = z.object({
	parent: z
		.object({
			id: z.string(),
			name: z.string(),
		})
		.nullable()
		.optional(),
	childWildcards: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
			})
		)
		.optional(),
	_count: z
		.object({
			childWildcards: z.number().default(0),
			images: z.number().default(0),
			videos: z.number().default(0),
			albums: z.number().default(0),
			collections: z.number().default(0),
			tags: z.number().default(0),
			characters: z.number().default(0),
			places: z.number().default(0),
			worldItems: z.number().default(0),
			concepts: z.number().default(0),
			prompts: z.number().default(0),
			notes: z.number().default(0),
			properties: z.number().default(0),
			groups: z.number().default(0),
		})
		.optional(),
});
