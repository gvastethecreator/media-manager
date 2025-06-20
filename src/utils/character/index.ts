/**
 * @file Utilidades para personajes
 * @module utils/character
 */

// Re-exportar todas las funciones de helpers
export * from './helpers';

// Re-exportar todas las funciones de validators
export * from './validators';

import { CharacterSortOption } from '@/types/entities/character/enums';
import type { CharacterExtended } from '@/types/entities/character/types';

/**
 * 🎭 Prefijo para las claves de almacenamiento de Character
 */
export const CHARACTER_KEY_PREFIX = 'character_';

/**
 * 🎭 Ordena los personajes según la opción especificada
 * @param characters Array de personajes a ordenar
 * @param sortOption Opción de ordenamiento
 * @returns Array de personajes ordenados
 */
export function sortCharacters(characters: CharacterExtended[], sortOption: CharacterSortOption): CharacterExtended[] {
	if (!characters || characters.length === 0) {
		return [];
	}

	return [...characters].sort((a, b) => {
		switch (sortOption) {
			case CharacterSortOption.NAME_ASC:
				return a.name.localeCompare(b.name);
			case CharacterSortOption.NAME_DESC:
				return b.name.localeCompare(a.name);
			case CharacterSortOption.LEVEL_ASC:
				return a.level - b.level;
			case CharacterSortOption.LEVEL_DESC:
				return b.level - a.level;
			case CharacterSortOption.CLASS_ASC:
				return a.class.localeCompare(b.class);
			case CharacterSortOption.CLASS_DESC:
				return b.class.localeCompare(a.class);
			case CharacterSortOption.RACE_ASC:
				return a.race.localeCompare(b.race);
			case CharacterSortOption.RACE_DESC:
				return b.race.localeCompare(a.race);
			case CharacterSortOption.DATE_ASC:
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case CharacterSortOption.DATE_DESC:
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			default:
				return a.name.localeCompare(b.name);
		}
	});
}

/**
 * 🎭 Agrupa los personajes según el criterio especificado
 * @param characters Array de personajes a agrupar
 * @param groupBy Criterio de agrupamiento
 * @returns Objeto con grupos de personajes
 */
export function groupCharacters(
	characters: CharacterExtended[],
	groupBy: 'none' | 'class' | 'race' | 'category' | 'level' | null
): Record<string, CharacterExtended[]> {
	if (!characters || characters.length === 0 || !groupBy || groupBy === 'none') {
		return { 'Todos': characters || [] };
	}

	const groups: Record<string, CharacterExtended[]> = {};

	for (const character of characters) {
		let groupKey: string;

		switch (groupBy) {
			case 'class':
				groupKey = character.class || 'Sin clase';
				break;
			case 'race':
				groupKey = character.race || 'Sin raza';
				break;
			case 'category':
				groupKey = character.category || 'Sin categoría';
				break;
			case 'level': {
				const level = character.level;
				if (level <= 5) groupKey = 'Novato (1-5)';
				else if (level <= 10) groupKey = 'Intermedio (6-10)';
				else if (level <= 15) groupKey = 'Avanzado (11-15)';
				else if (level <= 20) groupKey = 'Experto (16-20)';
				else groupKey = 'Legendario (20+)';
				break;
			}
			default:
				groupKey = 'Otros';
		}

		if (!groups[groupKey]) {
			groups[groupKey] = [];
		}
		groups[groupKey].push(character);
	}

	// Ordenar los grupos por nombre
	const sortedGroups: Record<string, CharacterExtended[]> = {};
	const sortedKeys = Object.keys(groups).sort();

	for (const key of sortedKeys) {
		sortedGroups[key] = groups[key];
	}

	return sortedGroups;
}

/**
 * 🎭 Filtra personajes por término de búsqueda
 * @param characters Array de personajes
 * @param searchTerm Término de búsqueda
 * @returns Array de personajes filtrados
 */
export function filterCharactersBySearch(characters: CharacterExtended[], searchTerm: string): CharacterExtended[] {
	if (!searchTerm.trim()) {
		return characters;
	}

	const term = searchTerm.toLowerCase();

	return characters.filter(character =>
		character.name.toLowerCase().includes(term) ||
		character.description?.toLowerCase().includes(term) ||
		character.class?.toLowerCase().includes(term) ||
		character.race?.toLowerCase().includes(term) ||
		character.category?.toLowerCase().includes(term)
	);
}

