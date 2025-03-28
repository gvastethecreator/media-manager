/**
 * @file Funciones de utilidad para la entidad Character
 * @module utils/character/helpers
 */

import { getSuggestedAppearance, serializeObject } from '@/transformers/character';
import type {
	CharacterBase,
	CharacterCategory,
	CharacterClass,
	CharacterExtended,
	CharacterRace,
	CharacterRelationship,
	CharacterSortOption,
	CharacterSummary,
} from '@/types/entities/character';
import { CharacterRelationshipType } from '@/types/entities/character/enums';
import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un ID único para un nuevo personaje
 * @returns String con ID único
 */
export function generateCharacterId(): string {
	return uuidv4();
}

/**
 * Crea un nuevo personaje con valores por defecto
 * @param overrides Valores opcionales para sobrescribir los predeterminados
 * @returns Objeto Character con valores predeterminados
 */
export function createNewCharacter(overrides: Partial<CharacterBase> = {}): CharacterBase {
	const characterClass = (overrides.class?.toLowerCase() || 'warrior') as CharacterClass;
	const { color, emoji } = getSuggestedAppearance(characterClass);

	const now = new Date();

	return {
		id: overrides.id || generateCharacterId(),
		name: overrides.name || 'New Character',
		emoji: overrides.emoji || emoji,
		color: overrides.color || color,
		description: overrides.description || '',
		shortcut: overrides.shortcut || null,
		level: overrides.level || 1,
		class: overrides.class || 'warrior',
		race: overrides.race || 'human',
		alignment: overrides.alignment || 'true neutral',
		backstory: overrides.backstory || '',
		stats: overrides.stats || '{}',
		sortBy: overrides.sortBy || null,
		filters: overrides.filters || 'empty_array',
		psychologicalProfile: overrides.psychologicalProfile || null,
		socialProfile: overrides.socialProfile || null,
		relationships: overrides.relationships || 'empty_array',
		goals: overrides.goals || 'empty_array',
		fears: overrides.fears || 'empty_array',
		beliefs: overrides.beliefs || 'empty_array',
		personality: overrides.personality || 'empty_array',
		featuredImage: overrides.featuredImage || null,
		isFavorite: overrides.isFavorite || false,
		createdAt: overrides.createdAt || now,
		updatedAt: overrides.updatedAt || now,
		category: overrides.category || 'player',
		presetId: overrides.presetId || null,
	};
}

/**
 * Prepara una cadena de búsqueda para comparar personajes
 * @param character Personaje a preparar para búsqueda
 * @returns Cadena con datos normalizados para búsqueda
 */
export function prepareCharacterSearchString(character: CharacterExtended | CharacterSummary): string {
	return [character.name, character.class, character.race, character.alignment, character.category, character.emoji]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
}

/**
 * Verifica si un personaje coincide con el término de búsqueda
 * @param character Personaje a verificar
 * @param searchTerm Término de búsqueda
 * @returns true si el personaje coincide, false en caso contrario
 */
export function matchesCharacterSearch(character: CharacterExtended | CharacterSummary, searchTerm: string): boolean {
	if (!searchTerm || searchTerm.trim() === '') {
		return true;
	}

	const searchString = prepareCharacterSearchString(character);
	const normalizedSearchTerm = searchTerm.toLowerCase().trim();

	return searchString.includes(normalizedSearchTerm);
}

/**
 * Obtiene el nivel numérico de un personaje
 * @param character Personaje del que obtener nivel
 * @returns Nivel numérico del personaje (predeterminado: 1)
 */
export function getCharacterLevelAsNumber(character: CharacterExtended | CharacterSummary): number {
	if (typeof character.level === 'number') {
		return character.level;
	}

	if (typeof character.level === 'string') {
		const parsedLevel = Number.parseInt(character.level, 10);
		return isNaN(parsedLevel) ? 1 : parsedLevel;
	}

	return 1;
}

/**
 * Compara dos personajes para ordenarlos
 * @param characterA Primer personaje a comparar
 * @param characterB Segundo personaje a comparar
 * @param sortBy Opción de ordenamiento
 * @returns Número negativo, cero o positivo para ordenamiento
 */
export function compareCharacters(
	characterA: CharacterExtended | CharacterSummary,
	characterB: CharacterExtended | CharacterSummary,
	sortBy: CharacterSortOption = 'name_asc'
): number {
	switch (sortBy) {
		case 'name_asc':
			return characterA.name.localeCompare(characterB.name);
		case 'name_desc':
			return characterB.name.localeCompare(characterA.name);
		case 'level_asc':
			return getCharacterLevelAsNumber(characterA) - getCharacterLevelAsNumber(characterB);
		case 'level_desc':
			return getCharacterLevelAsNumber(characterB) - getCharacterLevelAsNumber(characterA);
		case 'class_asc':
			return (characterA.class || '').localeCompare(characterB.class || '');
		case 'class_desc':
			return (characterB.class || '').localeCompare(characterA.class || '');
		case 'race_asc':
			return (characterA.race || '').localeCompare(characterB.race || '');
		case 'race_desc':
			return (characterB.race || '').localeCompare(characterA.race || '');
		case 'created_asc':
			return new Date(characterA.createdAt).getTime() - new Date(characterB.createdAt).getTime();
		case 'created_desc':
			return new Date(characterB.createdAt).getTime() - new Date(characterA.createdAt).getTime();
		case 'favorites_first':
			return Number(characterB.isFavorite) - Number(characterA.isFavorite);
		default:
			return 0;
	}
}

