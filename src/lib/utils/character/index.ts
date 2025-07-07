/**
 * @file Utilidades para personajes
 * @module utils/character
 */

// Re-exportar todas las funciones de helpers
export * from './helpers';

// Re-exportar todas las funciones de validators
export * from './validators';

import { CharacterSortOption } from '@/types/entities/character/enums';
import type { CharacterWithStats } from '@/types/entities/character/types';

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
export function sortCharacters(
	characters: CharacterWithStats[],
	sortOption: CharacterSortOption
): CharacterWithStats[] {
	const sortedCharacters = [...characters];

	switch (sortOption) {
		case CharacterSortOption.NAME_ASC:
			return sortedCharacters.sort((a, b) => a.name.localeCompare(b.name));
		case CharacterSortOption.NAME_DESC:
			return sortedCharacters.sort((a, b) => b.name.localeCompare(a.name));
		case CharacterSortOption.DATE_ASC:
			return sortedCharacters.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		case CharacterSortOption.DATE_DESC:
			return sortedCharacters.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		case CharacterSortOption.LEVEL_ASC:
			return sortedCharacters.sort((a, b) => a.level - b.level);
		case CharacterSortOption.LEVEL_DESC:
			return sortedCharacters.sort((a, b) => b.level - a.level);
		case CharacterSortOption.CLASS_ASC:
			return sortedCharacters.sort((a, b) => a.class.localeCompare(b.class));
		case CharacterSortOption.CLASS_DESC:
			return sortedCharacters.sort((a, b) => b.class.localeCompare(a.class));
		case CharacterSortOption.RACE_ASC:
			return sortedCharacters.sort((a, b) => a.race.localeCompare(b.race));
		case CharacterSortOption.RACE_DESC:
			return sortedCharacters.sort((a, b) => b.race.localeCompare(a.race));
		default:
			return sortedCharacters;
	}
}

/**
 * 🎭 Agrupa los personajes según el criterio especificado
 * @param characters Array de personajes a agrupar
 * @param groupBy Criterio de agrupamiento
 * @returns Objeto con grupos de personajes
 */
