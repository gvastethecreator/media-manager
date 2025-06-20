/**
 * @file Funciones de utilidad para la entidad Character
 * @module utils/character/helpers
 */

import { v4 as uuidv4 } from 'uuid';
// Importación comentada porque las funciones no existen actualmente
// import { getSuggestedAppearance, serializeObject } from '@/transformers/character';
import {
    CharacterBase,
    CharacterCategory,
    CharacterClass,
    CharacterExtended,
    CharacterRace,
    CharacterRelationship,
    CharacterRelationshipType,
    CharacterSortOption
} from '@/types/entities/character';

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
	// Lógica comentada que dependía de getSuggestedAppearance
	// const characterClass = (overrides.class?.toLowerCase() || 'warrior') as CharacterClass;
	// const { color, emoji } = getSuggestedAppearance(characterClass);

	// Valores por defecto temporales para color y emoji
	const color = '#CCCCCC';
	const emoji = '👤';

	const now = new Date();

	return {
		id: overrides.id || generateCharacterId(),
		name: overrides.name || 'New Character',
		emoji: overrides.emoji || emoji,
		color: overrides.color || color,
		description: overrides.description || null,
		shortcut: overrides.shortcut || null,
		category: overrides.category || null,
		level: overrides.level || 1,
		class: overrides.class || 'warrior',
		race: overrides.race || 'human',
		type: overrides.type || null,
		alignment: overrides.alignment || 'true neutral',
		backstory: overrides.backstory || '',
		stats: overrides.stats || '{}',
		psychologicalProfile: overrides.psychologicalProfile || '',
		socialProfile: overrides.socialProfile || '',
		relationships: overrides.relationships || '[]',
		goals: overrides.goals || '[]',
		fears: overrides.fears || '[]',
		beliefs: overrides.beliefs || '[]',
		personality: overrides.personality || '[]',
		skills: overrides.skills || '[]',
		abilities: overrides.abilities || '[]',
		sortBy: overrides.sortBy || '',
		filters: overrides.filters || '[]',
		featuredImage: overrides.featuredImage || null,
		isFavorite: overrides.isFavorite || false,
		createdAt: overrides.createdAt || now,
		updatedAt: overrides.updatedAt || now,
	};
}

/**
 * Prepara una cadena de búsqueda para comparar personajes
 * @param character Personaje a preparar para búsqueda
 * @returns Cadena con datos normalizados para búsqueda
 */
export function prepareCharacterSearchString(character: CharacterExtended): string {
	return [
		character.name,
		character.class,
		character.race,
		character.alignment,
		character.category,
		character.emoji,
	]
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
export function matchesCharacterSearch(character: CharacterExtended, searchTerm: string): boolean {
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
export function getCharacterLevelAsNumber(character: CharacterExtended): number {
	if (typeof character.level === 'number') {
		return character.level;
	}

	if (typeof character.level === 'string') {
		const parsedLevel = Number.parseInt(character.level, 10);
		return Number.isNaN(parsedLevel) ? 1 : parsedLevel;
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
	characterA: CharacterExtended,
	characterB: CharacterExtended,
	sortBy: CharacterSortOption = CharacterSortOption.NAME_ASC
): number {
	switch (sortBy) {
		case CharacterSortOption.NAME_ASC:
			return characterA.name.localeCompare(characterB.name);
		case CharacterSortOption.NAME_DESC:
			return characterB.name.localeCompare(characterA.name);
		case CharacterSortOption.LEVEL_ASC:
			return getCharacterLevelAsNumber(characterA) - getCharacterLevelAsNumber(characterB);
		case CharacterSortOption.LEVEL_DESC:
			return getCharacterLevelAsNumber(characterB) - getCharacterLevelAsNumber(characterA);
		case CharacterSortOption.CLASS_ASC:
			return (characterA.class || '').localeCompare(characterB.class || '');
		case CharacterSortOption.CLASS_DESC:
			return (characterB.class || '').localeCompare(characterA.class || '');
		case CharacterSortOption.RACE_ASC:
			return (characterA.race || '').localeCompare(characterB.race || '');
		case CharacterSortOption.RACE_DESC:
			return (characterB.race || '').localeCompare(characterA.race || '');
		case CharacterSortOption.DATE_ASC:
			return new Date(characterA.createdAt).getTime() - new Date(characterB.createdAt).getTime();
		case CharacterSortOption.DATE_DESC:
			return new Date(characterB.createdAt).getTime() - new Date(characterA.createdAt).getTime();
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
	characters: CharacterExtended[]
): Record<string, CharacterExtended[]> {
	const groups: Record<string, CharacterExtended[]> = {};

	// Inicializar todas las categorías
	for (const category of Object.values(CharacterCategory)) {
		groups[category] = [];
	}

	// Agrupar personajes
	for (const character of characters) {
		const category = character.category || 'other';
		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(character);
	}

	return groups;
}

/**
 * Agrupa los personajes por clase
 * @param characters Personajes a agrupar
 * @returns Mapa con personajes agrupados por clase
 */
export function groupCharactersByClass(
	characters: CharacterExtended[]
): Record<string, CharacterExtended[]> {
	const groups: Record<string, CharacterExtended[]> = {};

	// Inicializar todas las clases
	for (const characterClass of Object.values(CharacterClass)) {
		groups[characterClass] = [];
	}

	// Agrupar personajes
	for (const character of characters) {
		const characterClass = character.class || 'unknown';
		if (!groups[characterClass]) {
			groups[characterClass] = [];
		}
		groups[characterClass].push(character);
	}

	return groups;
}

/**
 * Agrupa los personajes por raza
 * @param characters Personajes a agrupar
 * @returns Mapa con personajes agrupados por raza
 */
export function groupCharactersByRace(
	characters: CharacterExtended[]
): Record<string, CharacterExtended[]> {
	const groups: Record<string, CharacterExtended[]> = {};

	// Inicializar todas las razas
	for (const race of Object.values(CharacterRace)) {
		groups[race] = [];
	}

	// Agrupar personajes
	for (const character of characters) {
		const race = character.race || 'unknown';
		if (!groups[race]) {
			groups[race] = [];
		}
		groups[race].push(character);
	}

	return groups;
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

	return JSON.stringify(modifiedStats);
}

// Lógica comentada que dependía de serializeObject
// /**
//  * Serializa un objeto para guardarlo como JSON en la base de datos
//  * @param obj Objeto a serializar
//  * @returns Cadena JSON del objeto
//  */
// export function serializeCharacterData<T>(obj: T): string {
// 	return serializeObject(obj); // Usando la función de transformer
// }
