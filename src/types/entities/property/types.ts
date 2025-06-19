/**
 * @file Tipos canónicos para la entidad Property
 * @module types/entities/property/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Property.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Criterios de ordenación para propiedades
 */
export enum PropertySortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	USAGE_ASC = 'usage:asc',
	USAGE_DESC = 'usage:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	UPDATED_ASC = 'updatedAt:asc',
	UPDATED_DESC = 'updatedAt:desc',
}

/**
 * Modos de visualización para propiedades
 */
export enum PropertyViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
	COMPACT = 'compact',
}

/**
 * Tipo base canónico para Property - CORREGIDO para coincidir exactamente con Prisma
 */
export interface PropertyBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export interface PropertyCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Input para actualización
 */
export type PropertyUpdateInput = Partial<Omit<PropertyBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Esquema Zod para validación de Property
 */
export const PropertySchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Relaciones de la propiedad con otras entidades
 */
export interface PropertyRelations {
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	groups?: { id: string }[];
}

/**
 * Property con sus relaciones
 */
export interface PropertyWithRelations extends PropertyBase, PropertyRelations {}

/**
 * Tipo para Property con conteos de relaciones
 */
export interface PropertyWithCounts extends PropertyBase {
	_count: {
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
		groups: number;
	};
}

/**
 * Tipo completo de Property con relaciones y conteos
 */
export type PropertyComplete = PropertyWithRelations & PropertyWithCounts;

/**
 * Filtros para búsqueda de propiedades
 */
export interface PropertyFilters {
	searchQuery?: string;
	categories?: string[];
	onlyFavorites?: boolean;
}

/**
 * Opciones de búsqueda para propiedades
 */
export interface PropertySearchOptions {
	page?: number;
	pageSize?: number;
	sortBy?: PropertySortCriteria;
	filters?: PropertyFilters;
	include?: {
		images?: boolean;
		videos?: boolean;
		albums?: boolean;
		collections?: boolean;
		tags?: boolean;
		characters?: boolean;
		places?: boolean;
		worldItems?: boolean;
		concepts?: boolean;
		prompts?: boolean;
		notes?: boolean;
		wildcards?: boolean;
		groups?: boolean;
	};
}

/**
 * Resultado de búsqueda para propiedades
 */
export interface PropertySearchResult {
	items: PropertyWithRelations[];
	total: number;
	totalPages: number;
	page: number;
	pageSize: number;
}

/**
 * Mapeo de criterios de ordenación a campos
 */
export const PROPERTY_SORT_PROPERTY_MAP: { [key in PropertySortCriteria]: string } = {
	[PropertySortCriteria.NAME_ASC]: 'name',
	[PropertySortCriteria.NAME_DESC]: 'name',
	[PropertySortCriteria.USAGE_ASC]: 'usage',
	[PropertySortCriteria.USAGE_DESC]: 'usage',
	[PropertySortCriteria.CREATED_ASC]: 'createdAt',
	[PropertySortCriteria.CREATED_DESC]: 'createdAt',
	[PropertySortCriteria.UPDATED_ASC]: 'updatedAt',
	[PropertySortCriteria.UPDATED_DESC]: 'updatedAt',
};

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con PropertySchema antes de persistir.
