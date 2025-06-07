/**
 * @file Tipos para la entidad Character
 * @module types/entities/character/character-types
 */

import type { SearchOptionsSchema } from '@/types/common/search';
import type { Album } from '../album/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/index';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';

/**
 * Interfaz para atributos/estadísticas de un personaje
 */
export interface CharacterAttribute {
	name: string;
	value: number;
	type?: string;
	description?: string;
	icon?: string;
}

/**
 * Interfaz base para personaje
 */
export interface CharacterBase {
	id: string;
	name: string;
	description?: string;
	level: number;
	experience: number;
	class: string;
	race: string;
	alignment: string;
	background: string;
	stats?: Record<string, number>;
	skills?: Record<string, number>;
	inventory?: Array<{
		id: string;
		name: string;
		quantity: number;
		type: string;
		rarity?: string;
		description?: string;
	}>;
	spells?: Array<{
		id: string;
		name: string;
		level: number;
		school: string;
		description?: string;
	}>;
	feats?: Array<{
		id: string;
		name: string;
		description?: string;
		requirements?: string[];
	}>;
	notes?: string;
	isActive: boolean;
	isFavorite: boolean;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

// Interfaces de relaciones
export interface CharacterRelations {
	party?: { id: string };
	campaign?: { id: string };
	images?: Array<{ id: string }>;
	items?: Array<{ id: string }>;
	abilities?: Array<{ id: string }>;
	quests?: Array<{ id: string }>;
	locations?: Array<{ id: string }>;
	npcs?: Array<{ id: string }>;
	notes?: Array<{ id: string }>;
	relatedCharacters?: Array<{ id: string }>;
	relatedTo?: Array<{ id: string }>;
}

// Interface de conteos
export interface CharacterCounts {
	images: number;
	items: number;
	abilities: number;
	quests: number;
	locations: number;
	npcs: number;
	notes: number;
	relatedCharacters: number;
	relatedTo: number;
}

// Interface completa
export interface CharacterComplete extends CharacterBase, CharacterRelations {
	_count: CharacterCounts;
}

// Interfaces para creación y actualización
export interface CharacterCreateInput
	extends Omit<CharacterBase, 'id' | 'createdAt' | 'updatedAt'>,
		Partial<CharacterRelations> {}
export interface CharacterUpdateInput
	extends Partial<Omit<CharacterBase, 'id' | 'createdAt' | 'updatedAt'>>,
		Partial<CharacterRelations> {}

// Interfaces para búsqueda
export interface CharacterFilters {
	search?: string;
	level?: {
		min?: number;
		max?: number;
	};
	class?: string[];
	race?: string[];
	alignment?: string[];
	background?: string[];
	isActive?: boolean;
	isFavorite?: boolean;
	hasParty?: boolean;
	hasCampaign?: boolean;
	hasImages?: boolean;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

export interface CharacterIncludes {
	party?: boolean;
	campaign?: boolean;
	images?: boolean;
	items?: boolean;
	abilities?: boolean;
	quests?: boolean;
	locations?: boolean;
	npcs?: boolean;
	notes?: boolean;
	relatedCharacters?: boolean;
	relatedTo?: boolean;
	count?: boolean;
}

export interface CharacterSearchOptions extends SearchOptionsSchema {
	filters?: CharacterFilters;
	include?: CharacterIncludes;
	page?: number;
	pageSize?: number;
	orderBy?: any;
}

export interface CharacterSearchResult {
	items: CharacterComplete[];
	total: number;
	page: number;
	pageSize: number;
}

// Opciones del transformer
export interface CharacterTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	customFields?: string[];
}

// Contadores unificados
export interface CharacterCount {
	images: number;
	videos: number;
	relatedCharacters: number;
	relatedTo: number;
	albums: number;
	collections: number;
	tags: number;
	places: number;
	worldItems: number;
	concepts: number;
	prompts: number;
	notes: number;
	wildcards: number;
	properties: number;
	groups: number;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface CharacterWithRelations extends CharacterBase {
	// Relaciones con contenido
	images?: Image[];
	videos?: Video[];

	// Relaciones con personajes
	relatedCharacters?: CharacterWithRelations[];
	relatedTo?: CharacterWithRelations[];

	// Relaciones con entidades principales
	albums?: Album[];
	collections?: Collection[];
	tags?: Tag[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];

	// Contadores
	_count?: Partial<CharacterCount>;
}

/**
 * Interfaz para crear un personaje
 * Los campos complejos pueden aceptar tanto strings JSON como objetos/arrays
 */
export interface CreateCharacterData {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	level?: number;
	class?: string;
	race?: string;
	type?: string | null;
	alignment?: string;
	backstory?: string;
	stats?: string | Record<string, any>; // Puede recibir objeto o string JSON
	psychologicalProfile?: string;
	socialProfile?: string;
	relationships?: string | Array<any>; // Puede recibir array o string JSON
	goals?: string | string[]; // Puede recibir array o string JSON
	fears?: string | string[]; // Puede recibir array o string JSON
	beliefs?: string | string[]; // Puede recibir array o string JSON
	personality?: string | string[]; // Puede recibir array o string JSON
	skills?: string | string[]; // Puede recibir array o string JSON
	abilities?: string | string[]; // Puede recibir array o string JSON
	featuredImage?: string | null;
	isFavorite?: boolean;
	sortBy?: string;
	filters?: string | Record<string, any>; // Puede recibir objeto o string JSON
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
	tagIds?: string[]; // IDs de tags relacionados
}

/**
 * Interfaz para actualizar un personaje
 * Los campos complejos pueden aceptar tanto strings JSON como objetos/arrays
 */
export interface UpdateCharacterData {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	level?: number;
	class?: string;
	race?: string;
	type?: string | null;
	alignment?: string;
	backstory?: string;
	stats?: string | Record<string, any>; // Puede recibir objeto o string JSON
	psychologicalProfile?: string;
	socialProfile?: string;
	relationships?: string | Array<any>; // Puede recibir array o string JSON
	goals?: string | string[]; // Puede recibir array o string JSON
	fears?: string | string[]; // Puede recibir array o string JSON
	beliefs?: string | string[]; // Puede recibir array o string JSON
	personality?: string | string[]; // Puede recibir array o string JSON
	skills?: string | string[]; // Puede recibir array o string JSON
	abilities?: string | string[]; // Puede recibir array o string JSON
	featuredImage?: string | null;
	isFavorite?: boolean;
	sortBy?: string;
	filters?: string | Record<string, any>; // Puede recibir objeto o string JSON
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
	tagIds?: string[]; // IDs de tags relacionados
}

/**
 * Enumeración para criterios de ordenación
 */
export enum CharacterSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	LEVEL_ASC = 'level:asc',
	LEVEL_DESC = 'level:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
}

/**
 * Mapa de propiedades para ordenación
 */
export const CHARACTER_SORT_PROPERTY_MAP: Record<CharacterSortCriteria, string> = {
	[CharacterSortCriteria.NAME_ASC]: 'name',
	[CharacterSortCriteria.NAME_DESC]: 'name',
	[CharacterSortCriteria.LEVEL_ASC]: 'level',
	[CharacterSortCriteria.LEVEL_DESC]: 'level',
	[CharacterSortCriteria.CREATED_ASC]: 'createdAt',
	[CharacterSortCriteria.CREATED_DESC]: 'createdAt',
	[CharacterSortCriteria.UPDATED_ASC]: 'updatedAt',
	[CharacterSortCriteria.UPDATED_DESC]: 'updatedAt',
};

export interface CharacterPrismaWhereInput {
	[key: string]: any;
}

export interface CharacterPrismaOrderByWithRelationInput {
	[key: string]: any;
}

export interface CharacterPrismaInclude {
	[key: string]: boolean | object;
}

export interface CharacterPrismaFindManyArgs {
	where?: CharacterPrismaWhereInput;
	orderBy?: CharacterPrismaOrderByWithRelationInput;
	skip?: number;
	take?: number;
	include?: CharacterPrismaInclude;
}

export interface CharacterPrismaCreateInput {
	[key: string]: any;
}

export interface CharacterPrismaUpdateInput {
	[key: string]: any;
}
