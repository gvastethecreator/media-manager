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
	[CharacterClass.WARRIOR]: 'var(--entity-class-warrior)',
	[CharacterClass.MAGE]: 'var(--entity-class-mage)',
	[CharacterClass.ROGUE]: 'var(--entity-class-rogue)',
	[CharacterClass.CLERIC]: 'var(--entity-class-cleric)',
	[CharacterClass.RANGER]: 'var(--entity-class-ranger)',
	[CharacterClass.BARD]: 'var(--entity-class-bard)',
	[CharacterClass.PALADIN]: 'var(--entity-class-paladin)',
	[CharacterClass.DRUID]: 'var(--entity-class-druid)',
	[CharacterClass.MONK]: 'var(--entity-class-monk)',
	[CharacterClass.WARLOCK]: 'var(--entity-class-warlock)',
	[CharacterClass.SORCERER]: 'var(--entity-class-sorcerer)',
	[CharacterClass.BARBARIAN]: 'var(--entity-class-barbarian)',
	[CharacterClass.ARTIFICER]: 'var(--entity-class-artificer)',
	[CharacterClass.UNKNOWN]: 'var(--entity-class-unknown)',
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
