import type {
	Album as PrismaAlbum,
	Attribute as PrismaAttribute,
	Character as PrismaCharacter,
	Collection as PrismaCollection,
	Concept as PrismaConcept,
	Note as PrismaNote,
	Object as PrismaObject,
	Place as PrismaPlace,
	Prompt as PrismaPrompt,
	Tag as PrismaTag,
} from '@prisma/client';
import type { BaseEntity } from './store.types';

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

export interface AttributeCreate extends BaseEntityCreate {
	type: string;
	value: string;
	category: string;
	metadata: string;
}

export interface SystemImageCreate {
	name: string;
	path: string;
	type: string;
	category: string;
	size: number;
	width: number;
	height: number;
	metadata?: string | null;
}

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
	| 'object'
	| 'album'
	| 'collection'
	| 'concept'
	| 'prompt'
	| 'note'
	| 'attribute'
	| 'systemImage';

export type RelationType =
	| 'character_character'
	| 'character_place'
	| 'character_object'
	| 'place_object'
	| 'concept_character'
	| 'concept_place'
	| 'concept_object'
	| 'prompt_character'
	| 'prompt_place'
	| 'prompt_object'
	| 'note_character'
	| 'note_place'
	| 'note_object'
	| 'attribute_character'
	| 'attribute_place'
	| 'attribute_object';

export type CategoryType =
	| 'general'
	| 'magic'
	| 'technology'
	| 'society'
	| 'character'
	| 'place'
	| 'object'
	| 'system'
	| 'adventure'
	| 'stats'
	| 'personality'
	| 'abilities';

export type StatusType = 'active' | 'pending' | 'completed' | 'archived' | 'deleted';

export type AttributeType = 'text' | 'number' | 'boolean' | 'date' | 'color' | 'range' | 'select' | 'multiselect';

export type AttributeCategory = 'general' | 'character' | 'place' | 'object' | 'concept' | 'prompt' | 'note' | 'system';

export type SystemImageType =
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
export type Object = PrismaObject;
export type Collection = PrismaCollection;
export type Album = PrismaAlbum;
export type Tag = PrismaTag;
export type Note = PrismaNote;
export type Concept = PrismaConcept;
export type Prompt = PrismaPrompt;
export type Attribute = PrismaAttribute;
