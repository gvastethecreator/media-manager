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
 * @placeholder Definición inicial
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
	type: GroupType;
	sortBy: string;
	filters: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	isShared: boolean;
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
 * Input para creación
 */
export interface GroupCreateInput {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	type?: GroupType;
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	isShared?: boolean;
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
	type: z.nativeEnum(GroupType).default(GroupType.DEFAULT),
	sortBy: z.string(),
	filters: z.string(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	isShared: z.boolean(),
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

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con GroupSchema antes de persistir.
