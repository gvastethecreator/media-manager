import type { BaseEntity } from '@/types/store.types';
import type {
	Album as PrismaAlbum,
	Character as PrismaCharacter,
	Collection as PrismaCollection,
	Concept as PrismaConcept,
	Note as PrismaNote,
	Place as PrismaPlace,
	Prompt as PrismaPrompt,
	Tag as PrismaTag,
	WorldItem as PrismaWorldItem,
} from '@prisma/client';

export interface BaseEntityCreate {
	name: string;
	description?: string | null;
	emoji?: string;
	color?: string;
	shortcut?: string;
	filters?: string;
	sortBy?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

export interface AlbumCreate extends BaseEntityCreate {
	sortBy: string;
	filters: string;
}

export interface CharacterCreate extends BaseEntityCreate {
	level: number;
	class: string;
	race: string;
	alignment: string;
	backstory: string;
	stats: string;
	sortBy: string;
	filters: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
}

export interface PlaceCreate extends BaseEntityCreate {
	region: string;
	type: string;
	climate: string;
	population: number;
	government: string;
	dangers: string;
	resources: string;
	lore: string;
	history: string;
	stats: string;
	sortBy: string;
	filters: string;
}

export interface ObjectCreate extends BaseEntityCreate {
	type: string;
	rarity: string;
	properties: string;
	requirements: string;
	origin: string;
	stats: string;
	sortBy: string;
	filters: string;
}

export interface ConceptCreate extends BaseEntityCreate {
	content: string;
	category: string;
	tags: string;
}

export interface PromptCreate extends BaseEntityCreate {
	content: string;
	category: string;
	parameters: string;
	tags: string;
}

export interface NoteCreate extends BaseEntityCreate {
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	tags: string;
}

export interface UploadedImageCreate {
	name: string;
	path: string;
	type: string;
	category: string;
	size: number;
	width: number;
	height: number;
	metadata?: string | null;
}

/**
 * @deprecated Use isFavorite field directly on entities instead.
 * Este tipo solo se mantiene por compatibilidad con código existente,
 * pero será eliminado en futuras versiones.
 */
export interface UniversalFavoriteCreate {
	entityId: string;
	entityType: string;
}

export interface CollectionCreate extends BaseEntityCreate {
	sortBy: string;
	filters: string;
	url?: string | null;
	alternativeUrl?: string | null;
	sourceImage?: string | null;
	platform?: string | null;
	price?: number | null;
	editions: string;
}

export type EntityType =
	| 'character'
	| 'place'
	| 'world-item'
	| 'album'
	| 'collection'
	| 'concept'
	| 'prompt'
	| 'note'
	| 'uploadedImage';

export type RelationType =
	| 'character_character'
	| 'character_place'
	| 'character_world-item'
	| 'place_world-item'
	| 'concept_character'
	| 'concept_place'
	| 'concept_world-item'
	| 'prompt_character'
	| 'prompt_place'
	| 'prompt_world-item'
	| 'note_character'
	| 'note_place'
	| 'note_world-item';

export type CategoryType =
	| 'general'
	| 'magic'
	| 'technology'
	| 'society'
	| 'character'
	| 'place'
	| 'world-item'
	| 'system'
	| 'adventure'
	| 'stats'
	| 'personality'
	| 'abilities';

export type StatusType = 'active' | 'pending' | 'completed' | 'archived' | 'deleted';

export type UploadedImageType =
	| 'icon'
	| 'avatar'
	| 'background'
	| 'thumbnail'
	| 'banner'
	| 'logo'
	| 'pattern'
	| 'texture'
	| 'ui';

export type Character = PrismaCharacter;
export type Place = PrismaPlace;
export type WorldItem = PrismaWorldItem;
export type Collection = PrismaCollection;
export type Album = PrismaAlbum;
export type Tag = PrismaTag;
export type Note = PrismaNote;
export type Concept = PrismaConcept;
export type Prompt = PrismaPrompt;

export interface WorldItemCreate extends BaseEntityCreate {
	type: string;
	rarity: string;
	properties: string;
	requirements: string;
	origin: string;
	stats: string;
	sortBy: string;
	filters: string;
}
