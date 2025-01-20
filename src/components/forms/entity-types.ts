// Interfaces base
export interface BaseFormData {
  id?: string;
  name: string;
  description?: string;
  emoji?: string;
  shortcut?: string;
  color?: string;
  tags?: string[];
  featuredImage?: string | null;
  isFavorite?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaces específicas
export interface ConceptFormData extends BaseFormData {
  content: string;
  category: string;
}

export interface PromptFormData extends BaseFormData {
  content: string;
  category: string;
  parameters: string;
}

export interface NoteFormData extends BaseFormData {
  title: string;
  content: string;
  category: string;
  priority: number;
  status: string;
}

export interface CharacterFormData extends BaseFormData {
  level: number;
  class: string;
  race: string;
  alignment: string;
  backstory: string;
  stats: string;
  psychologicalProfile: string;
  socialProfile: string;
  relationships: string;
  goals: string;
  fears: string;
  beliefs: string;
  personality: string;
}

export interface CollectionFormData extends BaseFormData {
  url?: string;
  alternativeUrl?: string;
  sourceImage?: string;
  platform?: string;
  price?: number;
  editions: string;
  sortBy: string;
  filters: string;
}

export interface AttributeFormData extends BaseFormData {
  type: string;
  value: string;
  category: string;
  metadata: string;
}

export interface ObjectFormData extends BaseFormData {
  type: string;
  rarity: string;
  properties: string;
  requirements: string;
  origin: string;
  stats: string;
  sortBy: string;
  filters: string;
}

export interface PlaceFormData extends BaseFormData {
  type: string;
  climate: string;
  region: string;
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

export interface AlbumFormData extends BaseFormData {
  sortBy: string;
  filters: string;
}

export interface TagFormData extends BaseFormData {
  color: string;
  emoji: string;
  shortcut?: string;
}

// Funciones de conversión base
export function formDataToEntity<T extends BaseFormData>(formData: T): any {
  return {
    ...formData,
    tags: Array.isArray(formData.tags)
      ? formData.tags
      : JSON.parse(formData.tags as unknown as string),
  };
}

export function entityToFormData<T extends BaseFormData>(entity: any): T {
  return {
    ...entity,
    tags: Array.isArray(entity.tags)
      ? entity.tags
      : JSON.parse(entity.tags),
    featuredImage: entity.featuredImage || null,
    isFavorite: entity.isFavorite || false,
  } as T;
}

// Funciones específicas para cada tipo
export function formDataToConcept(formData: ConceptFormData) {
  return formDataToEntity(formData);
}

export function conceptToFormData(concept: any): ConceptFormData {
  return entityToFormData(concept);
}

export function formDataToPrompt(formData: PromptFormData) {
  return formDataToEntity(formData);
}

export function promptToFormData(prompt: any): PromptFormData {
  return entityToFormData(prompt);
}

export function formDataToNote(formData: NoteFormData) {
  return {
    ...formDataToEntity(formData),
    priority: Number(formData.priority),
  };
}

export function noteToFormData(note: any): NoteFormData {
  return {
    ...entityToFormData(note),
    priority: Number(note.priority),
  };
}

export function formDataToCharacter(formData: CharacterFormData) {
  return {
    ...formDataToEntity(formData),
    level: Number(formData.level),
  };
}

export function characterToFormData(character: any): CharacterFormData {
  return {
    ...entityToFormData(character),
    level: Number(character.level),
  };
}

export function formDataToCollection(formData: CollectionFormData) {
  return {
    ...formDataToEntity(formData),
    price: formData.price ? Number(formData.price) : undefined,
  };
}

export function collectionToFormData(collection: any): CollectionFormData {
  return {
    ...entityToFormData(collection),
    price: collection.price ? Number(collection.price) : undefined,
  };
}

export function formDataToAttribute(formData: AttributeFormData) {
  return formDataToEntity(formData);
}

export function attributeToFormData(attribute: any): AttributeFormData {
  return entityToFormData(attribute);
}

export function formDataToObject(formData: ObjectFormData) {
  return formDataToEntity(formData);
}

export function objectToFormData(object: any): ObjectFormData {
  return entityToFormData(object);
}

export function formDataToPlace(formData: PlaceFormData) {
  return {
    ...formDataToEntity(formData),
    population: Number(formData.population),
  };
}

export function placeToFormData(place: any): PlaceFormData {
  return {
    ...entityToFormData(place),
    population: Number(place.population),
  };
}

export function formDataToAlbum(formData: AlbumFormData) {
  return formDataToEntity(formData);
}

export function albumToFormData(album: any): AlbumFormData {
  return entityToFormData(album);
}