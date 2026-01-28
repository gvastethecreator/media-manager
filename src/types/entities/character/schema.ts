/**
 * @file Esquema de validación para la entidad Character
 * @module types/entities/character/schema
 * @description Define el esquema de validación utilizando Zod para la entidad Character
 */

import { z } from 'zod';
import { BaseEntitySchema } from '@/types/common/base';

// Esquema para validar strings no vacíos
const _nonEmptyString = z.string().min(1, 'El campo no puede estar vacío');

// Esquema para validar strings opcionales
const _optionalString = z.string().optional();

// Esquema para validar arrays
const _stringArray = z.array(z.string()).optional().default([]);

// Esquema para estadísticas
const _statsSchema = z.union([z.string(), z.record(z.string(), z.unknown()), z.undefined()]).optional();

// Esquema para filtros
const _filtersSchema = z.union([z.string(), z.record(z.string(), z.unknown()), z.undefined()]).optional();

// Esquema para relaciones
const _relationshipsSchema = z.union([z.string(), z.array(z.unknown()), z.undefined()]).optional();

/**
 * 🧍 Esquema para inventario de personaje
 */
export const CharacterInventoryItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	quantity: z.number().int().min(1),
	type: z.string(),
	rarity: z.string().optional(),
	description: z.string().optional(),
});

/**
 * 🪄 Esquema para hechizos de personaje
 */
export const CharacterSpellSchema = z.object({
	id: z.string(),
	name: z.string(),
	level: z.number().int().min(0).max(9),
	school: z.string(),
	description: z.string().optional(),
});

/**
 * 🎯 Esquema para habilidades especiales
 */
export const CharacterFeatSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	requirements: z.array(z.string()).optional(),
});

/**
 * 🧠 Esquema para estadísticas de personaje
 */
export const CharacterStatsSchema = z.record(z.string(), z.number());

/**
 * 🧩 Esquema para habilidades de personaje
 * Define la estructura esperada para cada habilidad.
 */
export const CharacterSkillSchema = z.object({
	name: z.string().min(1, 'El nombre de la habilidad es obligatorio'),
	level: z.number().int().min(0).optional().default(0),
	// Otros campos opcionales relevantes para una habilidad
	description: z.string().optional(),
	category: z.string().optional(),
});

/**
 * 👥 Esquema para relaciones de personaje
 */
export const CharacterRelationSchema = z.object({
	id: z.string().uuid(),
	type: z.string(),
	name: z.string().optional(),
	description: z.string().optional(),
});

// Helper para parsear JSON de forma segura antes de validar
const safeJsonParse = (defaultValue: unknown) => (val: unknown) => {
	if (typeof val !== 'string' || !val || val === 'empty_object' || val === 'empty_array') {
		return defaultValue;
	}
	try {
		return JSON.parse(val);
	} catch {
		return defaultValue; // O tal vez lanzar error o devolver el string original? Decide según la lógica.
	}
};

/**
 * 🧙‍♂️ Esquema completo para Character
 */
export const CharacterSchema = BaseEntitySchema.extend({
	id: z.string().cuid(),
	name: z.string().min(1, 'El nombre es obligatorio'),
	description: z.string().optional(),
	level: z.number().int().min(1).max(100).default(1),
	class: z.string(),
	race: z.string(),
	alignment: z.string(),
	backstory: z.string().optional(),
	emoji: z.string().default('👤'),
	color: z
		.string()
		.refine(
			(val) => /^#[0-9A-Fa-f]{6}$/.test(val) || val.startsWith('var(--'),
			'Color debe ser un valor hexadecimal o una variable CSS válida'
		)
		.default('var(--entity-character)'),

	// Objetos complejos (parsear JSON antes de validar)
	stats: z.preprocess(safeJsonParse({}), CharacterStatsSchema.optional()),

	// Arrays complejos (parsear JSON array principal, luego elementos internos)
	skills: z.preprocess(
		safeJsonParse([]),
		z
			.array(
				z.preprocess(
					(item) => {
						// Intentar parsear como CharacterSkillSchema
						const parsedSkill = CharacterSkillSchema.safeParse(item);
						if (parsedSkill.success) {
							return parsedSkill.data;
						}
						// Si falla el parseo como objeto, devolver el item original (probablemente string)
						return item;
					},
					z.union([CharacterSkillSchema, z.string()])
				)
			)
			.optional()
			.default([])
	),

	inventory: z.array(CharacterInventoryItemSchema).optional(),
	spells: z.array(CharacterSpellSchema).optional(),
	feats: z.array(CharacterFeatSchema).optional(),

	// Relación notes (debe ser array de objetos con id)
	notes: z
		.array(z.object({ id: z.string().cuid() }))
		.optional()
		.default([]),
	isActive: z.boolean().default(true),
	isFavorite: z.boolean().default(false),

	// Metadatos flexibles
	metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 📝 Esquema para crear un personaje
 */
export const CreateCharacterSchema = CharacterSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

/**
 * 🔄 Esquema para actualizar un personaje
 */
export const UpdateCharacterSchema = CreateCharacterSchema.partial();

/**
 * 🔍 Esquema para búsqueda de personajes
 */
export const CharacterSearchSchema = z.object({
	search: z.string().optional(),
	level: z
		.object({
			min: z.number().optional(),
			max: z.number().optional(),
		})
		.optional(),
	class: z.array(z.string()).optional(),
	race: z.array(z.string()).optional(),
	alignment: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20),
	orderBy: z.string().optional(),
});

// Tipo derivado del esquema
export type CharacterSchemaType = z.infer<typeof CharacterSchema>;

// Exportar tipos y esquemas adicionales si es necesario
export default CharacterSchema;
