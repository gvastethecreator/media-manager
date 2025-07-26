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

// --- TIPOS BASE Y RELACIONES ---

export interface WorldItemBase {
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
	rarity: string | null;
	value: string | null;
	weight: string | null;
	materials: string | null;
	origin: string | null;
	properties: string | null;
	uses: string | null;
	history: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	shortcut: string | null;
	attributes: string | null;
	effects: string | null;
	requirements: string | null;
	createdAt: Date;
	updatedAt: Date;
}

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

export interface WorldItemWithStats
	extends Omit<WorldItemBase, 'totalImages' | 'totalVideos' | 'properties' | 'notes'> {
	entityType: 'world-item';
	_stats: WorldItemStatistics;
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
	// Relaciones opcionales
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

/**
 * 🌍 WorldItem completo con relaciones
 */
export interface WorldItemComplete extends Omit<WorldItemBase, 'properties' | 'notes'> {
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