/**
 * Agrupa los personajes por categoría
 * @param characters Personajes a agrupar
 * @returns Mapa con personajes agrupados por categoría
 */
export function groupCharactersByCategory(
	characters: (CharacterExtended | CharacterSummary)[]
): Record<CharacterCategory, (CharacterExtended | CharacterSummary)[]> {
	const groups: Record<string, (CharacterExtended | CharacterSummary)[]> = {};

	// Inicializar todas las categorías
	Object.values(CharacterCategory).forEach((category) => {
		groups[category] = [];
	});

	// Agrupar personajes
	characters.forEach((character) => {
		const category = character.category || 'other';
		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(character);
	});

	return groups as Record<CharacterCategory, (CharacterExtended | CharacterSummary)[]>;
}

/**
 * Agrupa los personajes por clase
 * @param characters Personajes a agrupar
 * @returns Mapa con personajes agrupados por clase
 */
export function groupCharactersByClass(
	characters: (CharacterExtended | CharacterSummary)[]
): Record<CharacterClass, (CharacterExtended | CharacterSummary)[]> {
	const groups: Record<string, (CharacterExtended | CharacterSummary)[]> = {};

	// Inicializar todas las clases
	Object.values(CharacterClass).forEach((characterClass) => {
		groups[characterClass] = [];
	});

	// Agrupar personajes
	characters.forEach((character) => {
		const characterClass = character.class || 'unknown';
		if (!groups[characterClass]) {
			groups[characterClass] = [];
		}
		groups[characterClass].push(character);
	});

	return groups as Record<CharacterClass, (CharacterExtended | CharacterSummary)[]>;
}

/**
 * Agrupa los personajes por raza
 * @param characters Personajes a agrupar
 * @returns Mapa con personajes agrupados por raza
 */
export function groupCharactersByRace(
	characters: (CharacterExtended | CharacterSummary)[]
): Record<CharacterRace, (CharacterExtended | CharacterSummary)[]> {
	const groups: Record<string, (CharacterExtended | CharacterSummary)[]> = {};

	// Inicializar todas las razas
	Object.values(CharacterRace).forEach((race) => {
		groups[race] = [];
	});

	// Agrupar personajes
	characters.forEach((character) => {
		const race = character.race || 'unknown';
		if (!groups[race]) {
			groups[race] = [];
		}
		groups[race].push(character);
	});

	return groups as Record<CharacterRace, (CharacterExtended | CharacterSummary)[]>;
}

/**
 * Crea una nueva relación entre personajes
 * @param targetCharacterId ID del personaje objetivo
 * @param targetCharacterName Nombre del personaje objetivo
 * @param type Tipo de relación
 * @param strength Fuerza de la relación (0-100)
 * @returns Objeto CharacterRelationship
 */
export function createCharacterRelationship(
	targetCharacterId: string,
	targetCharacterName: string,
	type: string = CharacterRelationshipType.ALLY,
	strength = 50
): CharacterRelationship {
	return {
		characterId: targetCharacterId,
		name: targetCharacterName,
		type: type,
		strength: Math.max(0, Math.min(100, strength)),
	};
}

/**
 * Prepara datos iniciales de estadísticas para personajes según su clase
 * @param characterClass Clase del personaje
 * @returns Objeto de estadísticas serializado como string
 */
export function prepareInitialStats(characterClass: CharacterClass): string {
	const baseStats = {
		strength: 10,
		dexterity: 10,
		constitution: 10,
		intelligence: 10,
		wisdom: 10,
		charisma: 10,
		hp: 20,
		maxHp: 20,
		ac: 10,
		initiative: 0,
		speed: 30,
	};

	const modifiedStats = { ...baseStats };

	// Modificar estadísticas según la clase
	switch (characterClass.toLowerCase()) {
		case 'warrior':
			modifiedStats.strength = 14;
			modifiedStats.constitution = 12;
			modifiedStats.hp = 25;
			modifiedStats.maxHp = 25;
			modifiedStats.ac = 16;
			break;
		case 'mage':
			modifiedStats.intelligence = 16;
			modifiedStats.wisdom = 12;
			modifiedStats.strength = 8;
			modifiedStats.hp = 15;
			modifiedStats.maxHp = 15;
			modifiedStats.ac = 11;
			break;
		case 'rogue':
			modifiedStats.dexterity = 16;
			modifiedStats.charisma = 12;
			modifiedStats.initiative = 3;
			modifiedStats.ac = 14;
			break;
		case 'ranger':
			modifiedStats.dexterity = 14;
			modifiedStats.wisdom = 12;
			modifiedStats.speed = 35;
			break;
		case 'cleric':
			modifiedStats.wisdom = 14;
			modifiedStats.charisma = 12;
			modifiedStats.ac = 14;
			break;
		case 'paladin':
			modifiedStats.strength = 12;
			modifiedStats.charisma = 14;
			modifiedStats.constitution = 12;
			modifiedStats.hp = 25;
			modifiedStats.maxHp = 25;
			modifiedStats.ac = 17;
			break;
		case 'bard':
			modifiedStats.charisma = 16;
			modifiedStats.dexterity = 12;
			modifiedStats.ac = 13;
			break;
		case 'druid':
			modifiedStats.wisdom = 16;
			modifiedStats.constitution = 12;
			modifiedStats.hp = 22;
			modifiedStats.maxHp = 22;
			break;
	}

	return serializeObject(modifiedStats);
}
