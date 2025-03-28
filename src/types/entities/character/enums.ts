/**
 * @file Enumeraciones y constantes para la entidad Character
 * @module types/entities/character/enums
 */

/**
 * Clases predefinidas para los personajes
 */
export enum CharacterClass {
	WARRIOR = 'warrior',
	MAGE = 'mage',
	ROGUE = 'rogue',
	CLERIC = 'cleric',
	RANGER = 'ranger',
	BARD = 'bard',
	PALADIN = 'paladin',
	DRUID = 'druid',
	MONK = 'monk',
	WARLOCK = 'warlock',
	SORCERER = 'sorcerer',
	BARBARIAN = 'barbarian',
	ARTIFICER = 'artificer',
	UNKNOWN = 'unknown',
}

/**
 * Razas predefinidas para los personajes
 */
export enum CharacterRace {
	HUMAN = 'human',
	ELF = 'elf',
	DWARF = 'dwarf',
	HALFLING = 'halfling',
	GNOME = 'gnome',
	HALF_ELF = 'half-elf',
	HALF_ORC = 'half-orc',
	TIEFLING = 'tiefling',
	DRAGONBORN = 'dragonborn',
	ORC = 'orc',
	GOBLIN = 'goblin',
	FAIRY = 'fairy',
	ANDROID = 'android',
	ALIEN = 'alien',
	UNKNOWN = 'unknown',
}

/**
 * Alineamientos predefinidos para los personajes
 */
export enum CharacterAlignment {
	LAWFUL_GOOD = 'lawful-good',
	NEUTRAL_GOOD = 'neutral-good',
	CHAOTIC_GOOD = 'chaotic-good',
	LAWFUL_NEUTRAL = 'lawful-neutral',
	TRUE_NEUTRAL = 'true-neutral',
	CHAOTIC_NEUTRAL = 'chaotic-neutral',
	LAWFUL_EVIL = 'lawful-evil',
	NEUTRAL_EVIL = 'neutral-evil',
	CHAOTIC_EVIL = 'chaotic-evil',
	NEUTRAL = 'neutral',
}

/**
 * Categorías predefinidas para los personajes
 */
export enum CharacterCategory {
	PROTAGONIST = 'protagonist',
	ANTAGONIST = 'antagonist',
	ALLY = 'ally',
	VILLAIN = 'villain',
	MENTOR = 'mentor',
	SIDEKICK = 'sidekick',
	ANTIHERO = 'antihero',
	SUPPORTING = 'supporting',
	HISTORICAL = 'historical',
	MYTHOLOGICAL = 'mythological',
	FICTIONAL = 'fictional',
	OTHER = 'other',
}

/**
 * Tipos de relaciones entre personajes
 */
export enum CharacterRelationshipType {
	FRIEND = 'friend',
	ENEMY = 'enemy',
	FAMILY = 'family',
	LOVER = 'lover',
	MENTOR = 'mentor',
	RIVAL = 'rival',
	ALLY = 'ally',
	COMPANION = 'companion',
	ACQUAINTANCE = 'acquaintance',
	UNKNOWN = 'unknown',
}

/**
 * Opciones para ordenar personajes
 */
export enum CharacterSortOption {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	LEVEL_ASC = 'level_asc',
	LEVEL_DESC = 'level_desc',
	CLASS_ASC = 'class_asc',
	CLASS_DESC = 'class_desc',
	RACE_ASC = 'race_asc',
	RACE_DESC = 'race_desc',
	DATE_ASC = 'date_asc',
	DATE_DESC = 'date_desc',
}

/**
 * Mapa de colores sugeridos por clase
 */
export const CHARACTER_CLASS_COLORS: Record<CharacterClass, string> = {
	[CharacterClass.WARRIOR]: '#C62828', // Rojo oscuro
	[CharacterClass.MAGE]: '#303F9F', // Azul índigo
	[CharacterClass.ROGUE]: '#827717', // Verde oliva
	[CharacterClass.CLERIC]: '#FFEB3B', // Amarillo
	[CharacterClass.RANGER]: '#2E7D32', // Verde bosque
	[CharacterClass.BARD]: '#6A1B9A', // Morado
	[CharacterClass.PALADIN]: '#FFC107', // Ámbar
	[CharacterClass.DRUID]: '#004D40', // Verde azulado
	[CharacterClass.MONK]: '#F57F17', // Ámbar oscuro
	[CharacterClass.WARLOCK]: '#4A148C', // Púrpura oscuro
	[CharacterClass.SORCERER]: '#C2185B', // Rosa oscuro
	[CharacterClass.BARBARIAN]: '#BF360C', // Naranja profundo
	[CharacterClass.ARTIFICER]: '#0097A7', // Cian
	[CharacterClass.UNKNOWN]: '#607D8B', // Gris azulado
};

/**
 * Mapa de emojis sugeridos por clase
 */
export const CHARACTER_CLASS_EMOJIS: Record<CharacterClass, string> = {
	[CharacterClass.WARRIOR]: '⚔️',
	[CharacterClass.MAGE]: '🔮',
	[CharacterClass.ROGUE]: '🗡️',
	[CharacterClass.CLERIC]: '✨',
	[CharacterClass.RANGER]: '🏹',
	[CharacterClass.BARD]: '🎭',
	[CharacterClass.PALADIN]: '🛡️',
	[CharacterClass.DRUID]: '🌿',
	[CharacterClass.MONK]: '👊',
	[CharacterClass.WARLOCK]: '📜',
	[CharacterClass.SORCERER]: '🌟',
	[CharacterClass.BARBARIAN]: '🪓',
	[CharacterClass.ARTIFICER]: '⚙️',
	[CharacterClass.UNKNOWN]: '❓',
};
