/**
 * @file Tipos de datos para la entidad Album
 * @module types/entities/album/types
 */

import type { JSONString, Nullable } from '@/utils/types/utility-types';
import { z } from 'zod';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Group } from '../group/types';
import type { Image } from '../image/index';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Video } from '../video/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';
import { AlbumPrivacyLevel, AlbumSortCriteria, AlbumType, AlbumViewMode } from './enums';

/**
 * Interfaz base para álbum
 */
export interface AlbumBase {
    id: string;
    name: string;
    emoji: string;
    color: string;
    description: Nullable<string>;
    shortcut: Nullable<string>;
    category: Nullable<string>;
    type: AlbumType;
    privacyLevel: AlbumPrivacyLevel;
    viewMode: AlbumViewMode;
    /**
     * Criterio de ordenación serializado como string JSON
     */
    sortBy: JSONString<AlbumSortCriteria>;
    /**
     * Filtros serializados como string JSON
     */
    filters: JSONString<AlbumFilters>;
    featuredImage: Nullable<string>;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interfaz para campos personalizados de metadatos
 */
export interface AlbumCustomFields {
    source?: string;
    tags?: string[];
    description?: string;
    rating?: number;
    keywords?: string[];
    [key: string]: unknown;
}

/**
 * Interfaz para ubicación en metadatos
 */
export interface AlbumLocation {
    name: string;
    latitude: number;
    longitude: number;
    count: number;
}

/**
 * Metadatos del álbum
 */
export interface AlbumMetadata {
    itemCount: number;
    imageCount: number;
    videoCount: number;
    totalSize: number;
    dateRange: {
        from: Nullable<Date>;
        to: Nullable<Date>;
    };
    locations: AlbumLocation[];
    customFields?: AlbumCustomFields;
    coverImageUrl: Nullable<string>;
    thumbnailUrls: string[];
    lastModified: Date;
}

/**
 * Elemento de álbum (para relaciones)
 */
export interface AlbumItem {
    id: string;
    albumId: string;
    itemId: string;
    itemType: 'image' | 'video';
    sortOrder: number;
    addedAt: Date | string;
    coverForAlbum?: boolean;
}

/**
 * Configuración de visualización del álbum
 */
export interface AlbumViewConfig {
    theme?: string;
    layout?: string;
    showDates?: boolean;
    showLocations?: boolean;
    showDescriptions?: boolean;
    thumbnailSize?: 'small' | 'medium' | 'large';
    enableTransitions?: boolean;
    coverImageFit?: 'contain' | 'cover';
    backgroundColor?: string;
    customCss?: string;
}

/**
 * Interfaz para filtros de álbum
 */
export interface AlbumFilters {
    tags?: string[];
    categories?: string[];
    dateRange?: {
        from?: Date;
        to?: Date;
    };
    locations?: string[];
    itemTypes?: ('image' | 'video')[];
    hasItems?: boolean;
    isFavorite?: boolean;
}

/**
 * Datos para crear un álbum
 */
export interface CreateAlbumData {
    name: string;
    description?: Nullable<string>;
    coverImageId?: Nullable<string>;
    type?: AlbumType;
    parentId?: Nullable<string>;
    privacyLevel?: AlbumPrivacyLevel;
    viewMode?: AlbumViewMode;
    sortBy?: AlbumSortCriteria | string;
    filters?: AlbumFilters | string;
    items?: Array<{
        itemId: string;
        itemType: 'image' | 'video';
    }>;
    viewConfig?: Partial<AlbumViewConfig>;
    groupIds?: string[];
    propertyIds?: string[];
    wildcardIds?: string[];
}

/**
 * Datos para actualizar un álbum
 */
export interface UpdateAlbumData extends Partial<CreateAlbumData> {}

/**
 * Interfaz extendida para álbum con todas las propiedades
 */
export interface Album extends AlbumBase {
    // Relaciones con contenido
    images?: Image[];
    videos?: Video[];

    // Relaciones con entidades principales
    collections?: Collection[];
    /**
     * Relación con etiquetas
     * @remarks Renombrar a tagEntities si se añade un campo tags como string JSON
     */
    tags?: Tag[];
    characters?: Character[];
    places?: Place[];
    worldItems?: WorldItem[];
    concepts?: Concept[];
    prompts?: Prompt[];
    notes?: Note[];
    wildcards?: Wildcard[];
    properties?: Property[];
    groups?: Group[];

    // Metadatos
    metadata?: AlbumMetadata;

    // Configuración
    viewConfig?: AlbumViewConfig;

    // Para UI
    isExpanded?: boolean;
    isSelected?: boolean;

    // Contadores
    _count?: {
        images?: number;
        videos?: number;
        collections?: number;
        tags?: number;
        characters?: number;
        places?: number;
        worldItems?: number;
        concepts?: number;
        prompts?: number;
        notes?: number;
        wildcards?: number;
        properties?: number;
        groups?: number;
    };
}

// Validaciones Zod actualizadas
export const albumFilterSchema = z.object({
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    dateRange: z.object({
        from: z.date().nullable().optional(),
        to: z.date().nullable().optional(),
    }).optional(),
    locations: z.array(z.string()).optional(),
    itemTypes: z.array(z.enum(['image', 'video'])).optional(),
    hasItems: z.boolean().optional(),
    isFavorite: z.boolean().optional()
});

export const albumSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    emoji: z.string(),
    color: z.string(),
    description: z.string().nullable(),
    shortcut: z.string().nullable(),
    category: z.string().nullable(),
    type: z.nativeEnum(AlbumType),
    privacyLevel: z.nativeEnum(AlbumPrivacyLevel),
    viewMode: z.nativeEnum(AlbumViewMode),
    sortBy: z.string(),
    filters: z.string(),
    featuredImage: z.string().nullable(),
    isFavorite: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export type AlbumFilter = z.infer<typeof albumFilterSchema>;
export type AlbumValidated = z.infer<typeof albumSchema>;
