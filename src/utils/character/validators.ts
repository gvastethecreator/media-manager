/**
 * @file Validadores para la entidad Character
 * @module utils/character/validators
 */

import {
    CharacterAlignment,
    CharacterCategory,
    CharacterClass,
    CharacterRace,
    CharacterRelationshipType,
    CharacterSortOption,
} from '@/types/entities/character/enums';
import * as z from 'zod';

/**
 * Esquema de validación para estadísticas de personaje
 */
export const characterStatsSchema = z
	.object({
		strength: z.number().int().min(1).max(30).optional(),
		dexterity: z.number().int().min(1).max(30).optional(),
		constitution: z.number().int().min(1).max(30).optional(),
		intelligence: z.number().int().min(1).max(30).optional(),
		wisdom: z.number().int().min(1).max(30).optional(),
		charisma: z.number().int().min(1).max(30).optional(),
		hp: z.number().int().min(1).optional(),
		maxHp: z.number().int().min(1).optional(),
		ac: z.number().int().min(1).optional(),
		initiative: z.number().int().optional(),
		speed: z.number().int().min(1).optional(),
	})
	.catchall(z.number().or(z.string()));

/**
 * Esquema de validación para filtros de personaje
 */
export const characterFilterSchema = z.object({
	id: z.string().uuid().optional(),
	field: z.string().min(1),
	operator: z.string().min(1),
	value: z.string().or(z.number()).or(z.boolean()).nullable(),
	displayValue: z.string().optional(),
});

/**
 * Esquema de validación para relaciones entre personajes
 */
export const characterRelationshipSchema = z.object({
	characterId: z.string().uuid(),
	name: z.string().min(1),
	type: z.nativeEnum(CharacterRelationshipType),
	strength: z.number().int().min(0).max(100),
	notes: z.string().optional(),
});

/**
 * Esquema de validación para crear un nuevo personaje
 */
export const createCharacterSchema = z.object({
	name: z.string().min(1).max(100),
	emoji: z.string().max(10).nullable().optional(),
	color: z
		.string()
		.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
		.nullable()
		.optional(),
	description: z.string().max(500).nullable().optional(),
	shortcut: z.string().max(20).nullable().optional(),
	level: z.union([z.number().int().positive(), z.string().min(1)]).optional(),
	class: z.nativeEnum(CharacterClass).nullable().optional(),
	race: z.nativeEnum(CharacterRace).nullable().optional(),
	alignment: z.nativeEnum(CharacterAlignment).nullable().optional(),
	backstory: z.string().max(5000).nullable().optional(),
	stats: z.string().or(characterStatsSchema).optional(),
	sortBy: z.nativeEnum(CharacterSortOption).nullable().optional(),
	psychologicalProfile: z.string().max(1000).nullable().optional(),
	socialProfile: z.string().max(1000).nullable().optional(),
	featuredImage: z.string().uuid().nullable().optional(),
	isFavorite: z.boolean().optional(),
	category: z.nativeEnum(CharacterCategory).nullable().optional(),
	presetId: z.string().uuid().nullable().optional(),
});

/**
 * Esquema de validación para actualizar un personaje existente
 */
export const updateCharacterSchema = createCharacterSchema.partial().extend({
	id: z.string().uuid(),
});

/**
 * Esquema de validación para buscar personajes
 */
export const characterSearchSchema = z.object({
	term: z.string().optional(),
	class: z.nativeEnum(CharacterClass).optional(),
	race: z.nativeEnum(CharacterRace).optional(),
	alignment: z.nativeEnum(CharacterAlignment).optional(),
	category: z.nativeEnum(CharacterCategory).optional(),
	levelMin: z.number().int().positive().optional(),
	levelMax: z.number().int().positive().optional(),
	sortBy: z.nativeEnum(CharacterSortOption).optional(),
	isFavorite: z.boolean().optional(),
	limit: z.number().int().positive().optional(),
	offset: z.number().int().min(0).optional(),
});

/**
 * Validar y normalizar un objeto de estadísticas de personaje
 * @param stats Estadísticas a validar (puede ser string o objeto)
 * @returns Estadísticas validadas como objeto o null si no son válidas
 */
