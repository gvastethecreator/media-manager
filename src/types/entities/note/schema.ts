/**
 * @file Esquema de validación para la entidad Note
 * @module types/entities/note/schema
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';
import { NoteSortCriteria } from './types';

/**
 * 🏷️ Esquema para tags de nota
 */
export const NoteTagsSchema = z.object({
	items: z.array(z.string()),
});

/**
 * 🔍 Esquema para filtros de búsqueda
 */
export const NoteFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	priorities: z.array(z.number()).optional(),
	statuses: z.array(z.string()).optional(),
	onlyFavorites: z.boolean().optional(),
	contentContains: z.string().optional(),
});

/**
 * 📝 Esquema principal para Note
 */
export const NoteSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	title: z.string().min(1),
	content: z.string(),
	category: z.string(),
	priority: z.number().int().min(0).max(10),
	status: z.string(),
	tags: z.union([z.string(), z.array(z.string())]).optional(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().default(false),
	presetId: z.string().nullable(),
	sortBy: z.nativeEnum(NoteSortCriteria).optional(),
});
