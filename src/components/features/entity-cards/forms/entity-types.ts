import type {
	Album,
	Attribute,
	Character,
	Collection,
	Concept,
	Note,
	Object as ObjectEntity,
	Place,
	Prompt,
	Tag,
} from '@prisma/client';
import type { BaseEntityFormData } from './entity-form';

// Tipos de formulario
export interface AlbumFormData extends BaseEntityFormData {
	sortBy: string;
	filters: string;
	shortcut?: string;
	featuredImage?: string | null;
	isFavorite: boolean;
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
}

export interface TagFormData extends BaseEntityFormData {
	color: string;
	shortcut?: string;
	featuredImage?: string | null;
	isFavorite: boolean;
}

export interface AttributeFormData extends BaseEntityFormData {
	type: string;
	value: string;
	category: string;
	metadata: string;
	featuredImage?: string | null;
	isFavorite: boolean;
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
		featuredImage: character.featuredImage || undefined,
		isFavorite: character.isFavorite,
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
	};
}

export function albumToFormData(album: Album): AlbumFormData {
	return {
		id: album.id,
		name: album.name,
		emoji: album.emoji,
		color: album.color,
		description: album.description || '',
		shortcut: album.shortcut || undefined,
		sortBy: album.sortBy,
		filters: album.filters,
		featuredImage: album.featuredImage || undefined,
		isFavorite: album.isFavorite,
	};
}

export function formDataToAlbum(data: AlbumFormData): Omit<Album, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		shortcut: data.shortcut || null,
		sortBy: data.sortBy,
		filters: data.filters,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
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
	};
}

export function objectToFormData(object: ObjectEntity): ObjectFormData {
	return {
		id: object.id,
		name: object.name,
		emoji: object.emoji,
		color: object.color,
		description: object.description || '',
		type: object.type,
		rarity: object.rarity,
		properties: object.properties,
		requirements: object.requirements,
		origin: object.origin,
		stats: object.stats,
		sortBy: object.sortBy,
		filters: object.filters,
		shortcut: object.shortcut || undefined,
		featuredImage: object.featuredImage || undefined,
		isFavorite: object.isFavorite,
	};
}

export function formDataToObject(data: ObjectFormData): Omit<ObjectEntity, 'id' | 'createdAt' | 'updatedAt'> {
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
		sortBy: data.sortBy,
		filters: data.filters,
		shortcut: data.shortcut || null,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
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
	};
}

export function attributeToFormData(attribute: Attribute): AttributeFormData {
	return {
		id: attribute.id,
		name: attribute.name,
		emoji: attribute.emoji,
		color: attribute.color,
		description: attribute.description || '',
		type: attribute.type,
		value: attribute.value,
		category: attribute.category,
		metadata: attribute.metadata,
		featuredImage: attribute.featuredImage || undefined,
		isFavorite: attribute.isFavorite,
	};
}

export function formDataToAttribute(data: AttributeFormData): Omit<Attribute, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
		type: data.type,
		value: data.value,
		category: data.category,
		metadata: data.metadata,
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
	};
}

export function noteToFormData(note: Note): NoteFormData {
	return {
		id: note.id,
		name: note.name,
		emoji: note.emoji,
		color: note.color,
		description: note.description || '',
		title: note.title,
		content: note.content,
		category: note.category,
		priority: note.priority,
		status: note.status,
		tags: JSON.parse(note.tags),
		featuredImage: note.featuredImage || undefined,
		isFavorite: note.isFavorite,
	};
}

export function formDataToNote(data: NoteFormData): Omit<Note, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: data.name,
		emoji: data.emoji,
		color: data.color,
		description: data.description || null,
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
		content: concept.content,
		category: concept.category,
		tags: JSON.parse(concept.tags),
		featuredImage: concept.featuredImage || undefined,
		isFavorite: concept.isFavorite,
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