export function validateCharacterStats(stats: unknown): Record<string, number> | null {
	try {
		// Si stats es un string, intentar parsearlo a objeto
		let parsedStats: unknown = stats;
		if (typeof stats === 'string') {
			try {
				parsedStats = JSON.parse(stats);
			} catch {
				return null;
			}
		}

		// Validar con el esquema Zod
		const validStats = characterStatsSchema.safeParse(parsedStats);

                if (validStats.success) {
                        return validStats.data as Record<string, number>;
                }

		return null;
	} catch (error) {
		console.error('Error validando estadísticas:', error);
		return null;
	}
}

/**
 * Validar y normalizar un array de filtros de personaje
 * @param filters Filtros a validar (puede ser string o array)
 * @returns Filtros validados como array o array vacío si no son válidos
 */
export function validateCharacterFilters(filters: unknown): z.infer<typeof characterFilterSchema>[] {
	try {
		// Si filters es un string, intentar parsearlo a array
		let parsedFilters: unknown = filters;
		if (typeof filters === 'string') {
			if (filters === '[]') {
				return [];
			}

			try {
				parsedFilters = JSON.parse(filters);
			} catch {
				return [];
			}
		}

		// Si no es un array, devolver array vacío
		if (!Array.isArray(parsedFilters)) {
			return [];
		}

		// Validar cada filtro y devolver solo los válidos
		return parsedFilters
			.map((filter) => {
				const validFilter = characterFilterSchema.safeParse(filter);
				return validFilter.success ? validFilter.data : null;
			})
			.filter(Boolean) as z.infer<typeof characterFilterSchema>[];
	} catch (error) {
		console.error('Error validando filtros:', error);
		return [];
	}
}

/**
 * Validar y normalizar un array de relaciones de personaje
 * @param relationships Relaciones a validar (puede ser string o array)
 * @returns Relaciones validadas como array o array vacío si no son válidas
 */
export function validateCharacterRelationships(relationships: unknown): z.infer<typeof characterRelationshipSchema>[] {
	try {
		// Si relationships es un string, intentar parsearlo a array
		let parsedRelationships: unknown = relationships;
		if (typeof relationships === 'string') {
			if (relationships === '[]') {
				return [];
			}

			try {
				parsedRelationships = JSON.parse(relationships);
			} catch {
				return [];
			}
		}

		// Si no es un array, devolver array vacío
		if (!Array.isArray(parsedRelationships)) {
			return [];
		}

		// Validar cada relación y devolver solo las válidas
		return parsedRelationships
			.map((relationship) => {
				const validRelationship = characterRelationshipSchema.safeParse(relationship);
				return validRelationship.success ? validRelationship.data : null;
			})
			.filter(Boolean) as z.infer<typeof characterRelationshipSchema>[];
	} catch (error) {
		console.error('Error validando relaciones:', error);
		return [];
	}
}

/**
 * Validar datos al crear un personaje
 * @param data Datos para crear personaje
 * @returns Objeto con resultado y errores si los hay
 */
export function validateCreateCharacter(data: unknown): {
	isValid: boolean;
	data?: z.infer<typeof createCharacterSchema>;
	errors?: z.ZodError;
} {
	try {
		const result = createCharacterSchema.safeParse(data);

		if (result.success) {
			return {
				isValid: true,
				data: result.data,
			};
		}

		return {
			isValid: false,
			errors: result.error,
		};
	} catch (error) {
		console.error('Error en validación de creación de personaje:', error);
		return {
			isValid: false,
		};
	}
}

/**
 * Validar datos al actualizar un personaje
 * @param data Datos para actualizar personaje
 * @returns Objeto con resultado y errores si los hay
 */
export function validateUpdateCharacter(data: unknown): {
	isValid: boolean;
	data?: z.infer<typeof updateCharacterSchema>;
	errors?: z.ZodError;
} {
	try {
		const result = updateCharacterSchema.safeParse(data);

		if (result.success) {
			return {
				isValid: true,
				data: result.data,
			};
		}

		return {
			isValid: false,
			errors: result.error,
		};
	} catch (error) {
		console.error('Error en validación de actualización de personaje:', error);
		return {
			isValid: false,
		};
	}
}
