/**
 * @file Validadores para la entidad Collection usando Zod
 * @module utils/collection/validators
 */

import { z } from 'zod';
import { CollectionCategory, CollectionPlatform, CollectionRarity } from '@/types/entities/collection';
import { isValidCollectionUrl } from './helpers';

/**
 * Esquema de validación para un filtro de colección
 */
export const collectionFilterSchema = z.object({
	field: z.string(),
	operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'gt', 'lt', 'gte', 'lte']),
	value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
});

/**
 * Esquema de validación para una edición de colección
 */
export const collectionEditionSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	date: z.date().optional(),
	totalItems: z.number().int().nonnegative().optional(),
	description: z.string().optional(),
	price: z.number().nonnegative().optional(),
	currency: z.string().optional(),
});

/**
 * Esquema de validación para crear una colección
 */
export const createCollectionSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	emoji: z.string().max(10).default('🌟'),
	description: z.string().max(1000).optional(),
	color: z
		.string()
		.regex(/^#([0-9A-F]{3}){1,2}$/i, 'Formato de color inválido')
		.default('#3b82f6'),
	presetId: z.string().optional().nullable(),
	category: z.nativeEnum(CollectionCategory).optional(),
	rarity: z.nativeEnum(CollectionRarity).default(CollectionRarity.COMMON),
	texture: z.string().optional(),
	url: z.string().refine(isValidCollectionUrl, 'URL inválida').optional(),
	alternativeUrl: z.string().refine(isValidCollectionUrl, 'URL alternativa inválida').optional(),
	platform: z.nativeEnum(CollectionPlatform).optional(),
	price: z.number().nonnegative().optional(),
});

/**
 * Esquema de validación para actualizar una colección
 */
export const updateCollectionSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo').optional(),
	emoji: z.string().max(10).optional(),
	description: z.string().max(1000).optional(),
	color: z
		.string()
		.regex(/^#([0-9A-F]{3}){1,2}$/i, 'Formato de color inválido')
		.optional(),
	presetId: z.string().optional().nullable(),
	isFavorite: z.boolean().optional(),
	category: z.nativeEnum(CollectionCategory).optional(),
	rarity: z.nativeEnum(CollectionRarity).optional(),
	texture: z.string().optional(),
	url: z.string().refine(isValidCollectionUrl, 'URL inválida').optional(),
	alternativeUrl: z.string().refine(isValidCollectionUrl, 'URL alternativa inválida').optional(),
	platform: z.nativeEnum(CollectionPlatform).optional(),
	price: z.number().nonnegative().optional(),
	sortBy: z.string().optional(),
	filters: z.string().optional(),
	featuredImage: z.string().optional(),
});

/**
 * Esquema de validación para la configuración de visualización de colecciones
 */
export const collectionViewConfigSchema = z.object({
	viewType: z.enum(['grid', 'list', 'compact', 'gallery']).default('grid'),
	sortBy: z.enum(['name', 'date', 'price', 'items', 'category']).default('name'),
	sortDirection: z.enum(['asc', 'desc']).default('asc'),
	showImages: z.boolean().default(true),
	imageCount: z.number().int().min(0).max(10).default(3),
	enableAnimations: z.boolean().default(true),
	groupBy: z.enum(['category', 'rarity', 'platform']).nullable().optional(),
});

/**
 * Valida datos de creación de colección y devuelve datos limpios o error
 * @param data Datos a validar
 * @returns Objeto con datos validados o un error
 */
export function validateCollectionCreate(data: unknown) {
	return createCollectionSchema.safeParse(data);
}

/**
 * Valida datos de actualización de colección y devuelve datos limpios o error
 * @param data Datos a validar
 * @returns Objeto con datos validados o un error
 */
export function validateCollectionUpdate(data: unknown) {
	return updateCollectionSchema.safeParse(data);
}
