import { BaseEntityFormData } from "./entity-form";
import type { Character, Album, Collection, Object, Place, Tag } from "@prisma/client";

// Tipos de formulario
export interface AlbumFormData extends BaseEntityFormData {
  // Los álbumes usan solo los campos base
}

export interface CollectionFormData extends BaseEntityFormData {
  filters: string;
  sortBy: string;
  shortcut?: string;
}

export interface CharacterFormData extends BaseEntityFormData {
  level: number;
  class: string;
  race: string;
  alignment: string;
  backstory: string;
  stats: string;
}

export interface ObjectFormData extends BaseEntityFormData {
  type: string;
  rarity: string;
  properties: string;
  requirements: string;
  origin: string;
  stats: string;
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
}

export interface TagFormData {
  id?: string;
  name: string;
  color: string;
  description?: string;
  shortcut?: string;
}

// Funciones de conversión para Characters
export function characterToFormData(character: Character): CharacterFormData {
  return {
    id: character.id,
    name: character.name,
    emoji: character.emoji,
    color: character.color,
    description: character.description || undefined,
    shortcut: character.shortcut || undefined,
    filters: character.filters,
    sortBy: character.sortBy,
    level: character.level,
    class: character.class,
    race: character.race,
    alignment: character.alignment,
    backstory: character.backstory,
    stats: character.stats,
  };
}

export function formDataToCharacter(data: CharacterFormData, id?: string): Omit<Character, "createdAt" | "updatedAt"> {
  return {
    id: id || "",
    name: data.name,
    emoji: data.emoji,
    color: data.color,
    description: data.description || null,
    shortcut: data.shortcut || null,
    filters: data.filters || "[]",
    sortBy: data.sortBy || "name",
    level: data.level,
    class: data.class,
    race: data.race,
    alignment: data.alignment,
    backstory: data.backstory,
    stats: data.stats,
  };
}

// Funciones de conversión para Albums
export function albumToFormData(album: Album): AlbumFormData {
  return {
    id: album.id,
    name: album.name,
    emoji: album.emoji,
    color: album.color,
    description: album.description || undefined,
    shortcut: album.shortcut || undefined,
    filters: album.filters,
    sortBy: album.sortBy,
  };
}

export function formDataToAlbum(data: AlbumFormData, id?: string): Omit<Album, "createdAt" | "updatedAt"> {
  return {
    id: id || "",
    name: data.name,
    emoji: data.emoji,
    color: data.color,
    description: data.description || null,
    shortcut: data.shortcut || null,
    filters: data.filters || "[]",
    sortBy: data.sortBy || "name",
  };
}

export function collectionToFormData(collection: Collection): CollectionFormData {
  return {
    name: collection.name,
    description: collection.description || "",
    emoji: collection.emoji,
    color: collection.color,
    filters: collection.filters,
    sortBy: collection.sortBy,
    shortcut: collection.shortcut || undefined,
  };
}

export function formDataToCollection(
  data: CollectionFormData,
  id?: string
): Omit<Collection, "createdAt" | "updatedAt"> {
  return {
    id: id || crypto.randomUUID(),
    name: data.name,
    description: data.description || null,
    emoji: data.emoji,
    color: data.color,
    filters: data.filters,
    sortBy: data.sortBy,
    shortcut: data.shortcut || null,
  };
}

// Funciones de conversión para Objects
export function objectToFormData(object: Object): ObjectFormData {
  return {
    id: object.id,
    name: object.name,
    emoji: object.emoji,
    color: object.color,
    description: object.description || undefined,
    shortcut: object.shortcut || undefined,
    filters: object.filters,
    sortBy: object.sortBy,
    type: object.type,
    rarity: object.rarity,
    properties: object.properties,
    requirements: object.requirements,
    origin: object.origin,
    stats: object.stats,
  };
}

export function formDataToObject(data: ObjectFormData, id?: string): Omit<Object, "createdAt" | "updatedAt"> {
  return {
    id: id || "",
    name: data.name,
    emoji: data.emoji,
    color: data.color,
    description: data.description || null,
    shortcut: data.shortcut || null,
    filters: data.filters || "[]",
    sortBy: data.sortBy || "name",
    type: data.type,
    rarity: data.rarity,
    properties: data.properties,
    requirements: data.requirements,
    origin: data.origin,
    stats: data.stats,
  };
}

// Funciones de conversión para Places
export function placeToFormData(place: Place): PlaceFormData {
  return {
    id: place.id,
    name: place.name,
    emoji: place.emoji,
    color: place.color,
    description: place.description || undefined,
    shortcut: place.shortcut || undefined,
    filters: place.filters,
    sortBy: place.sortBy,
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
  };
}

export function formDataToPlace(data: PlaceFormData, id?: string): Omit<Place, "createdAt" | "updatedAt"> {
  return {
    id: id || "",
    name: data.name,
    emoji: data.emoji,
    color: data.color,
    description: data.description || null,
    shortcut: data.shortcut || null,
    filters: data.filters || "[]",
    sortBy: data.sortBy || "name",
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
  };
}

// Funciones de conversión para Tags
export function tagToFormData(tag: Tag): TagFormData {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    description: tag.description || undefined,
    shortcut: tag.shortcut || undefined,
  };
}

export function formDataToTag(data: TagFormData, id?: string): Omit<Tag, "createdAt" | "updatedAt"> {
  return {
    id: id || "",
    name: data.name,
    color: data.color,
    description: data.description || null,
    shortcut: data.shortcut || null,
  };
}