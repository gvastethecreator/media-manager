/**
 * @file Tipos para la entidad Tag
 * @module types/entities/tag/tag-types
 */

import type { JSONString, Nullable } from '@/utils/types/utility-types';
import { z } from 'zod';
import type { Album } from '../album/types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/index';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';
import { TagCategory, TagRarity, TagSortCriteria, TagViewMode } from './enums';

/**
 * Interfaz base para etiqueta
 */
export interface TagBase {
    id: string;
    name: string;
    emoji: string;
    color: string;
    description: Nullable<string>;
    shortcut: Nullable<string>;
    category: TagCategory;
    rarity: TagRarity;
    viewMode: TagViewMode;
    sortBy: JSONString<TagSortCriteria>;
    filters: JSONString<TagFilters>;
    featuredImage: Nullable<string>;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interfaz extendida que incluye relaciones
 */
export interface TagWithRelations extends TagBase {
    // Relaciones con contenido
    images?: Image[];
    videos?: Video[];

    // Relaciones con entidades principales
    albums?: Album[];
    collections?: Collection[];
    characters?: Character[];
    places?: Place[];
    worldItems?: WorldItem[];
    concepts?: Concept[];
    prompts?: Prompt[];
    notes?: Note[];
    wildcards?: Wildcard[];
    properties?: Property[];
    groups?: Group[];

    // Contadores
    _count?: {
        images: number;
        videos: number;
        albums: number;
        collections: number;
        characters: number;
        places: number;
        worldItems: number;
        concepts: number;
        prompts: number;
        notes: number;
        wildcards: number;
        properties: number;
        groups: number;
    };
}

/**
 * Interfaz para crear una etiqueta
 */
export interface CreateTagData {
    name: string;
    emoji?: string;
    color?: string;
    description?: Nullable<string>;
    shortcut?: Nullable<string>;
    category?: TagCategory;
    rarity?: TagRarity;
    viewMode?: TagViewMode;
    sortBy?: TagSortCriteria | string;
    filters?: TagFilters | string;
    featuredImage?: Nullable<string>;
    isFavorite?: boolean;
    groupIds?: string[];
    propertyIds?: string[];
    wildcardIds?: string[];
}

/**
 * Interfaz para actualizar una etiqueta
 */
export interface UpdateTagData extends Partial<CreateTagData> {}

/**
 * Interfaz para filtros de búsqueda de etiquetas
 */
export interface TagFilters {
    searchQuery?: string;
    categories?: TagCategory[];
    rarities?: TagRarity[];
    viewModes?: TagViewMode[];
    onlyFavorites?: boolean;
    hasImages?: boolean;
    hasVideos?: boolean;
    minRelations?: number;
    maxRelations?: number;
}

/**
 * Interfaz para etiquetas relacionadas
 */
export interface RelatedTag extends TagBase {
    strength: number;
    lastUsedTogether: Date;
    usageCount: number;
}

/**
 * Interfaz para respuesta de relación tag-imagen
 */
export interface TagImageRelationResponse {
    tagId: string;
    imageId: string;
    confidence: number;
    source: string;
    addedAt: Date;
}

/**
 * Validación Zod para filtros
 */
export const tagFilterSchema = z.object({
    searchQuery: z.string().optional(),
    categories: z.array(z.nativeEnum(TagCategory)).optional(),
    rarities: z.array(z.nativeEnum(TagRarity)).optional(),
    viewModes: z.array(z.nativeEnum(TagViewMode)).optional(),
    onlyFavorites: z.boolean().optional(),
    hasImages: z.boolean().optional(),
    hasVideos: z.boolean().optional(),
    minRelations: z.number().min(0).optional(),
    maxRelations: z.number().min(0).optional()
});

/**
 * Schema Zod para Tag
 */
export const tagSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    emoji: z.string(),
    color: z.string(),
    description: z.string().nullable(),
    shortcut: z.string().nullable(),
    category: z.nativeEnum(TagCategory),
    rarity: z.nativeEnum(TagRarity),
    viewMode: z.nativeEnum(TagViewMode),
    sortBy: z.string(),
    filters: z.string(),
    featuredImage: z.string().nullable(),
    isFavorite: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export type TagFilter = z.infer<typeof tagFilterSchema>;
export type TagValidated = z.infer<typeof tagSchema>;