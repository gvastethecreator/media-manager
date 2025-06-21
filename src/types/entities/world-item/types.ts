/**
 * 🌍 Tipos canónicos para la entidad WorldItem
 * @file Tipos unificados para la entidad WorldItem
 * @module types/entities/world-item/types
 * @description Definición de tipos canónicos para WorldItem.
 * @updated 2025-07-01
 */

import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
import type { ConceptComplete } from '../concept';
import type { GroupComplete } from '../group';
import type { ImageComplete } from '../image';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagComplete } from '../tag';
import type { VideoComplete } from '../video';
import type { WildcardComplete } from '../wildcard';

// --- ESTRUCTURAS DE DATOS SERIALIZADAS ---

export interface WorldItemAttribute { name: string; value: number; maxValue?: number; }
export interface WorldItemEffect { name: string; description: string; duration?: string; cooldown?: string; }
export interface WorldItemRequirement { name: string; value: number; description?: string; }
export interface WorldItemStat { name: string; value: number; modifier?: string; }
export interface WorldItemProperty { name: string; value: string | number | boolean; description?: string; }
export interface WorldItemFilter { type: 'tag' | 'character' | 'place' | 'concept' | 'worldItem'; operator: 'AND' | 'OR' | 'NOT'; value: string | number | boolean; field?: string; }

// --- TIPOS BASE Y RELACIONES ---

export interface WorldItemBase {
	id: string;
	name: string;
	description: string | null;
	type: string | null;
	category: string | null;
	rarity: string | null;
	size: string | null;
	origin: string | null;
	attributes: string; // JSON
	effects: string; // JSON
	requirements: string; // JSON
	stats: string; // JSON
	properties: string; // JSON
	filters: string; // JSON
	tags: string; // JSON
	isFavorite: boolean;
	shortcut: string | null;
	featuredImage: string | null;
	emoji: string;
	color: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface WorldItemRelations {
	images?: ImageComplete[];
	videos?: VideoComplete[];
	albums?: AlbumComplete[];
	collections?: CollectionComplete[];
	tags?: TagComplete[];
	characters?: CharacterComplete[];
	places?: PlaceComplete[];
	concepts?: ConceptComplete[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardComplete[];
	properties?: PropertyComplete[];
	groups?: GroupComplete[];
}

export interface WorldItemCounts {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

// Omitimos los campos JSON para reemplazarlos por su versión deserializada
type OmittedFields = 'attributes' | 'effects' | 'requirements' | 'stats' | 'properties' | 'filters' | 'tags';

export type WorldItemComplete = Omit<WorldItemBase, OmittedFields> & {
	attributes: WorldItemAttribute[];
	effects: WorldItemEffect[];
	requirements: WorldItemRequirement[];
	stats: WorldItemStat[];
	properties: WorldItemProperty[];
	filters: WorldItemFilter[];
	tags: string[];
} & WorldItemRelations & WorldItemCounts;


// --- INPUTS DE CREACIÓN Y ACTUALIZACIÓN ---

type WorldItemRelationInput = {
	imageIds?: string[];
	videoIds?: string[];
	albumIds?: string[];
	collectionIds?: string[];
	tagIds?: string[];
	characterIds?: string[];
	placeIds?: string[];
	conceptIds?: string[];
	promptIds?: string[];
	noteIds?: string[];
	wildcardIds?: string[];
	propertyIds?: string[];
	groupIds?: string[];
};

export type WorldItemCreateInput = Omit<WorldItemBase, 'id' | 'createdAt' | 'updatedAt' | OmittedFields> & {
	attributes?: WorldItemAttribute[];
	effects?: WorldItemEffect[];
	requirements?: WorldItemRequirement[];
	stats?: WorldItemStat[];
	properties?: WorldItemProperty[];
	filters?: WorldItemFilter[];
	tags?: string[];
} & WorldItemRelationInput;

export type WorldItemUpdateInput = Partial<WorldItemCreateInput>;

// --- OTROS TIPOS ---

export interface WorldItemFilters {
	query?: string;
	type?: string[];
	category?: string[];
	rarity?: string[];
	isFavorite?: boolean;
	hasImage?: boolean;
}

export interface WorldItemSearchOptions {
	skip?: number;
	take?: number;
	filters?: WorldItemFilters;
	sortBy?: string;
}
