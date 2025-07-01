/**
 * @file Validadores para la entidad Tag
 * @module utils/tag/validators
 */

import { TagCategory, TagRarity } from '@/store/entities/tag/types';
import { z } from 'zod';

/**
 * Esquema de validación para crear una etiqueta
 */
export const createTagSchema = z.object({
	name: z
		.string()
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(50, 'El nombre no puede exceder 50 caracteres')
		.refine((value) => /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s_\-:.]+$/.test(value), {
			message: 'El nombre solo puede contener letras, números, espacios y algunos caracteres especiales (_-:.)',
		}),
	emoji: z.string().max(5, 'El emoji no puede exceder 5 caracteres').nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un valor hexadecimal válido (ej: #3b82f6)')
		.nullable()
		.optional(),
	description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').nullable().optional(),
	shortcut: z.string().max(20, 'El atajo no puede exceder 20 caracteres').nullable().optional(),
	category: z.nativeEnum(TagCategory).nullable().optional(),
	rarity: z.nativeEnum(TagRarity).nullable().optional(),
	texture: z.string().nullable().optional(),
	isFavorite: z.boolean().optional().default(false),
});

/**
 * Esquema de validación para actualizar una etiqueta
 */
export const updateTagSchema = z.object({
	name: z
		.string()
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(50, 'El nombre no puede exceder 50 caracteres')
		.refine((value) => /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s_\-:.]+$/.test(value), {
			message: 'El nombre solo puede contener letras, números, espacios y algunos caracteres especiales (_-:.)',
		})
		.optional(),
	emoji: z.string().max(5, 'El emoji no puede exceder 5 caracteres').nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un valor hexadecimal válido (ej: #3b82f6)')
		.nullable()
		.optional(),
	description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').nullable().optional(),
	shortcut: z.string().max(20, 'El atajo no puede exceder 20 caracteres').nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
	category: z.nativeEnum(TagCategory).nullable().optional(),
	rarity: z.nativeEnum(TagRarity).nullable().optional(),
	texture: z.string().nullable().optional(),
});

/**
 * Esquema de validación para filtros de etiquetas
 */
export const tagFiltersSchema = z
	.object({
		searchQuery: z.string().optional(),
		categories: z.array(z.nativeEnum(TagCategory)).optional(),
		rarities: z.array(z.nativeEnum(TagRarity)).optional(),
		onlyFavorites: z.boolean().optional(),
		minCount: z
			.number()
			.int('El conteo mínimo debe ser un número entero')
			.nonnegative('El conteo mínimo no puede ser negativo')
			.optional(),
		maxCount: z
			.number()
			.int('El conteo máximo debe ser un número entero')
			.nonnegative('El conteo máximo no puede ser negativo')
			.optional(),
	})
	.refine(
		(data) => {
			if (data.minCount !== undefined && data.maxCount !== undefined) {
				return data.minCount <= data.maxCount;
			}
			return true;
		},
		{
			message: 'El conteo mínimo no puede ser mayor que el conteo máximo',
			path: ['minCount'],
		}
	);

/**
 * Tipo para datos validados de creación de etiqueta
 */
export type ValidatedCreateTagData = z.infer<typeof createTagSchema>;

/**
 * Tipo para datos validados de actualización de etiqueta
 */
export type ValidatedUpdateTagData = z.infer<typeof updateTagSchema>;

/**
 * Tipo para filtros validados de etiquetas
 */
export type ValidatedTagFilters = z.infer<typeof tagFiltersSchema>;
