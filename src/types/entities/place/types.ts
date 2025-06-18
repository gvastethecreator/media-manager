/**
 * @file Tipos para la entidad Place
 * @module types/entities/place/types
 * @description Define los tipos relacionados con Place, adaptando el esquema de Prisma
 * para una mejor tipificación en la aplicación
 */

import type { z } from 'zod';
// Importación de tipos para relaciones
import type { PlaceSchema } from './schema';

/**
 * 🗺️ Tipos canónicos para la entidad Place
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Place.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - PlaceBase: tipo canónico principal
 * - PlaceRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - PlaceCreateInput, PlaceUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

/**
 * 🔄 Tipo base para Place
 */
export interface PlaceBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	region: string | null;
	type: string | null;
	climate: string | null;
	population: number | null;
	government: string | null;
	dangers: string | null;
	resources: string | null;
	lore: string | null;
	history: string | null;
	stats: string | null;
	sortBy: string;
	filters: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🏰 Interfaz para los peligros de un lugar
 */
export interface PlaceDanger {
	name: string;
	description?: string;
	level?: number;
}

/**
 * 🌟 Interfaz para los recursos de un lugar
 */
export interface PlaceResource {
	name: string;
	description?: string;
	abundance?: number;
}

/**
 * 📊 Interfaz para las estadísticas de un lugar
 */
export interface PlaceStat {
	name: string;
	value: number;
	maxValue?: number;
}

/**
 * 📊 Tipo para el objeto de estadísticas de un lugar
 */
export type PlaceStats = Record<string, number>;

/**
 * 🔍 Interfaz para filtros de búsqueda de lugares
 */
export interface PlaceFilters {
	searchQuery?: string;
	categories?: string[];
	regions?: string[];
	types?: string[];
	climates?: string[];
	populationRange?: {
		min?: number;
		max?: number;
	};
	governments?: string[];
	onlyFavorites?: boolean;
	hasImages?: boolean;
	hasNotes?: boolean;
	hasConcepts?: boolean;
	hasPrompts?: boolean;
}

/**
 * 🔗 Relaciones de Place
 */
// ⚠️ Limpieza: relaciones solo como any[] para evitar errores de tipos inexistentes
export interface PlaceRelations {
	albums?: any[];
	characters?: any[];
	collections?: any[];
	concepts?: any[];
	groups?: any[];
	images?: any[];
	notes?: any[];
	prompts?: any[];
	properties?: any[];
	tags?: any[];
	videos?: any[];
	wildcards?: any[];
	worldItems?: any[];
}

/**
 * 📊 Conteos de relaciones de Place
 */
export interface PlaceCounts {
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
 * 🔄 UI y campos extendidos
 */
export interface PlaceUI {
	// Propiedades de UI
	isSelected?: boolean;
	isExpanded?: boolean;
	isEditing?: boolean;
	isHighlighted?: boolean;

	// Datos derivados
	dangerLevel?: string;
	displayPopulation?: string;
	displaySize?: string;
	regionPath?: string[];
	recentImages?: (string | null)[];
}

/**
 * 🔄 Campos deserializados de Place
 */
export interface PlaceDeserialized {
	// Campos JSON deserializados
	dangersArray?: PlaceDanger[];
	resourcesArray?: PlaceResource[];
	statsObject?: PlaceStats;
	filtersObject?: PlaceFilters;
}

/**
 * 🔄 Place completo con todas las relaciones
 */
export interface PlaceComplete extends PlaceBase, PlaceRelations, PlaceCounts, PlaceUI, PlaceDeserialized {}

/**
 * 📝 Datos para crear un Place
 */
export interface PlaceCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	region?: string | null;
	type?: string | null;
	climate?: string | null;
	population?: number | null;
	government?: string | null;
	// Campos JSON - pueden aceptar tanto string como array/objeto para flexibilidad
	dangers?: string | PlaceDanger[];
	resources?: string | PlaceResource[];
	lore?: string | null;
	history?: string | null;
	stats?: string | PlaceStats;
	sortBy?: string;
	filters?: string | PlaceFilters;
	// UI
	featuredImage?: string | null;
	isFavorite?: boolean;
	// Relaciones
	images?: string[] | { id: string }[];
	videos?: string[] | { id: string }[];
	albums?: string[] | { id: string }[];
	collections?: string[] | { id: string }[];
	tags?: string[] | { id: string }[];
	characters?: string[] | { id: string }[];
	worldItems?: string[] | { id: string }[];
	concepts?: string[] | { id: string }[];
	prompts?: string[] | { id: string }[];
	notes?: string[] | { id: string }[];
	wildcards?: string[] | { id: string }[];
	properties?: string[] | { id: string }[];
	groups?: string[] | { id: string }[];
}

