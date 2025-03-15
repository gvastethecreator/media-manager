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
import type { BaseEntityFormData } from './entity-form';

// Definir los tipos extendidos basados en los tipos de Prisma
export type Album = PrismaAlbum & {
	count?: number;
	featuredImage?: string | null;
	isFavorite?: boolean;
};
export type Collection = PrismaCollection;
export type Character = PrismaCharacter;
export type Place = PrismaPlace;
export type WorldItem = PrismaWorldItem;
export type Tag = PrismaTag;
export type Note = PrismaNote;
export type Concept = PrismaConcept;
export type Prompt = PrismaPrompt;

// Tipos de formulario
export interface AlbumFormData extends BaseEntityFormData {
	sortBy: string;
	filters: string;
	shortcut?: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	category?: string | null;
	rating?: number;
	coverImage?: string;
}

export interface CollectionFormData extends BaseEntityFormData {
	sortBy: string;
	filters: string;
	shortcut?: string;
	url?: string;
	alternativeUrl?: string;
	sourceImage?: string;
	platform?: string;
	price?: number;
	editions: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	category?: string | null;
}

export interface CharacterFormData extends BaseEntityFormData {
	level: number;
	class: string;
	race: string;
	alignment: string;
	backstory: string;
	stats: string;
	sortBy: string;
	filters: string;
	shortcut?: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	category?: string | null;
}

export interface ObjectFormData extends BaseEntityFormData {
	type: string;
	rarity: string;
	properties: string;
	requirements: string;
	origin: string;
	stats: string;
	sortBy: string;
	filters: string;
	shortcut?: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	category?: string | null;
}

export interface WorldItemFormData extends BaseEntityFormData {
	type: string;
	rarity: string;
	properties: string;
	requirements: string;
	origin: string;
	stats: string;
	sortBy: string;
	filters: string;
	shortcut?: string | null;
	featuredImage?: string | null;
	isFavorite: boolean;
	category?: string | null;
}

export interface PlaceFormData extends BaseEntityFormData {
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
	shortcut?: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	category?: string | null;
}

export interface TagFormData extends BaseEntityFormData {
	color: string;
	shortcut?: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	category?: string | null;
}

