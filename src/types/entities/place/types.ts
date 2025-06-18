/**
 * @file Tipos canónicos para la entidad Place
 * @module types/entities/place/types
 * @description Define las estructuras de datos, inputs de creación/actualización y filtros para la entidad Place.
 */

import type {
    Album,
    Character,
    Collection,
    Concept,
    Group,
    Image,
    Note,
    Prisma,
    Prompt,
    Property,
    Tag,
    Video,
    Wildcard,
    WorldItem,
} from '@prisma/client';

/**
 * 🗺️ Tipo base para un lugar.
 * Contiene todos los campos escalares y datos JSON del modelo Prisma.
 */
export type Place = Prisma.Place;

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
	extends Omit<
		Place,
		'id' | 'createdAt' | 'updatedAt' | 'dangers' | 'resources' | 'stats'
	>,
	PlaceRelationInput {
	dangers?: Prisma.InputJsonValue;
	resources?: Prisma.InputJsonValue;
	stats?: Prisma.InputJsonValue;
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
	orderBy?: Prisma.PlaceOrderByWithRelationInput;
	filters?: PlaceFilters;
	include?: Prisma.PlaceInclude;
}

/**
 * ✨ Tipo de un lugar con todas sus relaciones anidadas.
 */
export type PlaceWithRelations = Place & {
	images?: Image[];
	videos?: Video[];
	albums?: Album[];
	collections?: Collection[];
	tags?: Tag[];
	characters?: Character[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];
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
