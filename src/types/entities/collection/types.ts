/**
 * @file Tipos canónicos para la entidad Collection
 * @module types/entities/collection/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Collection.
 * Última migración: 2025-06-18
 */

import type { Collection as PrismaCollection } from '@prisma/client';
import { z } from 'zod';
import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { ConceptComplete } from '../concept';
import type { GroupComplete } from '../group';
import type { ImageComplete } from '../image';
import type { NoteComplete } from '../note';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagComplete } from '../tag';
import type { VideoComplete } from '../video';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';
import { CollectionCategory } from './enums';

/**
 * 📚 Interfaz que representa el payload de Prisma para una colección, incluyendo las relaciones contadas.
 */
export type PrismaCollectionWithCounts = PrismaCollection & {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
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
};

/**
 * Tipo base canónico para Collection - CORREGIDO para coincidir con Prisma
 */
export interface CollectionBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	filters: string;
	// Propiedades externas (NFT/blockchain)
	url: string | null;
	alternativeUrl: string | null;
	sourceImage: string | null;
	platform: string | null;
	price: number | null;
	network: string | null;
	tokenId: string | null;
	tokenAddress: string | null;
	contractAddress: string | null;
	contractType: string | null;
	editions: string; // JSON serializado
	// Propiedades de visualización
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Collection con estadísticas calculadas y conteos
 */
export interface CollectionWithStats extends CollectionBase {
	_count?: {
		images: number;
		videos: number;
		albums: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
	stats: {
		totalItems: number;
		totalImages: number;
		totalVideos: number;
		totalEntities: number;
		lastUpdated: Date;
	};
}

/**
 * 📚 Configuración de visualización para colecciones.
 */
export interface CollectionViewConfig {
	mode: 'grid' | 'list' | 'table';
	gridColumns: number;
	cardSize: 'small' | 'medium' | 'large';
	showStats: boolean;
	showDescription: boolean;
	defaultView: 'cards' | 'details' | 'compact';
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	groupBy: 'category' | 'rarity' | 'platform' | null;
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
 * Esquema Zod para validación de Collection - CORREGIDO
 */
export const CollectionSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable(),
	shortcut: z.string().nullable(),
	category: z.string().nullable(),
	sortBy: z.string(),
	filters: z.string(),
	// Propiedades externas
	url: z.string().nullable(),
	alternativeUrl: z.string().nullable(),
	sourceImage: z.string().nullable(),
	platform: z.string().nullable(),
	price: z.number().nullable(),
	network: z.string().nullable(),
	tokenId: z.string().nullable(),
	tokenAddress: z.string().nullable(),
	contractAddress: z.string().nullable(),
	contractType: z.string().nullable(),
	editions: z.string(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * 📚 Estructura de un filtro para colecciones - CORREGIDO con operadores completos.
 */
export interface CollectionFilter {
	field: string;
	operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
	value: string | number | boolean | Date | string[] | number[];
}

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con CollectionSchema antes de persistir.
