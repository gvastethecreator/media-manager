/**
 * @file Tipos canónicos para la entidad Character
 * @module types/entities/character/types
 * @description Estructura unificada y validada para Character, siguiendo las mejores prácticas.
 */

/**
 * 🧑‍🎤 Tipo base para un personaje.
 * Contiene todos los campos primitivos y datos serializados en JSON.
 * ⚠️ Definición canónica sin dependencias de Prisma
 */
export interface CharacterBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string;
	color: string;
	shortcut: string | null;
	category: string | null;
	level: number;
	class: string;
	race: string;
	type: string | null;
	alignment: string;
	backstory: string;
	// Campos JSON serializados como strings en Prisma
	stats: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	skills: string;
	abilities: string;
	// Configuración
	sortBy: string;
	filters: string;
	// Propiedades de visualización
	featuredImage: string | null;
	isFavorite: boolean;
	// Timestamps
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🧑‍🎤 Tipo extendido para un personaje con datos adicionales de UI.
 * Incluye propiedades que no se persisten en la base de datos.
 */
export interface CharacterExtended extends CharacterBase {
	// Estados de UI (no persistidos)
	isHovered?: boolean;
	isOpen?: boolean;
	isLoading?: boolean;
	hasError?: boolean;
	// Datos calculados
	imageCount?: number;
	tagCount?: number;
	groupCount?: number;
	propertyCount?: number;
}

/**
 * 🧑‍🎤 Input para crear un nuevo personaje.
 * Las relaciones se especifican mediante arrays de IDs.
 */
export interface CharacterCreateInput {
	// Campos requeridos
	name: string;
	emoji: string;
	color: string;
	level: number;
	class: string;
	race: string;
	alignment: string;
	backstory: string;
	stats: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	skills: string;
	abilities: string;
	sortBy: string;
	filters: string;

	// Campos opcionales
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	type?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;

	// IDs de relaciones
	imageIds?: string[];
	tagIds?: string[];
	groupIds?: string[];
	propertyIds?: string[];
}

/**
 * 🧑‍🎤 Input para actualizar un personaje existente.
 * Todos los campos son opcionales.
 */
export interface CharacterUpdateInput extends Partial<CharacterCreateInput> {}

/**
 * 🧑‍🎤 Relaciones de un personaje con otras entidades.
 * Utiliza los tipos `Base` de las entidades relacionadas para evitar dependencias circulares complejas.
 */
export interface CharacterRelations {
	// Se deben importar los tipos Base de otras entidades aquí si es necesario
	// Por ahora, usamos un marcador de posición para evitar errores de importación.
	images?: unknown[];
	tags?: unknown[];
	groups?: unknown[];
	properties?: unknown[];
}

/**
 * 🧑‍🎤 Conteos de las relaciones de un personaje.
 */
export interface CharacterCounts {
	_count?: {
		images?: number;
		tags?: number;
		groups?: number;
		properties?: number;
	};
}

/**
 * 🧑‍🎤 Tipo completo de un personaje, incluyendo relaciones y conteos.
 */
export interface CharacterComplete extends CharacterBase, CharacterRelations, CharacterCounts {}

// Alias para mantener consistencia con otros módulos
export type CharacterWithRelations = CharacterComplete;
export type CreateCharacterData = CharacterCreateInput;
export type UpdateCharacterData = CharacterUpdateInput;

/**
 * 🧑‍🎤 Opciones de ordenamiento para personajes.
 */
export type CharacterSortOption =
	| 'name_asc'
	| 'name_desc'
	| 'created_asc'
	| 'created_desc'
	| 'updated_asc'
	| 'updated_desc'
	| 'level_asc'
	| 'level_desc'
	| 'category_asc'
	| 'category_desc';

/**
 * 🧑‍🎤 Tipos de alineamiento para personajes.
 */
export type CharacterAlignment =
	| 'lawful_good'
	| 'neutral_good'
	| 'chaotic_good'
	| 'lawful_neutral'
	| 'true_neutral'
	| 'chaotic_neutral'
	| 'lawful_evil'
	| 'neutral_evil'
	| 'chaotic_evil';

/**
 * 🧑‍🎤 Tipos de categoría para personajes.
 */
export type CharacterCategory =
	| 'hero'
	| 'villain'
	| 'neutral'
	| 'ally'
	| 'enemy'
	| 'npc'
	| 'main'
	| 'secondary'
	| 'background';

/**
 * 🧑‍🎤 Tipos de clase para personajes.
 */
export type CharacterClass =
	| 'warrior'
	| 'mage'
	| 'rogue'
	| 'cleric'
	| 'ranger'
	| 'paladin'
	| 'barbarian'
	| 'bard'
	| 'druid'
	| 'monk'
	| 'sorcerer'
	| 'warlock'
	| 'wizard'
	| 'artificer'
	| 'other';

/**
 * 🧑‍🎤 Tipos de raza para personajes.
 */
export type CharacterRace =
	| 'human'
	| 'elf'
	| 'dwarf'
	| 'halfling'
	| 'dragonborn'
	| 'gnome'
	| 'half_elf'
	| 'half_orc'
	| 'tiefling'
	| 'orc'
	| 'goblin'
	| 'kobold'
	| 'other';

/**
 * 🧑‍🎤 Estructura de un filtro para personajes.
 */
export interface CharacterFilter {
	field: string;
	operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn';
	value: unknown;
}

/**
 * 🧑‍🎤 Estructura de un filtro individual para personajes (usado en el store).
 */
export interface CharacterFilterItem {
	query: 'class' | 'race' | 'category' | 'alignment' | 'isFavorite' | 'level' | 'level_min' | 'level_max';
	value: string | number | boolean;
}

/**
 * 🧑‍🎤 Filtros para buscar personajes.
 */
export interface CharacterFilters {
	search?: string;
	level?: { min?: number; max?: number };
	class?: string[];
	race?: string[];
	alignment?: string[];
	category?: string[];
	isFavorite?: boolean;
	tagIds?: string[];
}

/**
 * 🧑‍🎤 Configuración de visualización para personajes.
 */
export interface CharacterViewConfig {
	mode: 'grid' | 'list' | 'table';
	gridColumns: number;
	cardSize: 'small' | 'medium' | 'large';
	showStats: boolean;
	showDescription: boolean;
	defaultView: 'cards' | 'details' | 'compact';
}

/**
 * 🧑‍🎤 Opciones para las consultas de búsqueda de personajes.
 */
export interface CharacterSearchOptions {
	skip?: number;
	take?: number;
	// Ordenamiento - se pueden usar propiedades básicas
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: CharacterFilters;
	// Inclusión - se pueden especificar relaciones a incluir
	include?: Record<string, boolean>;
}

/**
 * 🧑‍🎤 Estructura de una relación entre personajes.
 */
export interface CharacterRelationship {
	id: string;
	targetId: string;
	targetName: string;
	type: string;
	strength: number;
	description?: string;
}

/**
 * 🧑‍🎤 Estadísticas de un personaje.
 */
export interface CharacterStats {
	strength?: number;
	dexterity?: number;
	constitution?: number;
	intelligence?: number;
	wisdom?: number;
	charisma?: number;
	[key: string]: number | undefined;
}
