/**
 * @file Tipos para la entidad Tag
 * @module types/entities/tag/types
 */

import { z } from 'zod';
import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';

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
