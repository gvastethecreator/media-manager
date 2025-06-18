/**
 * @file Tipos canónicos para la entidad Tag
 * @module types/entities/tag/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Tag.
 * Última migración: 2025-06-18
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';

/**
 * 🔍 Esquema de validación para Tag
 */
export const TagSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	name: z.string().min(1),
	description: z.string().nullable(),
	category: z.string(),
	shortcut: z.string().nullable(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().default(false),
});

/**
 * Categorías de etiquetas
 */
export enum TagCategory {
	GENERAL = 'general',
	SUBJECT = 'subject',
	STYLE = 'style',
	COLOR = 'color',
	QUALITY = 'quality',
	TECHNIQUE = 'technique',
	COMPOSITION = 'composition',
	CONTENT = 'content',
	EMOTION = 'emotion',
	THEME = 'theme',
	GENRE = 'genre',
	CUSTOM = 'custom',
	OTHER = 'other',
}

/**
 * Rareza de etiquetas
 */
export enum TagRarity {
	COMMON = 'common',
	UNCOMMON = 'uncommon',
	RARE = 'rare',
	VERY_RARE = 'very_rare',
	LEGENDARY = 'legendary',
}

/**
 * Criterios de ordenación para etiquetas
 */
export enum TagSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	USAGE_ASC = 'usage:asc',
	USAGE_DESC = 'usage:desc',
	CREATED_ASC = 'createdAt:asc',
	CREATED_DESC = 'createdAt:desc',
	UPDATED_ASC = 'updatedAt:desc',
	UPDATED_DESC = 'updatedAt:desc',
}

/**
 * Modos de visualización para etiquetas
 */
export enum TagViewMode {
	GRID = 'grid',
	LIST = 'list',
	CLOUD = 'cloud',
	HIERARCHY = 'hierarchy',
}

/**
 * 🔄 Tipo base para Tag
 */
export interface TagBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🔗 Relaciones de Tag
 */
export interface TagRelations {
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
	properties?: { id: string }[];
	groups?: { id: string }[];
}

/**
 * 📊 Conteos de relaciones de Tag
 */
export interface TagCounts {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
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

/**
 * 🎯 Filtros específicos para Tag
 */
export interface TagFilters {
	search?: string;
	categories?: string[];
	isFavorite?: boolean;
	hasImages?: boolean;
	hasVideos?: boolean;
	hasAlbums?: boolean;
	hasCollections?: boolean;
	minRelations?: number;
	maxRelations?: number;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔄 Tag completo con todas las relaciones
 */
export interface TagComplete extends TagBase, TagRelations, TagCounts {}

/**
 * 📝 Datos para crear un Tag
 */
export type TagCreateInput = Omit<TagBase, 'id' | 'createdAt' | 'updatedAt'> & Partial<TagRelations>;

/**
 * 📝 Datos para actualizar un Tag
 */
export type TagUpdateInput = Partial<Omit<TagBase, 'id'>> & Partial<TagRelations>;

/**
 * 🔍 Opciones de búsqueda para Tag
 */
export interface TagSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof TagBase]?: 'asc' | 'desc';
	};
	where?: TagFilters;
	include?: {
		[key in keyof TagRelations]?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de Tags
 */
export interface TagSearchResult {
	items: TagComplete[];
	total: number;
	hasMore: boolean;
}

/**
 * 🎯 Opciones para el transformer de Tag
 */
export interface TagTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	validateFields?: boolean;
	customFields?: (keyof TagComplete)[];
}

/**
 * 🔗 Interfaz para etiquetas relacionadas
 */
export interface RelatedTag {
	id: string;
	name: string;
	emoji: string;
	color: string;
	count: number;
	strength: number;
}

/**
 * 📊 Interfaz para respuesta de relación tag-imagen
 */
export interface TagImageRelationResponse {
	tagId: string;
	imageId: string;
	confidence: number;
	source: string;
	addedAt: Date;
}

// Tipos inferidos de Zod
export type TagValidated = z.infer<typeof TagSchema>;

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con TagSchema antes de persistir.
