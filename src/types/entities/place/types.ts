/**
 * @file Tipos canónicos para la entidad Place
 * @module types/entities/place/types
 * @description Define las estructuras de datos, inputs y tipos para la entidad Place.
 */

import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
import type { ConceptComplete } from '../concept';
import type { GroupComplete } from '../group';
import type { ImageComplete } from '../image';
import type { NoteComplete } from '../note';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagComplete } from '../tag';
import type { VideoComplete } from '../video';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';

export interface PlaceBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;

	// Atributos del lugar
	region: string;
	type: string;
	climate: string;
	population: number;
	government: string;
	lore: string;
	history: string;

	// Campos JSON como strings
	filters: string | null;
	dangers: string | null;
	resources: string | null;
	stats: string | null;
}

/**
 * Tipos para los campos JSON serializados en el modelo Place
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
	abundance: number;
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

/**
 * 🗺️ Tipo completo para Place con todas las relaciones y campos JSON deserializados.
 */
export interface PlaceComplete {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;

	// Atributos del lugar
	region: string;
	type: string;
	climate: string;
	population: number;
	government: string;
	lore: string;
	history: string;

	// Campos JSON deserializados
	filters: Record<string, any> | null;
	dangers: PlaceDanger[];
	resources: PlaceResource[];
	stats: PlaceStats | null;

	// Relaciones
	images?: ImageComplete[];
	videos?: VideoComplete[];
	albums?: AlbumComplete[];
	collections?: CollectionComplete[];
	tags?: TagComplete[];
	characters?: CharacterComplete[];
	worldItems?: WorldItemComplete[];
	concepts?: ConceptComplete[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardComplete[];
	properties?: PropertyComplete[];
	groups?: GroupComplete[];

	// Conteos
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * 📍 Tipo para items en listados de lugares.
 */
export interface PlaceListItem {
	id: string;
	name: string;
	emoji: string;
	color: string;
	category: string | null;
	type: string;
	isFavorite: boolean;
	itemType: 'place';
}

/**
 * ➕ Input para crear un nuevo lugar.
 */
export interface PlaceCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy?: string;
	region?: string;
	type?: string;
	climate?: string;
	population?: number;
	government?: string;
	lore?: string;
	history?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;

	// Campos JSON
	filters?: Record<string, any>;
	dangers?: PlaceDanger[];
	resources?: PlaceResource[];
	stats?: PlaceStats;

	// IDs de relaciones
	imageIds?: string[];
	videoIds?: string[];
	albumIds?: string[];
	collectionIds?: string[];
	tagIds?: string[];
	characterIds?: string[];
	worldItemIds?: string[];
	conceptIds?: string[];
	promptIds?: string[];
	noteIds?: string[];
	wildcardIds?: string[];
	propertyIds?: string[];
	groupIds?: string[];
}

/**
 * 🔄 Input para actualizar un lugar existente.
 */
export type PlaceUpdateInput = Partial<PlaceCreateInput>;

/**
 * 🔍 Opciones para buscar y filtrar lugares.
 */
export interface PlaceSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: {
		search?: string;
		category?: string;
		type?: string;
		region?: string;
		isFavorite?: boolean;
		tags?: string[];
		characters?: string[];
		minImageCount?: number;
	};
	includeRelations?: boolean;
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

export enum PlaceSortCriteria {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	UPDATED_ASC = 'updatedAt_asc',
	UPDATED_DESC = 'updatedAt_desc',
	CREATED_ASC = 'createdAt_asc',
	CREATED_DESC = 'createdAt_desc',
	POPULATION_ASC = 'population_asc',
	POPULATION_DESC = 'population_desc',
}

export enum PlaceViewMode {
	GRID = 'grid',
	LIST = 'list',
	MAP = 'map',
	CARD = 'card',
}
