/**
 * @file Tipos canónicos para la entidad Tag
 * @module types/entities/tag/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Tag.
 * Última migración: 2025-06-18
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';
import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
import type { ConceptComplete } from '../concept';
import type { GroupComplete } from '../group';
import type { ImageComplete as Image } from '../image';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { VideoComplete as Video } from '../video';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';

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
 * 📝 Tipo base para Tag - definición canónica sin dependencias de Prisma
 */
export interface TagBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string;
	// ELIMINADO: sortBy y filters no existen en el modelo Tag de Prisma
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

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
 * 🔗 Relaciones de Tag
 */
export interface TagRelations {
	images?: Image[];
	videos?: Video[];
	albums?: AlbumComplete[];
	collections?: CollectionComplete[];
	characters?: CharacterComplete[];
	places?: PlaceComplete[];
	worldItems?: WorldItemComplete[];
	concepts?: ConceptComplete[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardComplete[];
	properties?: PropertyComplete[];
	groups?: GroupComplete[];
}

/**
 * 🔢 Contadores de relaciones
 */
export interface TagCounts {
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
}

/**
 * 🌟 Tag con relaciones y conteos
 */
export interface TagWithRelations extends TagBase, TagRelations {
	_count?: TagCounts;
}

/**
 * 📊 Tag con estadísticas calculadas
 */
export interface TagWithStats extends TagBase {
	_count: TagCounts;
	totalAssociations: number;
}

/**
 * 🔍 Filtros para búsqueda de etiquetas
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
 * ➕ Input para crear una nueva etiqueta
 */
export interface TagCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	images?: { connect: { id: string }[] };
	videos?: { connect: { id: string }[] };
}

/**
 * 🔄 Input para actualizar una etiqueta
 */
export interface TagUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	images?: { set?: { id: string }[] };
	videos?: { set?: { id: string }[] };
}

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
	items: Tag[];
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

/**
 * 📊 Tipo principal para Tag
 */
export type Tag = TagBase;

/* Exportación de tipos adicionales para retrocompatibilidad */
export type { TagCreateInput as CreateTagData, TagUpdateInput as UpdateTagData };

// Alias para compatibilidad
export type TagComplete = TagWithRelations;

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con TagSchema antes de persistir.
