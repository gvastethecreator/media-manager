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
	CharacterSortOption,
	CharacterSummary,
} from '@/types/entities/character';
import { CharacterRelationshipType } from '@/types/entities/character/enums';

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
		id: (overrides as any).id || generateCharacterId(),
		name: (overrides as any).name || 'New Character',
		emoji: (overrides as any).emoji || emoji,
		color: (overrides as any).color || color,
		description: (overrides as any).description || '',
		shortcut: (overrides as any).shortcut || null,
		level: (overrides as any).level || 1,
		class: (overrides as any).class || 'warrior',
		race: (overrides as any).race || 'human',
		alignment: (overrides as any).alignment || 'true neutral',
		backstory: (overrides as any).backstory || '',
		stats: (overrides as any).stats || '{}',
		sortBy: (overrides as any).sortBy || null,
		filters: (overrides as any).filters || '[]',
		psychologicalProfile: (overrides as any).psychologicalProfile || null,
		socialProfile: (overrides as any).socialProfile || null,
		relationships: (overrides as any).relationships || '[]',
		goals: (overrides as any).goals || '[]',
		fears: (overrides as any).fears || '[]',
		beliefs: (overrides as any).beliefs || '[]',
		personality: (overrides as any).personality || '[]',
		featuredImage: (overrides as any).featuredImage || null,
		isFavorite: (overrides as any).isFavorite || false,
		createdAt: (overrides as any).createdAt || now,
		updatedAt: (overrides as any).updatedAt || now,
		category: (overrides as any).category || 'player',
		presetId: (overrides as any).presetId || null,
	};
}

/**
 * Prepara una cadena de búsqueda para comparar personajes
 * @param character Personaje a preparar para búsqueda
 * @returns Cadena con datos normalizados para búsqueda
 */
export function prepareCharacterSearchString(character: CharacterExtended | CharacterSummary): string {
	return [
		(character as any).name,
		(character as any).class,
		(character as any).race,
		(character as any).alignment,
		(character as any).category,
		(character as any).emoji,
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
	for (const category of Object.values(CharacterCategory)) {
		groups[category] = [];
	}

	// Agrupar personajes
	for (const character of characters) {
		const category = (character as { category?: string }).category || 'other';
		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(character);
	}

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
	for (const characterClass of Object.values(CharacterClass) as CharacterClass[]) {
		groups[characterClass] = [];
	}

	// Agrupar personajes
	for (const character of characters) {
		const characterClass = (character as { class?: string }).class || 'unknown';
		if (!groups[characterClass]) {
			groups[characterClass] = [];
		}
		groups[characterClass].push(character);
	}

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
	for (const race of Object.values(CharacterRace) as CharacterRace[]) {
		groups[race] = [];
	}

	// Agrupar personajes
	for (const character of characters) {
		const race = (character as { race?: string }).race || 'unknown';
		if (!groups[race]) {
			groups[race] = [];
		}
		groups[race].push(character);
	}

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
