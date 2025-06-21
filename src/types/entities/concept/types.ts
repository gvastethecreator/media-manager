/**
 * @file Tipos canónicos para la entidad Concept
 * @module types/entities/concept/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Concept.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';
import type { AlbumComplete } from '../album';
import type { CharacterComplete } from '../character';
import type { CollectionComplete } from '../collection';
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

/**
 * Tipo base canónico para Concept
 */
export interface ConceptBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	content: string;
	category: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Tipo completo para Concept con todas las relaciones y datos
 */
export interface ConceptComplete extends ConceptBase {
	images?: ImageComplete[];
	videos?: VideoComplete[];
	albums?: AlbumComplete[];
	collections?: CollectionComplete[];
	tags?: TagComplete[];
	characters?: CharacterComplete[];
	places?: PlaceComplete[];
	worldItems?: WorldItemComplete[];
	prompts?: PromptComplete[];
	notes?: NoteComplete[];
	wildcards?: WildcardComplete[];
	properties?: PropertyComplete[];
	groups?: GroupComplete[];
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * Tipo para items en listados de conceptos
 */
export interface ConceptListItem {
	id: string;
	name: string;
	emoji: string;
	color: string;
	category: string;
	isFavorite: boolean;
	itemType: 'concept';
}

/**
 * Input para creación
 */
export interface ConceptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content: string;
	category?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	// Relaciones por ID
	imageIds?: string[];
	videoIds?: string[];
	albumIds?: string[];
	collectionIds?: string[];
	tagIds?: string[];
	characterIds?: string[];
	placeIds?: string[];
	worldItemIds?: string[];
	promptIds?: string[];
	noteIds?: string[];
	wildcardIds?: string[];
	propertyIds?: string[];
	groupIds?: string[];
}

/**
 * Input para actualización
 */
export type ConceptUpdateInput = Partial<ConceptCreateInput>;

/**
 * Opciones de búsqueda para conceptos
 */
export interface ConceptSearchOptions {
	filters?: {
		search?: string;
		category?: string | string[];
		tags?: string[];
		onlyFavorites?: boolean;
	};
	skip?: number;
	take?: number;
	orderBy?: {
		[key: string]: 'asc' | 'desc';
	};
	includeCount?: boolean;
	includeRelations?: boolean;
}

/**
 * Resultado de búsqueda de conceptos
 */
export interface ConceptSearchResult {
	items: ConceptComplete[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

/**
 * Filtros para búsqueda de conceptos
 */
export interface ConceptFilters {
	search?: string;
	category?: string | string[];
	tags?: string[];
	onlyFavorites?: boolean;
}

/**
 * Concepto extendido con propiedades adicionales para UI
 */
export interface ConceptExtended extends ConceptComplete {
	isSelected?: boolean;
	isHighlighted?: boolean;
	previewContent?: string;
	lastUpdated?: Date;
	importance?: number;
}

/**
 * Concepto con estadísticas calculadas
 */
export interface ConceptWithStats extends ConceptComplete {
	stats: {
		imageCount: number;
		tagCount: number;
		noteCount: number;
		totalContentItems: number;
		lastUpdated: Date;
	};
}

/**
 * Opciones de ordenación para conceptos
 */
export enum ConceptSortOption {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	CREATED_AT_ASC = 'created_at_asc',
	CREATED_AT_DESC = 'created_at_desc',
	UPDATED_AT_ASC = 'updated_at_asc',
	UPDATED_AT_DESC = 'updated_at_desc',
}

/**
 * Modos de vista para conceptos
 */
export enum ConceptViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
}

/**
 * Esquema Zod para validación de Concept
 */
export const ConceptSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable(),
	content: z.string(),
	category: z.string(),
	featuredImage: z.string().nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con ConceptSchema antes de persistir.
