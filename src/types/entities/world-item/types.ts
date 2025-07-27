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
	images?: ImageWithStats[];
	videos?: VideoWithStats[];
	albums?: AlbumWithStats[];
	collections?: CollectionWithStats[];
	tags?: TagWithStats[];
	characters?: CharacterWithStats[];
	places?: PlaceComplete[];
	concepts?: ConceptWithStats[];
	prompts?: PromptComplete[];
	notes?: NoteWithStats[];
	wildcards?: WildcardWithStats[];
	properties?: PropertyComplete[];
	groups?: GroupWithStats[];
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

export interface WorldItemCreateInput extends Omit<WorldItemBase, 'id' | 'createdAt' | 'updatedAt'> {}

export type WorldItemUpdateInput = Partial<WorldItemCreateInput>;

// --- OTROS TIPOS ---

export interface WorldItemFilters {
	query?: string;
	searchTerm?: string; // Alias para compatibilidad
	type?: string | string[];
	category?: string | string[];
	rarity?: string | string[];
	isFavorite?: boolean;
	hasImage?: boolean;
}

export interface WorldItemSearchOptions {
	skip?: number;
	take?: number;
	filters?: WorldItemFilters;
	sortBy?: string;
}

// --- TIPOS PARA OPERACIONES ---

export type CreateWorldItemData = WorldItemCreateInput;

export type UpdateWorldItemData = WorldItemUpdateInput;

// Alias para compatibilidad
export type WorldItem = WorldItemWithStats;