export interface NoteFormData extends BaseEntityFormData {
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

export interface ConceptFormData extends BaseEntityFormData {
	content: string;
	category: string;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

export interface PromptFormData extends BaseEntityFormData {
	content: string;
	category: string;
	parameters: string;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

// Tipos de datos para los formularios de entidades

export interface CollectionFormData {
	id?: string;
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	visibility?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface NoteFormData {
	id?: string;
	name: string;
	content?: string;
	type?: string;
	tags?: string[];
	color?: string;
	emoji?: string;
	pinned?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ConceptFormData {
	id?: string;
	name: string;
	description?: string;
	type?: string;
	category?: string;
	references?: string[];
	relatedConcepts?: string[];
	emoji?: string;
	color?: string;
	image?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface FolderFormData {
	id?: string;
	name: string;
	description?: string;
	path?: string;
	emoji?: string;
	color?: string;
	presetId?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CharacterFormData {
	id?: string;
	name: string;
	description?: string;
	race?: string;
	class?: string;
	level?: number;
	alignment?: string;
	background?: string;
	featuredImage?: string;
	stats?: {
		strength?: number;
		dexterity?: number;
		intelligence?: number;
		charisma?: number;
		vitality?: number;
		[key: string]: number | undefined;
	};
	createdAt?: Date;
	updatedAt?: Date;
}

// Funciones de conversión
export function characterToFormData(character: Character): CharacterFormData {
	return {
		id: character.id,
		name: character.name,
		emoji: character.emoji,
		color: character.color,
		description: character.description || '',
		shortcut: character.shortcut || undefined,
		level: character.level,
		class: character.class,
		race: character.race,
		alignment: character.alignment,
		backstory: character.backstory,
		stats: character.stats,
		sortBy: character.sortBy,
		filters: character.filters,
		psychologicalProfile: character.psychologicalProfile,
		socialProfile: character.socialProfile,
		relationships: character.relationships,
		goals: character.goals,
		fears: character.fears,
		beliefs: character.beliefs,
		personality: character.personality,
		featuredImage: character.featuredImage || null,
		isFavorite: character.isFavorite,
		category: character.category || null,
	};
}

export function formDataToCharacter(data: CharacterFormData): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		shortcut: data.shortcut || null,
		level: data.level,
		class: data.class,
		race: data.race,
		alignment: data.alignment,
		backstory: data.backstory,
		stats: data.stats,
		sortBy: data.sortBy,
		filters: data.filters,
		psychologicalProfile: data.psychologicalProfile,
		socialProfile: data.socialProfile,
		relationships: data.relationships,
		goals: data.goals,
		fears: data.fears,
		beliefs: data.beliefs,
		personality: data.personality,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		category: data.category || null,
	};
}

export function albumToFormData(album: Album): AlbumFormData {
	return {
		id: album.id,
		name: album.name,
		emoji: album.emoji || '📷',
		color: album.color || '#3b82f6',
		description: album.description || '',
		shortcut: album.shortcut || undefined,
		sortBy: album.sortBy || 'name',
		filters: album.filters || '[]',
		featuredImage: album.featuredImage || undefined,
		isFavorite: album.isFavorite || false,
		category: album.category || null,
		rating: album.rating || 0,
		coverImage: album.coverImage || undefined,
	};
}

export function formDataToAlbum(data: AlbumFormData): Omit<PrismaAlbum, 'id' | 'createdAt' | 'updatedAt' | 'images'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		shortcut: data.shortcut || null,
		sortBy: data.sortBy,
		filters: data.filters,
		category: data.category || null,
		rarity: null,
		texture: null,
		rating: data.rating || 0,
	};
}

export function collectionToFormData(collection: Collection): CollectionFormData {
	return {
		id: collection.id,
		name: collection.name,
		emoji: collection.emoji,
		color: collection.color,
		description: collection.description || '',
		shortcut: collection.shortcut || undefined,
		sortBy: collection.sortBy,
		filters: collection.filters,
		url: collection.url || undefined,
		alternativeUrl: collection.alternativeUrl || undefined,
		sourceImage: collection.sourceImage || undefined,
		platform: collection.platform || undefined,
		price: collection.price || undefined,
		editions: collection.editions,
		featuredImage: collection.featuredImage || undefined,
		isFavorite: collection.isFavorite,
		category: collection.category || null,
	};
}

export function formDataToCollection(data: CollectionFormData): Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		shortcut: data.shortcut || null,
		sortBy: data.sortBy,
		filters: data.filters,
		url: data.url || null,
		alternativeUrl: data.alternativeUrl || null,
		sourceImage: data.sourceImage || null,
		platform: data.platform || null,
		price: data.price || null,
		editions: data.editions,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		category: data.category || null,
		rarity: null,
		texture: null,
	};
}

export function worldItemToFormData(worldItem: WorldItem): WorldItemFormData {
	return {
		id: worldItem.id,
		name: worldItem.name,
		emoji: worldItem.emoji,
		color: worldItem.color,
		description: worldItem.description || '',
		type: worldItem.type,
		rarity: worldItem.rarity,
		properties: worldItem.properties,
		requirements: worldItem.requirements,
		origin: worldItem.origin,
		stats: worldItem.stats,
		sortBy: worldItem.sortBy,
		filters: worldItem.filters,
		shortcut: worldItem.shortcut || null,
		featuredImage: worldItem.featuredImage || null,
		isFavorite: worldItem.isFavorite,
		category: worldItem.category || null,
	};
}

export function formDataToWorldItem(data: WorldItemFormData): Omit<WorldItem, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		type: data.type,
		rarity: data.rarity,
		properties: data.properties,
		requirements: data.requirements,
		origin: data.origin,
		stats: data.stats,
		sortBy: data.sortBy,
		filters: data.filters,
		shortcut: data.shortcut || null,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		category: data.category || null,
	};
}

