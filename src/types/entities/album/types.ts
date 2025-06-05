/**
 * @file Tipos para la entidad Album
 * @module types/entities/album/types
 */

import { BaseEntitySchema, MetadataFieldsSchema, UIFieldsSchema } from '@/types/common/transformer';
import { z } from 'zod';

/**
 * 🔍 Esquema de validación para Album
 */
export const AlbumSchema = z.object({
	...BaseEntitySchema.shape,
	...UIFieldsSchema.shape,
	...MetadataFieldsSchema.shape,
	name: z.string().min(1),
	description: z.string().nullable(),
	category: z.string(),
	shortcut: z.string().nullable(),
	sortBy: z.string(),
	filters: z.string(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean().default(false),
});

/**
 * 🔄 Tipo base para Album
 */
export interface AlbumBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category: string;
	sortBy: string;
	filters: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🔗 Relaciones de Album
 */
export interface AlbumRelations {
	images?: { id: string }[];
	videos?: { id: string }[];
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
	groups?: { id: string }[];
}

/**
 * 📊 Conteos de relaciones de Album
 */
export interface AlbumCounts {
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

/**
 * 🎯 Filtros específicos para Album
 */
export interface AlbumFilters {
	search?: string;
	categories?: string[];
	isFavorite?: boolean;
	hasImages?: boolean;
	hasVideos?: boolean;
	hasCollections?: boolean;
	minItems?: number;
	maxItems?: number;
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔄 Album completo con todas las relaciones
 */
export interface AlbumComplete extends AlbumBase, AlbumRelations, AlbumCounts {}

/**
 * 📝 Datos para crear un Album
 */
export type AlbumCreateInput = Omit<AlbumBase, 'id' | 'createdAt' | 'updatedAt'> & Partial<AlbumRelations>;

/**
 * 📝 Datos para actualizar un Album
 */
export type AlbumUpdateInput = Partial<Omit<AlbumBase, 'id'>> & Partial<AlbumRelations>;

/**
 * 🔍 Opciones de búsqueda para Album
 */
export interface AlbumSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		field: keyof AlbumBase;
		direction: 'asc' | 'desc';
	};
	where?: AlbumFilters;
	include?: {
		[key in keyof AlbumRelations]?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de Albums
 */
export interface AlbumSearchResult {
	items: AlbumComplete[];
	total: number;
	hasMore: boolean;
}

/**
 * 🎯 Opciones para el transformer de Album
 */
export interface AlbumTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	validateFields?: boolean;
	customFields?: (keyof AlbumComplete)[];
}

/**
 * 🔗 Interfaz para álbumes relacionados
 */
export interface RelatedAlbum {
	id: string;
	name: string;
	emoji: string;
	color: string;
	count: number;
}

// Tipos inferidos de Zod
export type AlbumValidated = z.infer<typeof AlbumSchema>;

// Constantes para paginación
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