export function groupCharacters(
	characters: CharacterWithStats[],
	groupBy: 'none' | 'class' | 'race' | 'category' | 'level' | null
): Record<string, CharacterWithStats[]> {
	if (!characters || characters.length === 0 || !groupBy || groupBy === 'none') {
		return { Todos: characters || [] };
	}

	const groups: Record<string, CharacterWithStats[]> = {};

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
	const sortedGroups: Record<string, CharacterWithStats[]> = {};
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
export function filterCharactersBySearch(characters: CharacterWithStats[], searchTerm: string): CharacterWithStats[] {
	if (!searchTerm.trim()) {
		return characters;
	}

	const normalizedTerm = searchTerm.toLowerCase().trim();

	return characters.filter((character) => matchesCharacterSearch(character, normalizedTerm));
}

/**
 * 🎭 Obtiene estadísticas de los personajes
 * @param characters Array de personajes
 * @returns Objeto con estadísticas
 */
export function getCharacterStats(characters: CharacterWithStats[]) {
	const totalCharacters = characters.length;
	const totalFavorites = characters.filter((c) => c.isFavorite).length;

	// Distribución por clase
	const classCounts: Record<string, number> = {};
	characters.forEach((character) => {
		const characterClass = character.class || 'unknown';
		classCounts[characterClass] = (classCounts[characterClass] || 0) + 1;
	});

	// Distribución por raza
	const raceCounts: Record<string, number> = {};
	characters.forEach((character) => {
		const race = character.race || 'unknown';
		raceCounts[race] = (raceCounts[race] || 0) + 1;
	});

	// Distribución por nivel
	const levelRanges = {
		'1-5': 0,
		'6-10': 0,
		'11-15': 0,
		'16-20': 0,
		'20+': 0,
	};

	characters.forEach((character) => {
		const level = character.level;
		if (level <= 5) levelRanges['1-5']++;
		else if (level <= 10) levelRanges['6-10']++;
		else if (level <= 15) levelRanges['11-15']++;
		else if (level <= 20) levelRanges['16-20']++;
		else levelRanges['20+']++;
	});

	// Estadísticas de asociaciones usando las estadísticas pre-calculadas
	const totalAssociations = characters.reduce(
		(sum, character) => sum + (character.statistics?.totalAssociations || 0),
		0
	);

	const avgAssociations = totalCharacters > 0 ? totalAssociations / totalCharacters : 0;

	// Power level promedio
	const avgPowerLevel =
		totalCharacters > 0
			? characters.reduce((sum, character) => sum + (character.statistics?.powerLevel || 0), 0) / totalCharacters
			: 0;

	// Distribución por rareza
	const rarityDistribution: Record<string, number> = {
		common: 0,
		uncommon: 0,
		rare: 0,
		epic: 0,
		legendary: 0,
	};

	characters.forEach((character) => {
		const rarity = character.statistics?.rarityLevel || 'common';
		rarityDistribution[rarity]++;
	});

	return {
		totalCharacters,
		totalFavorites,
		favoritePercentage: totalCharacters > 0 ? (totalFavorites / totalCharacters) * 100 : 0,
		classCounts,
		raceCounts,
		levelRanges,
		totalAssociations,
		avgAssociations,
		avgPowerLevel,
		rarityDistribution,
		lastUpdated: new Date(),
	};
}

/**
 * 🎭 Compara dos personajes para ordenamiento
 * @param a Primer personaje
 * @param b Segundo personaje
 * @param sortBy Criterio de comparación
 * @returns Número de comparación
 */
export function compareCharacters(
	a: CharacterWithStats,
	b: CharacterWithStats,
	sortBy: CharacterSortOption = CharacterSortOption.NAME_ASC
): number {
	switch (sortBy) {
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
			return 0;
	}
}

/**
 * 🎭 Obtiene el nivel como número
 * @param character Personaje
 * @returns Nivel numérico
 */
export function getCharacterLevelAsNumber(character: CharacterWithStats): number {
	return character.level || 1;
}

/**
 * 🎭 Verifica si un personaje coincide con la búsqueda
 * @param character Personaje
 * @param searchTerm Término de búsqueda
 * @returns true si coincide
 */
export function matchesCharacterSearch(character: CharacterWithStats, searchTerm: string): boolean {
	const normalizedTerm = searchTerm.toLowerCase();

	return (
		character.name.toLowerCase().includes(normalizedTerm) ||
		character.description?.toLowerCase().includes(normalizedTerm) ||
		character.class.toLowerCase().includes(normalizedTerm) ||
		character.race.toLowerCase().includes(normalizedTerm) ||
		character.alignment.toLowerCase().includes(normalizedTerm) ||
		character.category?.toLowerCase().includes(normalizedTerm) ||
		character.backstory.toLowerCase().includes(normalizedTerm)
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
		'#FF6B6B',
		'#4ECDC4',
		'#45B7D1',
		'#96CEB4',
		'#FFEAA7',
		'#DDA0DD',
		'#98D8C8',
		'#F7DC6F',
		'#BB8FCE',
		'#85C1E9',
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 🎭 Genera un emoji aleatorio para un personaje
 * @returns Emoji string
 */
export function generateCharacterEmoji(): string {
	const emojis = [
		'🧙‍♂️',
		'⚔️',
		'🏹',
		'🛡️',
		'🗡️',
		'🎭',
		'👑',
		'🔮',
		'⚡',
		'🌟',
		'🐉',
		'🦄',
		'🧝‍♀️',
		'🧝‍♂️',
		'🧚‍♀️',
		'🧚‍♂️',
		'🧞‍♂️',
		'🧞‍♀️',
		'👹',
		'👺',
	];
	return emojis[Math.floor(Math.random() * emojis.length)];
}
