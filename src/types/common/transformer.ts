import { z } from 'zod';
import type { MetadataFields, UIFields } from '@/lib/utils/transformers/common';

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
	// createdAt y updatedAt ya están definidos en BaseEntitySchema
});

/**
 * 🔄 Tipo base para entidades
 */
import { BaseEntitySchema } from './base';

export interface BaseEntity extends z.infer<typeof BaseEntitySchema>, UIFields {
	// MetadataFields removido para evitar conflicto con createdAt/updatedAt de BaseEntitySchema
}

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
export interface BaseTransformer<T, U, P = unknown> {
	toDbFormat(data: Partial<T>): P;

	validate(data: unknown): T;
	extend(data: T, options?: TransformerOptions): Promise<T>;
}
