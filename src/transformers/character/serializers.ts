/**
 * @file Funciones de serialización/deserialización para la entidad Character
 * @module transformers/character/serializers
 */

import type {
	CharacterExtended,
	CharacterFilter,
	CharacterRelationship,
	CharacterStats,
	CharacterSummary,
} from '@/types/entities/character';
import type { Character as PrismaCharacter } from '@prisma/client';

/**
 * Transforma un objeto Character de Prisma a un objeto CharacterExtended
 * @param character Character de Prisma
 * @returns CharacterExtended con propiedades adicionales
 */
export function toCharacterExtended(character: PrismaCharacter): CharacterExtended {
	return {
		...character,
		// Propiedades adicionales de UI
		isSelected: false,
		isHovered: false,
		isOpen: false,
		isLoading: false,
		hasError: false,
		// Calculados/runtime
		parsedFilters: character.filters ? parseCharacterFilters(character.filters) : [],
		parsedStats: character.stats ? parseCharacterStats(character.stats) : {},
		parsedRelationships: character.relationships ? parseCharacterRelationships(character.relationships) : [],
		parsedGoals: character.goals ? parseStringArray(character.goals) : [],
		parsedFears: character.fears ? parseStringArray(character.fears) : [],
		parsedBeliefs: character.beliefs ? parseStringArray(character.beliefs) : [],
		parsedPersonality: character.personality ? parseStringArray(character.personality) : [],
		imageCount: 0,
	};
}

/**
 * Transforma un Character en un resumen para listados
 * @param character Character a resumir
 * @param imageCount Cantidad de imágenes opcional
 * @returns CharacterSummary con datos básicos
 */
export function toCharacterSummary(
	character: PrismaCharacter | CharacterExtended,
	imageCount?: number
): CharacterSummary {
	return {
		id: character.id,
		name: character.name,
		emoji: character.emoji || '👤',
		color: character.color || '#3b82f6',
		class: character.class || 'unknown',
		race: character.race || 'unknown',
		level: character.level || 1,
		imageCount: imageCount || 0,
		category: character.category,
	};
}

/**
 * Prepara los datos de un personaje para guardar en la base de datos
 * Elimina propiedades que no son parte del modelo Prisma
 * @param character Character con datos extendidos
 * @returns Datos limpios para guardar en BD
 */
export function toPrismaCharacter(character: Partial<CharacterExtended>): Partial<PrismaCharacter> {
	// Extraer solo las propiedades que existen en PrismaCharacter
	const {
		id,
		name,
		emoji,
		color,
		description,
		shortcut,
		level,
		class: characterClass,
		race,
		alignment,
		backstory,
		stats,
		sortBy,
		filters,
		psychologicalProfile,
		socialProfile,
		relationships,
		goals,
		fears,
		beliefs,
		personality,
		featuredImage,
		isFavorite,
		createdAt,
		updatedAt,
		category,
		presetId,
	} = character;

	// Serializar datos complejos si es necesario
	const serializedFilters = character.parsedFilters ? JSON.stringify(character.parsedFilters) : filters;

	const serializedStats = character.parsedStats ? JSON.stringify(character.parsedStats) : stats;

	const serializedRelationships = character.parsedRelationships
		? JSON.stringify(character.parsedRelationships)
		: relationships;

	const serializedGoals = character.parsedGoals ? JSON.stringify(character.parsedGoals) : goals;

	const serializedFears = character.parsedFears ? JSON.stringify(character.parsedFears) : fears;

	const serializedBeliefs = character.parsedBeliefs ? JSON.stringify(character.parsedBeliefs) : beliefs;

	const serializedPersonality = character.parsedPersonality ? JSON.stringify(character.parsedPersonality) : personality;

	return {
		id,
		name,
		emoji,
		color,
		description,
		shortcut,
		level,
		class: characterClass,
		race,
		alignment,
		backstory,
		stats: serializedStats,
		sortBy,
		filters: serializedFilters,
		psychologicalProfile,
		socialProfile,
		relationships: serializedRelationships,
		goals: serializedGoals,
		fears: serializedFears,
		beliefs: serializedBeliefs,
		personality: serializedPersonality,
		featuredImage,
		isFavorite,
		createdAt,
		updatedAt,
		category,
		presetId,
	};
}

/**
 * Parsea una cadena de filtros a un array de objetos CharacterFilter
 * @param filtersStr Cadena serializada de filtros
 * @returns Array de objetos CharacterFilter
 */
export function parseCharacterFilters(filtersStr: string): CharacterFilter[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (filtersStr === 'empty_array') {
			return [];
		}

		// Intentar parsear el JSON
		const parsedFilters = JSON.parse(filtersStr);

		// Validar que sea un array
		if (!Array.isArray(parsedFilters)) {
			return [];
		}

		return parsedFilters;
	} catch (error) {
		console.error('Error al parsear filtros de personaje:', error);
		return [];
	}
}

/**
 * Parsea una cadena de estadísticas a un objeto CharacterStats
 * @param statsStr Cadena serializada de estadísticas
 * @returns Objeto CharacterStats
 */
export function parseCharacterStats(statsStr: string): CharacterStats {
	try {
		// Si es "{}", retornar un objeto vacío
		if (statsStr === '{}') {
			return {};
		}

		// Intentar parsear el JSON
		const parsedStats = JSON.parse(statsStr);

		// Validar que sea un objeto
		if (typeof parsedStats !== 'object' || parsedStats === null || Array.isArray(parsedStats)) {
			return {};
		}

		return parsedStats;
	} catch (error) {
		console.error('Error al parsear estadísticas de personaje:', error);
		return {};
	}
}

/**
 * Parsea una cadena de relaciones a un array de objetos CharacterRelationship
 * @param relationshipsStr Cadena serializada de relaciones
 * @returns Array de objetos CharacterRelationship
 */
export function parseCharacterRelationships(relationshipsStr: string): CharacterRelationship[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (relationshipsStr === 'empty_array') {
			return [];
		}

		// Intentar parsear el JSON
		const parsedRelationships = JSON.parse(relationshipsStr);

		// Validar que sea un array
		if (!Array.isArray(parsedRelationships)) {
			return [];
		}

		return parsedRelationships;
	} catch (error) {
		console.error('Error al parsear relaciones de personaje:', error);
		return [];
	}
}

/**
 * Parsea una cadena que representa un array a un array de strings
 * @param str Cadena serializada que representa un array
 * @returns Array de strings
 */
export function parseStringArray(str: string): string[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (str === 'empty_array') {
			return [];
		}

		// Intentar parsear el JSON
		const parsedArray = JSON.parse(str);

		// Validar que sea un array
		if (!Array.isArray(parsedArray)) {
			return [];
		}

		return parsedArray;
	} catch (error) {
		console.error('Error al parsear array de strings:', error);
		return [];
	}
}

/**
 * Serializa un array a formato JSON string
 * @param array Array a serializar
 * @returns String serializado
 */
export function serializeArray(array: any[]): string {
	try {
		if (!array || array.length === 0) {
			return 'empty_array';
		}

		return JSON.stringify(array);
	} catch (error) {
		console.error('Error al serializar array:', error);
		return 'empty_array';
	}
}

/**
 * Serializa un objeto a formato JSON string
 * @param obj Objeto a serializar
 * @returns String serializado
 */
export function serializeObject(obj: Record<string, any>): string {
	try {
		if (!obj || Object.keys(obj).length === 0) {
			return '{}';
		}

		return JSON.stringify(obj);
	} catch (error) {
		console.error('Error al serializar objeto:', error);
		return '{}';
	}
}
