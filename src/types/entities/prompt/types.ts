/**
 * @file Tipos canónicos para la entidad Prompt
 * @module types/entities/prompt/types
 * @description Define las estructuras de datos, inputs y tipos para la entidad Prompt.
 */

import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
import type { ConceptComplete } from '../concept';
import type { GroupComplete } from '../group';
import type { ImageComplete } from '../image';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PropertyComplete } from '../property';
import type { TagWithStats as TagComplete } from '../tag/types';
import type { VideoComplete } from '../video';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';


/**
 * 🎯 Tipo base canónico para Prompt
 */
export interface PromptBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	isPublic: boolean;
	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	content: string | null;
	parameters: string | null; // JSON string
	style: string | null;
	mood: string | null;
	lighting: string | null;
	composition: string | null;
	technique: string | null;
	inspiration: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🎯 Tipo completo para Prompt con todas las relaciones y campos JSON deserializados.
 */
export interface PromptComplete extends PromptBase {
	// Relaciones
	images?: ImageComplete[];
	videos?: VideoComplete[];
	albums?: AlbumComplete[];
	collections?: CollectionComplete[];
	tagEntities?: TagComplete[];
	characters?: CharacterComplete[];
	places?: PlaceComplete[];
	worldItems?: WorldItemComplete[];
	concepts?: ConceptComplete[];
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
		tagEntities?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * ➕ Input para crear un nuevo prompt.
 */
export interface PromptCreateInput {
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	content?: string | null;
	parameters?: string | null;
	style?: string | null;
	mood?: string | null;
	lighting?: string | null;
	composition?: string | null;
	technique?: string | null;
	inspiration?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
}

/**
 * 🔄 Input para actualizar un prompt existente.
 */
export type PromptUpdateInput = Partial<PromptCreateInput>;

/**
 * 🔍 Opciones para buscar y filtrar prompts.
 */
export interface PromptSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: {
		search?: string;
		category?: string | string[];
		purpose?: string | string[];
		onlyFavorites?: boolean;
		tags?: string[];
		contentContains?: string;
	};
	includeRelations?: boolean;
}

export enum PromptSortCriteria {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	CREATED_AT_ASC = 'createdAt_asc',
	CREATED_AT_DESC = 'createdAt_desc',
	UPDATED_AT_ASC = 'updatedAt_asc',
	UPDATED_AT_DESC = 'updatedAt_desc',
}

export enum PromptViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
}