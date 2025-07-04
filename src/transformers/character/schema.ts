/**
 * @file Esquemas de validación Zod para la entidad Character
 * @module transformers/character/schema
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 * Estado: Completo, sin dependencias de Prisma
 */

import { z } from 'zod';

/**
 * Esquema base para personajes
 */
export const characterBaseSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().nullable(),
	emoji: z.string(),
	color: z.string(),
	shortcut: z.string().nullable(),
	category: z.string().nullable(),
	level: z.number().nonnegative(),
	class: z.string(),
	race: z.string(),
	type: z.string().nullable(),
	alignment: z.string(),
	backstory: z.string(),
	stats: z.string(), // JSON serializado
	psychologicalProfile: z.string(), // JSON serializado
	socialProfile: z.string(), // JSON serializado
	relationships: z.string(), // JSON serializado
	goals: z.string(), // JSON serializado
	fears: z.string(), // JSON serializado
	beliefs: z.string(), // JSON serializado
	personality: z.string(), // JSON serializado
	skills: z.string(), // JSON serializado
	abilities: z.string(), // JSON serializado
	sortBy: z.string(),
	filters: z.string(), // JSON serializado
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Esquema para estadísticas de personaje
 */
export const characterStatisticsSchema = z.object({
	totalImages: z.number().nonnegative(),
	totalVideos: z.number().nonnegative(),
	totalTags: z.number().nonnegative(),
	totalGroups: z.number().nonnegative(),
	totalProperties: z.number().nonnegative(),
	totalCollections: z.number().nonnegative(),
	totalAlbums: z.number().nonnegative(),
	totalPlaces: z.number().nonnegative(),
	totalWorldItems: z.number().nonnegative(),
	totalConcepts: z.number().nonnegative(),
	totalPrompts: z.number().nonnegative(),
	totalNotes: z.number().nonnegative(),
	totalWildcards: z.number().nonnegative(),
	totalRelatedCharacters: z.number().nonnegative(),
	totalRelatedTo: z.number().nonnegative(),
	totalAssociations: z.number().nonnegative(),
	lastUpdated: z.date(),
});

/**
 * Esquema para personajes completos con estadísticas
 */
export const characterWithStatsSchema = characterBaseSchema.extend({
	statistics: characterStatisticsSchema,
	_count: z.object({
		images: z.number().optional(),
		videos: z.number().optional(),
		tags: z.number().optional(),
		groups: z.number().optional(),
		properties: z.number().optional(),
		collections: z.number().optional(),
		albums: z.number().optional(),
		places: z.number().optional(),
		worldItems: z.number().optional(),
		concepts: z.number().optional(),
		prompts: z.number().optional(),
		notes: z.number().optional(),
		wildcards: z.number().optional(),
		relatedCharacters: z.number().optional(),
		relatedTo: z.number().optional(),
	}).optional(),
});

/**
 * Esquema para creación de personajes
 */
export const createCharacterSchema = characterBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * Esquema para actualización de personajes
 */
export const updateCharacterSchema = createCharacterSchema.partial();

/**
 * Esquema para filtros de personajes
 */
export const characterFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	classes: z.array(z.string()).optional(),
	races: z.array(z.string()).optional(),
	alignments: z.array(z.string()).optional(),
	minLevel: z.number().nonnegative().optional(),
	maxLevel: z.number().nonnegative().optional(),
	isFavorite: z.boolean().optional(),
	startDate: z.union([z.string(), z.date()]).optional(),
	endDate: z.union([z.string(), z.date()]).optional(),
	limit: z.number().positive().max(100).optional(),
	offset: z.number().nonnegative().optional(),
});

/**
 * Esquema para response de listado de personajes
 */
export const characterListResponseSchema = z.object({
	characters: z.array(characterWithStatsSchema),
	totalCount: z.number(),
	hasMore: z.boolean(),
});

// Exportaciones de tipos derivados
export type CharacterBaseSchemaType = z.infer<typeof characterBaseSchema>;
export type CharacterStatisticsSchemaType = z.infer<typeof characterStatisticsSchema>;
export type CharacterWithStatsSchemaType = z.infer<typeof characterWithStatsSchema>;
export type CreateCharacterSchemaType = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterSchemaType = z.infer<typeof updateCharacterSchema>;
export type CharacterFiltersSchemaType = z.infer<typeof characterFiltersSchema>;
export type CharacterListResponseSchemaType = z.infer<typeof characterListResponseSchema>;
