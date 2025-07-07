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
import type { VideoWithStats } from '../video';
import type { WildcardComplete } from '../wildcard';

// --- ESTRUCTURAS DE DATOS SERIALIZADAS ---

export interface WorldItemAttribute {
	name?: string;
	value?: number | string;
	maxValue?: number;
}
export interface WorldItemEffect {
	name?: string;
	description?: string;
	duration?: string;
	cooldown?: string;
}
export interface WorldItemRequirement {
	name?: string;
	value?: number;
	description?: string;
}
export interface WorldItemStat {
	name?: string;
	value?: number;
	modifier?: string;
}
export interface WorldItemProperty {
	name?: string;
	value?: string | number | boolean;
	description?: string;
}
export interface WorldItemFilter {
	type?: 'tag' | 'character' | 'place' | 'concept' | 'worldItem';
	operator?: 'AND' | 'OR' | 'NOT';
	value?: string | number | boolean;
	field?: string;
}

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
	isFavorite: boolean;
	shortcut: string | null;
	featuredImage: string | null;
	emoji: string | null;
	color: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface WorldItemRelations {
	images?: ImageComplete[];
	videos?: VideoWithStats[];
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

export interface WorldItemStatistics {
	totalImages: number;
	totalVideos: number;
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalCharacters: number;
	totalPlaces: number;
	totalConcepts: number;
	totalPrompts: number;
	totalNotes: number;
	totalWildcards: number;
	totalProperties: number;
	totalGroups: number;
	totalRelations: number;
	totalSize: number;
	averageSize: number;
	averageRelations: number;
	popularityScore: number;
	completenessScore: number;
	usageCount: number;
	lastUsed: Date | null;
}

export interface WorldItemWithStats extends WorldItemBase, WorldItemRelations {
	_stats: WorldItemStatistics;
	attributes: WorldItemAttribute[];
	effects: WorldItemEffect[];
	requirements: WorldItemRequirement[];
	stats: WorldItemStat[];
	properties: WorldItemProperty[];
	filters: WorldItemFilter[];
	tags: TagComplete[];
}

// --- INPUTS DE CREACIÓN Y ACTUALIZACIÓN ---

export interface WorldItemCreateInput extends Omit<WorldItemBase, 'id' | 'createdAt' | 'updatedAt'> {
	attributes?: WorldItemAttribute[];
	effects?: WorldItemEffect[];
	requirements?: WorldItemRequirement[];
	stats?: WorldItemStat[];
	properties?: WorldItemProperty[];
	filters?: WorldItemFilter[];
	tags?: string[];
}

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
