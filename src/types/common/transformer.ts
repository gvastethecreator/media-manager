import { z } from 'zod';
import type { UIFields } from '@/lib/utils/transformers/common';

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
	include?: Record<string, boolean>;
	orderBy?: Record<string, 'asc' | 'desc'>;
	skip?: number;
	take?: number;
	where?: Record<string, unknown>;
}

/**
 * 📝 Tipo para resultados de búsqueda
 */
export interface BaseSearchResult<T> {
	hasMore: boolean;
	items: T[];
	total: number;
}

/**
 * 🔄 Tipo para relaciones base
 */
export interface BaseRelations {
	albums?: boolean;
	characters?: boolean;
	collections?: boolean;
	concepts?: boolean;
	groups?: boolean;
	images?: boolean;
	notes?: boolean;
	places?: boolean;
	prompts?: boolean;
	properties?: boolean;
	tags?: boolean;
	videos?: boolean;
	wildcards?: boolean;
	worldItems?: boolean;
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
	categories?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
	isFavorite?: boolean;
	search?: string;
	tags?: string[];
}

/**
 * 🔄 Tipo para opciones de transformación
 */
export interface TransformerOptions {
	customFields?: string[];
	includeCount?: boolean;
	includeRelations?: boolean;
	validateFields?: boolean;
}

/**
 * 🛠️ Interfaz base para transformers
 */
export interface BaseTransformer<T, U, P = unknown> {
	extend(data: T, options?: TransformerOptions): Promise<T>;
	toDbFormat(data: Partial<T>): P;

	validate(data: unknown): T;
}
