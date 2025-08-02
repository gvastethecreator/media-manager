/**
 * @file Esquema de validación para la entidad WorldItem
 * @module types/entities/world-item/schema
 */

import { z } from 'zod';
import { BaseEntitySchema } from '@/types/common/base';
import { MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { WorldItemCategory, WorldItemRarity, WorldItemType } from './enums';

/**
 * 🔍 Esquema para filtros de búsqueda
 */
export const WorldItemFiltersSchema = z.object({
	query: z.string().optional(),
	types: z.array(z.nativeEnum(WorldItemType)).optional(),
	categories: z.array(z.nativeEnum(WorldItemCategory)).optional(),
	rarities: z.array(z.nativeEnum(WorldItemRarity)).optional(),
	minLevel: z.number().optional(),
	maxLevel: z.number().optional(),
	minValue: z.number().optional(),
	maxValue: z.number().optional(),
	isFavorite: z.boolean().optional(),
	hasImages: z.boolean().optional(),
	hasFiles: z.boolean().optional(),
});

/**
 * 📊 Esquema para estadísticas de atributos
 */
export const WorldItemAttributesSchema = z.object({
	items: z.array(
		z.object({
			name: z.string(),
			value: z.number(),
			maxValue: z.number().optional(),
		})
	),
});

/**
 * 🔮 Esquema para efectos
 */
export const WorldItemEffectsSchema = z.object({
	items: z.array(
		z.object({
			name: z.string(),
			description: z.string(),
			duration: z.string().optional(),
			cooldown: z.string().optional(),
		})
	),
});

/**
 * 📋 Esquema para requisitos
 */
export const WorldItemRequirementsSchema = z.object({
	items: z.array(
		z.object({
			name: z.string(),
			value: z.number(),
			description: z.string().optional(),
		})
	),
});

/**
 * 📈 Esquema para estadísticas
 */
export const WorldItemStatsSchema = z.object({
	items: z.array(
		z.object({
			name: z.string(),
			value: z.number(),
			modifier: z.string().optional(),
		})
	),
});

/**
 * 🏷️ Esquema para propiedades
 */
export const WorldItemPropertiesSchema = z.object({
	items: z.array(
		z.object({
			name: z.string(),
			value: z.union([z.string(), z.number(), z.boolean()]),
			description: z.string().optional(),
		})
	),
});

/**
 * 🔍 Esquema para filtros de objeto
 */
export const WorldItemFilterSchema = z.object({
	type: z.enum(['tag', 'character', 'place', 'concept', 'world-item']),
	operator: z.enum(['AND', 'OR', 'NOT']),
	value: z.union([z.string(), z.number(), z.boolean()]),
	field: z.string().optional(),
});

/**
 * 📝 Esquema principal para WorldItem
 */
export const WorldItemSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	name: z.string().min(1),
	emoji: z.string().default('🔮'),
	color: z.string().default('#6D28D9'),
	description: z.string().nullable(),
	shortcut: z.string().nullable(),
	category: z.string().nullable().default('general'),
	type: z.string().default('item'),
	rarity: z.string().default('common'),
	size: z.string().default('medium'),
	origin: z.string().default('unknown'),
	attributes: z.string().default('{}'),
	effects: z.string().default('{}'),
	requirements: z.string().default('{}'),
	stats: z.string().default('{}'),
	properties: z.string().default('{}'),
	sortBy: z.string().default('name:asc'),
	filters: z.string().default('{}'),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().default(false),
});
