/**
 * @file Tipos unificados para la entidad Group
 * @module types/entities/group/types
 */

import type { CacheExpirationPolicy } from '@/types/cache';
import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import type { FileItem } from '@/types/file-item';
import { SearchOperator } from '@/types/search';
import type { BaseEntity } from '@/types/store.types';
import { z } from 'zod';

// 🔄 Definición para campos que pueden ser nulos
type Nullable<T> = T | null;

/**
 * 🔄 Tipo base para Group - Alineado con el esquema Prisma
 */
export interface GroupBase extends BaseEntity {
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
 * 📊 Conteos de relaciones de Group
 */
export interface GroupCount {
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
}

/**
 * 📈 Estadísticas extendidas
 */
export interface GroupWithStats extends GroupBase {
	_count: GroupCount;
	totalEntities: number;
	lastUpdated: Date;
}

/**
 * 🔗 Relaciones de Group - Alineado con el esquema Prisma
 */
export interface GroupRelations {
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
}

/**
 * 📁 Group con archivos
 */
export interface GroupWithFiles extends GroupBase {
	files: FileItem[];
}

/**
 * 🎯 Filtros específicos para Group
 */
export interface GroupFilters {
	search?: string;
	categories?: string[];
	tags?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	isFavorite?: boolean;
	hasImages?: boolean;
	hasVideos?: boolean;
	hasAlbums?: boolean;
	hasCollections?: boolean;
}

/**
 * 🔍 Filtros avanzados para Group
 */
export interface GroupAdvancedFilter {
	field: string;
	operator: SearchOperator;
	value: unknown;
	isActive: boolean;
}

/**
 * ⏱️ Configuración de caché para grupos
 */
export interface GroupCacheConfig {
	enabled: boolean;
	expirationPolicy: CacheExpirationPolicy;
	ttl: number; // tiempo en milisegundos
	maxItems: number;
}

/**
 * 📝 Datos para crear un Group
 */
export interface CreateGroupData {
	name: string;
	description?: Nullable<string>;
	emoji?: string;
	color?: string;
	category?: Nullable<string>;
	shortcut?: Nullable<string>;
	isFavorite?: boolean;
	sortBy?: string;
	filters?: string;
	featuredImage?: Nullable<string>;
}

/**
 * 📝 Datos para actualizar un Group
 */
export interface UpdateGroupData extends Partial<CreateGroupData> {}

/**
 * 🔢 Modos de visualización para Group
 */
export enum GroupViewMode {
	GRID = 'grid',
	LIST = 'list',
	TABLE = 'table',
}

/**
 * 🔄 Criterios de ordenación para Group
 */
export enum GroupSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
}

/**
 * 🔍 Opciones para el listado de Group
 */
export interface GroupListOptions {
	viewMode: GroupViewMode;
	sortBy: GroupSortCriteria;
	filterBy?: GroupFilters;
	advancedFilters?: GroupAdvancedFilter[];
	page: number;
	pageSize: number;
	includeCount: boolean;
	includeStats: boolean;
}

/**
 * 🔍 Resultado de búsqueda para Group
 */
export interface GroupSearchResult {
	items: GroupWithStats[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
	sortBy: string;
	filterBy?: GroupFilters;
}

/**
 * 🔍 Esquema de validación para Group Filter
 */
export const groupFilterSchema = z.object({
	type: z.enum(['tag', 'character', 'place', 'concept', 'worldItem']),
	operator: z.enum(['AND', 'OR', 'NOT']),
	value: z.union([z.string(), z.number(), z.boolean()]),
	field: z.string().optional(),
});

/**
 * 🔍 Esquema de validación para Group Advanced Filter
 */
export const groupAdvancedFilterSchema = z.object({
	field: z.string(),
	operator: z.nativeEnum(SearchOperator),
	value: z.unknown(),
	isActive: z.boolean(),
});

/**
 * 🔍 Esquema de validación para Group - Alineado con el esquema Prisma
 */
export const groupSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	description: z.string().nullable(),
	emoji: z.string(),
	color: z.string(),
	category: z.string().nullable(),
	shortcut: z.string().nullable(),
	sortBy: z.string(),
	filters: z.string(),
	isFavorite: z.boolean(),
	featuredImage: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 🔍 Esquema de validación para GroupListOptions
 */
export const groupListOptionsSchema = z.object({
	viewMode: z.nativeEnum(GroupViewMode),
	sortBy: z.nativeEnum(GroupSortCriteria),
	filterBy: z
		.object({
			query: z.string().optional(),
			categories: z.array(z.string()).optional(),
			isFavorite: z.boolean().optional(),
			withImages: z.boolean().optional(),
			withVideos: z.boolean().optional(),
		})
		.optional(),
	advancedFilters: z.array(groupAdvancedFilterSchema).optional(),
	page: z.number().positive(),
	pageSize: z.number().positive(),
	includeCount: z.boolean(),
	includeStats: z.boolean(),
});

/**
 * 🔍 Tipos inferidos de los esquemas Zod
 */
export type GroupFilter = z.infer<typeof groupFilterSchema>;
export type GroupAdvancedFilterValidated = z.infer<typeof groupAdvancedFilterSchema>;
export type GroupValidated = z.infer<typeof groupSchema>;
export type GroupListOptionsValidated = z.infer<typeof groupListOptionsSchema>;

/**
 * 🔍 Esquema de validación completo para Group
 */
export const GroupSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
});

/**
 * 🔄 Group completo con todas las relaciones - Alineado con Prisma
 */
export interface GroupComplete extends GroupBase, GroupRelations {
	_count?: Partial<GroupCount>;
}

/**
 * 📝 Datos para crear un Group completo - Alineado con Prisma
 */
export type GroupCreateInput = Omit<GroupBase, 'id' | 'createdAt' | 'updatedAt'> & Partial<GroupRelations>;

/**
 * 📝 Datos para actualizar un Group completo - Alineado con Prisma
 */
export type GroupUpdateInput = Partial<Omit<GroupBase, 'id'>> & Partial<GroupRelations>;

/**
 * 🔍 Opciones de búsqueda para Group
 */
export interface GroupSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof GroupBase]?: 'asc' | 'desc';
	};
	where?: GroupFilters;
	include?: {
		[key in keyof GroupRelations]?: boolean;
	};
}

/**
 * 🎯 Opciones para el transformer de Group
 */
export interface GroupTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	validateFields?: boolean;
	customFields?: (keyof GroupComplete)[];
}
