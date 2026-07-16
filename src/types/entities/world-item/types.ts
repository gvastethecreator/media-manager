/**
 * 🌍 Tipos canónicos para la entidad WorldItem
 * @file Tipos unificados para la entidad WorldItem
 * @module types/entities/world-item/types
 * @description Definición de tipos canónicos para WorldItem.
 * @updated 2025-07-01
 */

import type { AlbumWithStats } from '../album';
import type { CharacterWithStats } from '../character';
import type { CollectionWithStats } from '../collection';
import type { ConceptWithStats } from '../concept';
import type { GroupWithStats } from '../group';
import type { ImageWithStats } from '../image';
import type { NoteWithStats } from '../note';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagWithStats } from '../tag';
import type { VideoWithStats } from '../video';
import type { WildcardWithStats } from '../wildcard';
import type { WorldItemBase, WorldItemWithStats } from './base';

// Re-export tipos base
export type { WorldItemBase, WorldItemComplete, WorldItemStatistics, WorldItemWithStats } from './base';

// --- TIPOS PARA RELACIONES ---

export interface WorldItemRelations {
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
	collections?: CollectionWithStats[];
	concepts?: ConceptWithStats[];
	groups?: GroupWithStats[];
	images?: ImageWithStats[];
	notes?: NoteWithStats[];
	places?: PlaceComplete[];
	prompts?: PromptComplete[];
	properties?: PropertyComplete[];
	tags?: TagWithStats[];
	videos?: VideoWithStats[];
	wildcards?: WildcardWithStats[];
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

// --- INPUTS DE CREACIÓN Y ACTUALIZACIÓN ---

export interface WorldItemCreateInput extends Omit<WorldItemBase, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'> {
	isFavorite?: boolean;
}

export type WorldItemUpdateInput = Partial<WorldItemCreateInput>;

// --- OTROS TIPOS ---

export interface WorldItemFilters {
	category?: string | string[];
	hasImage?: boolean;
	isFavorite?: boolean;
	query?: string;
	rarity?: string | string[];
	searchTerm?: string; // Alias para compatibilidad
	type?: string | string[];
}

export interface WorldItemSearchOptions {
	filters?: WorldItemFilters;
	skip?: number;
	sortBy?: string;
	take?: number;
}

// --- TIPOS PARA OPERACIONES ---

export type CreateWorldItemData = WorldItemCreateInput;

export type UpdateWorldItemData = WorldItemUpdateInput;

// Alias para compatibilidad
export type WorldItem = WorldItemWithStats;
