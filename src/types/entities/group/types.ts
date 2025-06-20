/**
 * @file Tipos canónicos para la entidad Group
 * @module types/entities/group/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Group.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Tipos de vista para grupos
 */
export enum GroupViewMode {
	GRID = 'grid',
	LIST = 'list',
}

/**
 * Tipos de grupos
 * @deprecated Este enum no se usa en el esquema actual de Prisma
 */
export enum GroupType {
	COLLECTION = 'collection',
	ALBUM = 'album',
	SMART = 'smart',
	DEFAULT = 'default',
}

/**
 * Criterios de ordenación para grupos
 */
export enum GroupSortCriteria {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	DATE_CREATED_ASC = 'date_created_asc',
	DATE_CREATED_DESC = 'date_created_desc',
	DATE_UPDATED_ASC = 'date_updated_asc',
	DATE_UPDATED_DESC = 'date_updated_desc',
	ITEMS_COUNT_ASC = 'items_count_asc',
	ITEMS_COUNT_DESC = 'items_count_desc',
}

/**
 * Estado de visualización para un grupo individual
 */
export interface GroupDisplayState {
	isExpanded: boolean;
	isVisible: boolean;
}

/**
 * Tipo base canónico para Group
 */
export interface GroupBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy: string;
	filters: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Tipo extendido que incluye contador de items
 */
export type Group = GroupBase & {
        itemsCount?: number;
};

/**
 * Relaciones asociadas a un Group 📎
 */
export interface GroupRelations {
        images?: Array<{ id: string }>;
        videos?: Array<{ id: string }>;
        albums?: Array<{ id: string }>;
        collections?: Array<{ id: string }>;
        tags?: Array<{ id: string }>;
        characters?: Array<{ id: string }>;
        places?: Array<{ id: string }>;
        worldItems?: Array<{ id: string }>;
        concepts?: Array<{ id: string }>;
        prompts?: Array<{ id: string }>;
        notes?: Array<{ id: string }>;
        wildcards?: Array<{ id: string }>;
        properties?: Array<{ id: string }>;
}

/**
 * Conteos de relaciones de un Group 🔢
 */
export interface GroupCounts {
        images?: number;
        videos?: number;
        albums?: number;
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
}

/**
 * Grupo completo con relaciones y conteos 🌟
 */
export type GroupComplete = GroupBase & GroupRelations & { _count: GroupCounts };

/**
 * Opciones para el transformador de grupos ⚙️
 */
export interface GroupTransformerOptions {
        includeRelations?: boolean;
        includeCount?: boolean;
}

/**
 * Versión extendida de Group para la UI ✨
 */
export interface GroupExtended extends GroupComplete {
        isSelected?: boolean;
        isHighlighted?: boolean;
        isEditing?: boolean;
        isExpanded?: boolean;
        isLoading?: boolean;
        hasError?: boolean;
        isDragging?: boolean;
        isDropTarget?: boolean;
}

/**
 * Input para creación
 */
export interface GroupCreateInput {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Input para actualización
 */
export type GroupUpdateInput = Partial<Omit<GroupBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Esquema Zod para validación de Group
 */
export const GroupSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	sortBy: z.string(),
	filters: z.string(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Tipo extendido para grupos con estadísticas y conteos de relaciones
 * Incluye la propiedad _count y un objeto stats calculado
 */
export type GroupWithStats = GroupBase & {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
	};
	stats?: {
		totalItems: number;
		totalImages: number;
		totalVideos: number;
		totalAlbums: number;
		totalCollections: number;
		totalTags: number;
		totalCharacters: number;
		totalPlaces: number;
		totalWorldItems: number;
		totalConcepts: number;
		totalPrompts: number;
		totalNotes: number;
		totalWildcards: number;
		totalProperties: number;
		lastUpdated: Date;
	};
};

/** Imagen para un elemento de lista de grupos 🖼️ */
export interface GroupListItemImage {
        url: string;
}

/** Elemento de lista para la vista de grupos */
export interface GroupListItem {
        id: string;
        name: string;
        emoji: string;
        color: string;
        category: string;
        isFavorite: boolean;
        selected: boolean;
        images: GroupListItemImage[];
        imageCount: number;
        videoCount: number;
        createdAt: Date;
        updatedAt: Date;
}

/** Tarjeta individual de grupo */
export interface GroupCard {
        id: string;
        name: string;
        emoji: string;
        color: string;
        category: string;
        description: string | null;
        isFavorite: boolean;
        selected: boolean;
        imageUrl: string;
        imageCount: number;
        videoCount: number;
        createdAt: Date;
        updatedAt: Date;
}

/** Parámetros de búsqueda para grupos */
export interface GroupSearchParams {
        search?: string;
        category?: string;
        isFavorite?: boolean;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
}

/** Resultado de búsqueda de grupos */
export interface GroupSearchResult {
        items: GroupListItem[];
        pagination: {
                page: number;
                pageSize: number;
                totalItems: number;
                totalPages: number;
                hasMore: boolean;
        };
}

/** Props para listado de grupos */
export interface GroupListProps {
        items: GroupListItem[];
        filters: Record<string, any>;
        pagination: {
                page: number;
                pageSize: number;
                totalItems: number;
                totalPages: number;
                hasMore: boolean;
        };
}

// Alias para compatibilidad con código existente
export type CreateGroupData = GroupCreateInput;
export type UpdateGroupData = GroupUpdateInput;

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con GroupSchema antes de persistir.
