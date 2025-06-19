/**
 * @file Tipos canónicos para la entidad Collection
 * @module types/entities/collection/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Collection.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';
import { CollectionCategory, CollectionRarity } from './enums';

/**
 * Tipo base canónico para Collection
 */
export interface CollectionBase {
	id: string;
	name: string;
	description?: string;
	type: string;
	category?: string;
	tags?: string[];
	isPublic: boolean;
	isFavorite: boolean;
	metadata?: Record<string, unknown>;
	settings?: {
		sortBy?: string;
		viewMode?: string;
		gridSize?: number;
		showThumbnails?: boolean;
		showDetails?: boolean;
	};
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export interface CollectionCreateInput extends Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'> {
	// Relaciones opcionales por ids
	imageIds?: string[];
	tagIds?: string[];
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
}

/**
 * Input para actualización
 */
export type CollectionUpdateInput = Partial<Omit<CollectionBase, 'id' | 'createdAt' | 'updatedAt'>> & {
	imageIds?: string[];
	tagIds?: string[];
	groupIds?: string[];
	propertyIds?: string[];
	wildcardIds?: string[];
};

/**
 * Filtros para búsqueda de colecciones
 */
export interface CollectionFilters {
	search?: string;
	isFavorite?: boolean;
	category?: CollectionCategory[];
	rarity?: CollectionRarity[];
	tagIds?: string[];
	imageCount?: {
		min?: number;
		max?: number;
	};
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * Opciones de búsqueda para colecciones
 */
export interface CollectionSearchOptions {
	filters?: CollectionFilters;
	skip?: number;
	take?: number;
	orderBy?: {
		[key: string]: 'asc' | 'desc';
	};
	include?: {
		images?: boolean;
		tags?: boolean;
		groups?: boolean;
		properties?: boolean;
		wildcards?: boolean;
	};
}

/**
 * Información de ordenación para colecciones
 */
export interface CollectionSortBy {
	field: string;
	direction: 'asc' | 'desc';
	priority?: number;
}

/**
 * Información de una edición de colección
 */
export interface CollectionEdition {
	id: string;
	name: string;
	number: number;
	totalItems: number;
	releaseDate?: Date;
	isLimited: boolean;
	price?: number;
	currency?: string;
	description?: string;
}

/**
 * Esquema Zod para validación de Collection
 */
export const CollectionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	type: z.string(),
	category: z.string().optional(),
	tags: z.array(z.string()).optional(),
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	settings: z
		.object({
			sortBy: z.string().optional(),
			viewMode: z.string().optional(),
			gridSize: z.number().optional(),
			showThumbnails: z.boolean().optional(),
			showDetails: z.boolean().optional(),
		})
		.optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Filtro para colecciones (usado en CollectionExtended)
 */
export interface CollectionFilter {
	field: string;
	operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between';
	value: string | number | boolean | Date | string[] | number[];
}

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con CollectionSchema antes de persistir.