export function placeToFormData(place: Place): PlaceFormData {
	return {
		id: place.id,
		name: place.name,
		emoji: place.emoji,
		color: place.color,
		description: place.description || '',
		region: place.region,
		type: place.type,
		climate: place.climate,
		population: place.population,
		government: place.government,
		dangers: place.dangers,
		resources: place.resources,
		lore: place.lore,
		history: place.history,
		stats: place.stats,
		sortBy: place.sortBy,
		filters: place.filters,
		shortcut: place.shortcut || undefined,
		featuredImage: place.featuredImage || undefined,
		isFavorite: place.isFavorite,
		category: place.category || null,
	};
}

export function formDataToPlace(data: PlaceFormData): Omit<Place, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		region: data.region,
		type: data.type,
		climate: data.climate,
		population: data.population,
		government: data.government,
		dangers: data.dangers,
		resources: data.resources,
		lore: data.lore,
		history: data.history,
		stats: data.stats,
		shortcut: data.shortcut || null,
		sortBy: data.sortBy,
		filters: data.filters,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		category: data.category || null,
	};
}

export function tagToFormData(tag: Tag): TagFormData {
	return {
		id: tag.id,
		name: tag.name,
		emoji: tag.emoji,
		color: tag.color,
		description: tag.description || '',
		shortcut: tag.shortcut || undefined,
		featuredImage: tag.featuredImage || undefined,
		isFavorite: tag.isFavorite,
		category: tag.category || null,
	};
}

export function formDataToTag(data: TagFormData): Omit<Tag, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		shortcut: data.shortcut || null,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		category: data.category || null,
		rarity: null,
		texture: null,
	};
}

export function noteToFormData(note: Note): NoteFormData {
	return {
		id: note.id,
		name: note.title,
		emoji: '📝',
		color: '#3b82f6',
		description: '',
		title: note.title,
		content: note.content,
		category: note.category,
		priority: note.priority,
		status: note.status,
		tags: JSON.parse(note.tags),
		featuredImage: note.featuredImage || undefined,
		isFavorite: note.isFavorite || false,
	};
}

export function formDataToNote(data: NoteFormData): Omit<Note, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		title: data.title,
		content: data.content,
		category: data.category,
		priority: data.priority,
		status: data.status,
		tags: JSON.stringify(data.tags),
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
	};
}

export function conceptToFormData(concept: Concept): ConceptFormData {
	return {
		id: concept.id,
		name: concept.name,
		emoji: concept.emoji,
		color: concept.color,
		description: concept.description || '',
		content: concept.content || '',
		category: concept.category || '',
		tags: concept.tags ? concept.tags.split(',').filter(Boolean) : [],
		featuredImage: concept.featuredImage,
		isFavorite: concept.isFavorite || false,
	};
}

export function formDataToConcept(data: ConceptFormData): Omit<Concept, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		content: data.content,
		category: data.category,
		tags: JSON.stringify(data.tags),
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
	};
}

export function promptToFormData(prompt: Prompt): PromptFormData {
	return {
		id: prompt.id,
		name: prompt.name,
		emoji: prompt.emoji,
		color: prompt.color,
		description: prompt.description || '',
		content: prompt.content,
		category: prompt.category,
		parameters: prompt.parameters,
		tags: JSON.parse(prompt.tags),
		featuredImage: prompt.featuredImage || undefined,
		isFavorite: prompt.isFavorite,
	};
}

export function formDataToPrompt(data: PromptFormData): Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		content: data.content,
		category: data.category,
		parameters: data.parameters,
		tags: JSON.stringify(data.tags),
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
	};
}
