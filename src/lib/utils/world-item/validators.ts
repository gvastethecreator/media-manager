/**
 * @file Validadores con Zod para la entidad WorldItem
 * @module utils/world-item/validators
 */

import { RarityLevel, WorldItemCategory, WorldItemType } from '@/types/entities/world-item/enums';
import { z } from 'zod';

// Esquema para validar propiedades de objeto
export const worldItemPropertySchema = z.object({
	name: z.string().min(1, { message: 'El nombre de la propiedad es obligatorio' }),
	value: z.union([z.string(), z.number()]),
	description: z.string().optional(),
	icon: z.string().optional(),
});

// Esquema para validar requisitos de objeto
export const worldItemRequirementSchema = z.object({
	type: z.string().min(1, { message: 'El tipo de requisito es obligatorio' }),
	name: z.string().min(1, { message: 'El nombre del requisito es obligatorio' }),
	value: z.union([z.string(), z.number()]),
	description: z.string().optional(),
});

// Esquema para validar efectos
export const worldItemEffectSchema = z.object({
	name: z.string().min(1, { message: 'El nombre del efecto es obligatorio' }),
	description: z.string().min(1, { message: 'La descripción del efecto es obligatoria' }),
	duration: z.number().nonnegative().optional(),
	potency: z.number().nonnegative().optional(),
});

// Esquema para validar estadísticas de objeto
export const worldItemStatsSchema = z.object({
	damage: z.number().nonnegative().optional(),
	defense: z.number().nonnegative().optional(),
	durability: z.number().nonnegative().optional(),
	weight: z.number().nonnegative().optional(),
	value: z.number().nonnegative().optional(),
	level: z.number().nonnegative().optional(),
	power: z.number().nonnegative().optional(),
	range: z.number().nonnegative().optional(),
	accuracy: z.number().nonnegative().optional(),
	speed: z.number().nonnegative().optional(),
	effects: z.array(worldItemEffectSchema).optional(),
	customStats: z.record(z.union([z.string(), z.number()])).optional(),
});

// Esquema para validar datos al crear un objeto
export const createWorldItemSchema = z.object({
	name: z
		.string()
		.min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
		.max(100, { message: 'El nombre no puede superar los 100 caracteres' }),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	type: z.nativeEnum(WorldItemType).nullable().optional(),
	rarity: z.nativeEnum(RarityLevel).nullable().optional(),
	properties: z.string().nullable().optional(),
	requirements: z.string().nullable().optional(),
	origin: z.string().nullable().optional(),
	stats: z.string().nullable().optional(),
	sortBy: z.string().nullable().optional(),
	filters: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
	category: z.nativeEnum(WorldItemCategory).nullable().optional(),
});

// Esquema para validar datos al actualizar un objeto
export const updateWorldItemSchema = z.object({
	name: z
		.string()
		.min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
		.max(100, { message: 'El nombre no puede superar los 100 caracteres' })
		.optional(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	type: z.nativeEnum(WorldItemType).nullable().optional(),
	rarity: z.nativeEnum(RarityLevel).nullable().optional(),
	properties: z.string().nullable().optional(),
	requirements: z.string().nullable().optional(),
	origin: z.string().nullable().optional(),
	stats: z.string().nullable().optional(),
	sortBy: z.string().nullable().optional(),
	filters: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
	category: z.nativeEnum(WorldItemCategory).nullable().optional(),
});

// Esquema para filtros de búsqueda
export const worldItemFiltersSchema = z.object({
	searchQuery: z.string().optional(),
	categories: z.array(z.string()).optional(),
	types: z.array(z.string()).optional(),
	rarities: z.array(z.string()).optional(),
	minLevel: z.number().nonnegative().optional(),
	maxLevel: z.number().nonnegative().optional(),
	minValue: z.number().nonnegative().optional(),
	maxValue: z.number().nonnegative().optional(),
	onlyFavorites: z.boolean().optional(),
	hasImages: z.boolean().optional(),
	hasNotes: z.boolean().optional(),
	hasConcepts: z.boolean().optional(),
	hasPrompts: z.boolean().optional(),
});
