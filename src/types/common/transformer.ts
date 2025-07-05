import { z } from 'zod';
import type { MetadataFields, UIFields } from '@/lib/utils/transformers/common';

/**
 * 🔍 Esquema base para validación de campos comunes
 */
export const BaseEntitySchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	sortBy: z.string().default('name'),
	filters: z.string().default('{}'),
});

/**
 * 🎨 Esquema para campos de UI
 */
export const UIFieldsSchema = z.object({
	emoji: z.string().optional(),
	color: z.string().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().default(false),
});

/**
 * 📊 Esquema para campos de metadata
 */
export const MetadataFieldsSchema = z.object({
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

/**
 * 🔄 Tipo base para entidades
 */
export interface BaseEntity extends z.infer<typeof BaseEntitySchema>, UIFields, MetadataFields {}

/**
 * 🔍 Tipo para opciones de búsqueda
 */
export interface BaseSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	where?: Record<string, unknown>;
	include?: Record<string, boolean>;
}

/**
 * 📝 Tipo para resultados de búsqueda
 */
export interface BaseSearchResult<T> {
	items: T[];
	total: number;
	hasMore: boolean;
}

/**
 * 🔄 Tipo para relaciones base
 */
export interface BaseRelations {
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
	properties?: boolean;
	groups?: boolean;
}

/**
 * 📊 Tipo para conteos de relaciones
 */
export interface BaseRelationCounts {
	_count?: {
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
		groups?: number;
	};
}

/**
 * 🎯 Tipo para filtros base
 */
export interface BaseFilters {
	search?: string;
	categories?: string[];
	tags?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	isFavorite?: boolean;
}

/**
 * 🔄 Tipo para opciones de transformación
 */
export interface TransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	validateFields?: boolean;
	customFields?: string[];
}

/**
 * 🛠️ Interfaz base para transformers
 */
export interface BaseTransformer<T, U, P = any> {
	toPrisma(data: Partial<T>): P;
	
	validate(data: unknown): T;
	extend(data: T, options?: TransformerOptions): Promise<T>;
}