/**
 * 🎭 Obtiene estadísticas de los personajes
 * @param characters Array de personajes
 * @returns Objeto con estadísticas
 */
export function getCharacterStats(characters: CharacterExtended[]) {
	if (!characters || characters.length === 0) {
		return {
			total: 0,
			favorites: 0,
			byClass: {},
			byRace: {},
			byLevel: {},
			avgLevel: 0,
		};
	}

	const stats = {
		total: characters.length,
		favorites: 0,
		byClass: {} as Record<string, number>,
		byRace: {} as Record<string, number>,
		byLevel: {} as Record<string, number>,
		avgLevel: 0,
	};

	let totalLevel = 0;

	for (const character of characters) {
		// Favoritos
		if (character.isFavorite) {
			stats.favorites++;
		}

		// Por clase
		const charClass = character.class || 'Sin clase';
		stats.byClass[charClass] = (stats.byClass[charClass] || 0) + 1;

		// Por raza
		const race = character.race || 'Sin raza';
		stats.byRace[race] = (stats.byRace[race] || 0) + 1;

		// Por nivel
		const level = character.level;
		totalLevel += level;
		const levelRange = level <= 5 ? '1-5' : level <= 10 ? '6-10' : level <= 15 ? '11-15' : level <= 20 ? '16-20' : '20+';
		stats.byLevel[levelRange] = (stats.byLevel[levelRange] || 0) + 1;
	}

	stats.avgLevel = Math.round(totalLevel / characters.length);

	return stats;
}

/**
 * 🎭 Compara dos personajes para ordenamiento
 * @param a Primer personaje
 * @param b Segundo personaje
 * @param sortBy Criterio de comparación
 * @returns Número de comparación
 */
export function compareCharacters(a: CharacterExtended, b: CharacterExtended, sortBy: string = 'name'): number {
	switch (sortBy) {
		case 'name':
			return a.name.localeCompare(b.name);
		case 'level':
			return b.level - a.level; // Descendente por defecto
		case 'class':
			return a.class.localeCompare(b.class);
		case 'race':
			return a.race.localeCompare(b.race);
		case 'date':
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		default:
			return 0;
	}
}

/**
 * 🎭 Obtiene el nivel como número
 * @param character Personaje
 * @returns Nivel numérico
 */
export function getCharacterLevelAsNumber(character: CharacterExtended): number {
	return character.level || 1;
}

/**
 * 🎭 Verifica si un personaje coincide con la búsqueda
 * @param character Personaje
 * @param searchTerm Término de búsqueda
 * @returns true si coincide
 */
export function matchesCharacterSearch(character: CharacterExtended, searchTerm: string): boolean {
	if (!searchTerm.trim()) return true;

	const term = searchTerm.toLowerCase();
	return (
		character.name.toLowerCase().includes(term) ||
		character.description?.toLowerCase().includes(term) ||
		character.class?.toLowerCase().includes(term) ||
		character.race?.toLowerCase().includes(term) ||
		character.category?.toLowerCase().includes(term)
	);
}

/**
 * 🎭 Valida si un nombre de personaje es válido
 * @param name Nombre a validar
 * @returns true si es válido
 */
export function isValidCharacterName(name: string): boolean {
	return name.trim().length >= 1 && name.trim().length <= 100;
}

/**
 * 🎭 Genera un color aleatorio para un personaje
 * @returns Color en formato hex
 */
export function generateCharacterColor(): string {
	const colors = [
		'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
		'#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 🎭 Genera un emoji aleatorio para un personaje
 * @returns Emoji string
 */
export function generateCharacterEmoji(): string {
	const emojis = [
		'🧙‍♂️', '⚔️', '🏹', '🛡️', '🗡️', '🎭', '👑', '🔮', '⚡', '🌟',
		'🐉', '🦄', '🧝‍♀️', '🧝‍♂️', '🧚‍♀️', '🧚‍♂️', '🧞‍♂️', '🧞‍♀️', '👹', '👺'
	];
	return emojis[Math.floor(Math.random() * emojis.length)];
}
