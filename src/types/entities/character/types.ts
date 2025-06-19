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
 * 🧑‍🎤 Filtros para buscar personajes.
 */
export interface CharacterFilters {
	search?: string;
	level?: { min?: number; max?: number };
	class?: string[];
	race?: string[];
	alignment?: string[];
	isFavorite?: boolean;
	tagIds?: string[];
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