/**
 * 📝 Datos para actualizar un Place
 */
export interface PlaceUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	region?: string | null;
	type?: string | null;
	climate?: string | null;
	population?: number | null;
	government?: string | null;
	// Campos JSON - pueden aceptar tanto string como array/objeto para flexibilidad
	dangers?: string | PlaceDanger[];
	resources?: string | PlaceResource[];
	lore?: string | null;
	history?: string | null;
	stats?: string | PlaceStats;
	sortBy?: string;
	filters?: string | PlaceFilters;
	// UI
	featuredImage?: string | null;
	isFavorite?: boolean;
	// Relaciones
	images?: string[] | { id: string }[];
	videos?: string[] | { id: string }[];
	albums?: string[] | { id: string }[];
	collections?: string[] | { id: string }[];
	tags?: string[] | { id: string }[];
	characters?: string[] | { id: string }[];
	worldItems?: string[] | { id: string }[];
	concepts?: string[] | { id: string }[];
	prompts?: string[] | { id: string }[];
	notes?: string[] | { id: string }[];
	wildcards?: string[] | { id: string }[];
	properties?: string[] | { id: string }[];
	groups?: string[] | { id: string }[];
}

/**
 * 🔍 Opciones de búsqueda para Place
 */
export interface PlaceSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof PlaceBase]?: 'asc' | 'desc';
	};
	where?: PlaceFilters;
	include?: {
		images?: boolean;
		videos?: boolean;
		albums?: boolean;
		collections?: boolean;
		tags?: boolean;
		characters?: boolean;
		worldItems?: boolean;
		concepts?: boolean;
		prompts?: boolean;
		notes?: boolean;
		wildcards?: boolean;
		properties?: boolean;
		groups?: boolean;
		_count?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de Places
 */
export interface PlaceSearchResult {
	items: PlaceComplete[];
	total: number;
	hasMore: boolean;
}

/**
 * 🎯 Opciones para el transformer de Place
 */
export interface PlaceTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	validateFields?: boolean;
	customFields?: (keyof PlaceComplete)[];
	deserializeFields?: boolean;
	includeStats?: boolean;
	includeUI?: boolean;
}

/**
 * 🔗 Interfaz para lugares relacionados
 */
export interface RelatedPlace {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	category?: string;
	region?: string;
	type?: string;
	count: number;
	strength: number;
}

// Categorías de lugares
export enum PlaceCategory {
	SETTLEMENT = 'settlement',
	LANDSCAPE = 'landscape',
	STRUCTURE = 'structure',
	BIOME = 'biome',
	UNDERGROUND = 'underground',
	MYTHICAL = 'mythical',
	HISTORICAL = 'historical',
	OTHER = 'other',
}

// Tipos de lugares
export enum PlaceType {
	CITY = 'city',
	TOWN = 'town',
	VILLAGE = 'village',
	RUIN = 'ruin',
	CASTLE = 'castle',
	FORTRESS = 'fortress',
	DUNGEON = 'dungeon',
	CAVE = 'cave',
	FOREST = 'forest',
	MOUNTAIN = 'mountain',
	VALLEY = 'valley',
	ISLAND = 'island',
	LAKE = 'lake',
	RIVER = 'river',
	OCEAN = 'ocean',
	DESERT = 'desert',
	TUNDRA = 'tundra',
	JUNGLE = 'jungle',
	SWAMP = 'swamp',
	OTHER = 'other',
}

// Climas
export enum PlaceClimate {
	TEMPERATE = 'temperate',
	TROPICAL = 'tropical',
	ARID = 'arid',
	COLD = 'cold',
	POLAR = 'polar',
	ALPINE = 'alpine',
	CONTINENTAL = 'continental',
	MEDITERRANEAN = 'mediterranean',
	OCEANIC = 'oceanic',
	MONSOON = 'monsoon',
	MAGICAL = 'magical',
	OTHER = 'other',
}

// Criterios de ordenación
export enum PlaceSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
	POPULATION_ASC = 'population:asc',
	POPULATION_DESC = 'population:desc',
	TYPE_ASC = 'type:asc',
	TYPE_DESC = 'type:desc',
	DANGER_ASC = 'danger:asc',
	DANGER_DESC = 'danger:desc',
}

// Tipos inferidos de Zod
export type PlaceValidated = z.infer<typeof PlaceSchema>;
