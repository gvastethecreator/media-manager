/**
 * @file Tipos canónicos para la entidad Place
 * @module types/entities/place/types
 * @description Define las estructuras de datos, inputs de creación/actualización y filtros para la entidad Place.
 */

/**
 * 🗺️ Tipo base canónico para Place - CORREGIDO para coincidir exactamente con Prisma
 */
export interface PlaceBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	filters: string;
	// Atributos del lugar
	region: string;
	type: string;
	climate: string;
	population: number;
	government: string;
	// Características detalladas (JSON serializado)
	dangers: string;
	resources: string;
	lore: string;
	history: string;
	stats: string;
	// Propiedades de visualización
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🎯 Alias para compatibilidad
 */
export type Place = PlaceBase;

/**
 * 🛠️ Relaciones que puede tener un Lugar.
 * Define las entidades que pueden estar conectadas a un lugar.
 */
export interface PlaceRelationInput {
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
	groups?: { id: string }[];
}

/**
 * ➕ Input para crear un nuevo lugar.
 * Hereda los campos escalares y añade las relaciones opcionales.
 */
export interface PlaceCreateInput
	extends Omit<Place, 'id' | 'createdAt' | 'updatedAt' | 'dangers' | 'resources' | 'stats'>,
		PlaceRelationInput {
	dangers?: string;
	resources?: string;
	stats?: string;
}

/**
 * 🔄 Input para actualizar un lugar existente.
 * Permite actualizar campos escalares y conectar/desconectar relaciones.
 */
export interface PlaceUpdateInput extends Partial<Omit<Place, 'id' | 'createdAt' | 'updatedAt'>> {
	connect?: PlaceRelationInput;
	disconnect?: PlaceRelationInput;
}

/**
 * 🔍 Filtros para buscar y filtrar lugares.
 */
export interface PlaceFilters {
	search?: string;
	category?: string;
	type?: string;
	region?: string;
	isFavorite?: boolean;
	tags?: string[];
	characters?: string[];
	minImageCount?: number;
}

/**
 * ⚙️ Opciones para las consultas de búsqueda de lugares.
 * Incluye paginación, ordenación y filtros.
 */
export interface PlaceSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: PlaceFilters;
	include?: Record<string, boolean>;
}

/**
 * ✨ Tipo de un lugar con todas sus relaciones anidadas.
 * CORREGIDO: Solo incluye relaciones que existen en el esquema Prisma.
 */
export type PlaceWithRelations = Place & {
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
	groups?: { id: string }[];
};

/**
 * 🔢 Tipo de un lugar con los conteos de sus relaciones.
 */
export type PlaceWithCounts = Place & {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
};

/**
 * 🌟 Tipo completo de un lugar, con relaciones y conteos.
 */
export type PlaceComplete = PlaceWithRelations & PlaceWithCounts;

/**
/**
 * Tipos JSON utilizados en campos de lugar
 */
export interface PlaceDanger {
	name: string;
	description?: string;
	level: number;
	type: string;
}

export interface PlaceResource {
	name: string;
	description?: string;
	quantity: number;
	value: number;
	renewable: boolean;
}

export interface PlaceStats {
	economy: number;
	safety: number;
	culture: number;
	technology: number;
	magic?: number;
	influence?: number;
}

// Re-exportar enums si es necesario
export enum PlaceCategory {
	CIVILIZATION = 'civilization',
	NATURE = 'nature',
	MYSTICAL = 'mystical',
	HISTORICAL = 'historical',
	OTHER = 'other',
}

export enum PlaceType {
	CITY = 'city',
	TOWN = 'town',
	VILLAGE = 'village',
	FOREST = 'forest',
	MOUNTAIN = 'mountain',
	DESERT = 'desert',
	OCEAN = 'ocean',
	LAKE = 'lake',
	RIVER = 'river',
	ISLAND = 'island',
	CAVE = 'cave',
	RUIN = 'ruin',
	TEMPLE = 'temple',
	CASTLE = 'castle',
	OTHER = 'other',
}

export enum PlaceViewMode {
	GRID = 'grid',
	LIST = 'list',
	MAP = 'map',
	CARD = 'card',
}
