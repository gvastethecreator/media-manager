/**
 * @file Tipos canónicos para la entidad Note
 * @module types/entities/note/types
 * @description Estructura unificada y validada para Note. Todos los campos clave son obligatorios.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';
// Removed broken import - will define types here
import { NoteSortOption as NoteSortCriteria } from './enums';

// Re-export enums for direct access from types
export { NoteCategory, NotePriority, NoteSortOption as NoteSortCriteria, NoteStatus, NoteViewMode } from './enums';

// Import base entity types
import { EntityStats } from '../entity.types';

/**
 * 📝 Tipo base canónico para Note
 */
export interface NoteBase {
	id: string;
	title: string;
	content: string;
	summary?: string;
	emoji?: string | null;
	color?: string | null;
	category: string;
	priority: number;
	status: string;
	featuredImage: string | null;
	isFavorite: boolean;
	presetId: string | null;
	tags?: any;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas de Note
 */
export interface NoteStatistics extends EntityStats {
	wordCount: number;
	readingTime: number;
	completionScore: number;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
}

/**
 * 📝 Note con estadísticas
 */
export interface NoteWithStats extends NoteBase {
	stats: NoteStatistics; // Campo principal (statistics es alias legacy)
	statistics?: NoteStatistics; // Alias para retrocompatibilidad legacy
}

/**
 * 🆕 Datos para crear un Note
 */
export interface NoteCreateInput {
	title: string;
	content?: string;
	summary?: string;
	category?: string;
	priority?: number;
	status?: string;
	color?: string;
	emoji?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	presetId?: string | null;
	images?: string[];
	videos?: string[];
	albums?: string[];
	collections?: string[];
	tags?: string[];
	characters?: string[];
	places?: string[];
	worldItems?: string[];
	concepts?: string[];
	prompts?: string[];
	wildcards?: string[];
	properties?: string[];
	groups?: string[];
}

/**
 * 📝 Datos para actualizar un Note
 */
export interface NoteUpdateInput {
	title?: string;
	content?: string;
	summary?: string;
	category?: string;
	priority?: number;
	status?: string;
	color?: string;
	emoji?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	presetId?: string | null;
	images?: string[];
	videos?: string[];
	albums?: string[];
	collections?: string[];
	tags?: string[];
	characters?: string[];
	places?: string[];
	worldItems?: string[];
	concepts?: string[];
	prompts?: string[];
	wildcards?: string[];
	properties?: string[];
	groups?: string[];
}

/**
 * 🔎 Filtros de búsqueda para Note
 */
export interface NoteFilters {
	searchQuery?: string;
	categories?: string[];
	priorities?: number[];
	statuses?: string[];
	onlyFavorites?: boolean;
	contentContains?: string;
	hasTags?: boolean;
	hasImages?: boolean;
	hasVideos?: boolean;
}

/**
 * 🔎 Opciones de búsqueda para Note
 */
export interface NoteSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof NoteBase]?: 'asc' | 'desc';
	};
	where?: NoteFilters;
	include?: {
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
		wildcards?: boolean;
		properties?: boolean;
		groups?: boolean;
		_count?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de Notes
 */
export interface NoteSearchResult {
	items: NoteComplete[];
	total: number;
	hasMore: boolean;
}

/**
 * 🛠️ Opciones para el transformer de Note
 */
export interface NoteTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	validateFields?: boolean;
	deserializeFields?: boolean;
	includeUI?: boolean;
	customFields?: (keyof NoteComplete)[];
}

/**
 * 🔗 Interfaz para notas relacionadas
 */
export interface RelatedNote {
	id: string;
	title: string;
	excerpt?: string;
	category?: string;
	count: number;
	strength: number;
}

/**
 * 🔗 Interfaz para notas relacionadas
 */

export const NOTE_SORT_PROPERTY_MAP: Record<NoteSortCriteria, string> = {
	[NoteSortCriteria.TITLE_ASC]: 'title',
	[NoteSortCriteria.TITLE_DESC]: 'title',
	[NoteSortCriteria.PRIORITY_ASC]: 'priority',
	[NoteSortCriteria.PRIORITY_DESC]: 'priority',
	[NoteSortCriteria.STATUS_ASC]: 'status',
	[NoteSortCriteria.STATUS_DESC]: 'status',
	[NoteSortCriteria.CREATED_ASC]: 'createdAt',
	[NoteSortCriteria.CREATED_DESC]: 'createdAt',
	[NoteSortCriteria.UPDATED_ASC]: 'updatedAt',
	[NoteSortCriteria.UPDATED_DESC]: 'updatedAt',
	[NoteSortCriteria.CATEGORY_ASC]: 'category',
	[NoteSortCriteria.CATEGORY_DESC]: 'category',
};

/**
 * 📊 Estadísticas de Note (duplicated interface removed)
 */
export interface NoteStatisticsDuplicated extends EntityStats {
	wordCount: number;
	readingTime: number;
	completionScore: number;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
}

/**
 * 📝 Note completo con relaciones
 */
export interface NoteComplete extends NoteBase {
	entityType: 'note';
	// Relaciones - using any[] to avoid circular dependencies
	images?: any[];
	videos?: any[];
	albums?: any[];
	collections?: any[];
	tags?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];

	// Conteos
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
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * 📊 Note con estadísticas
 */
export interface NoteWithStats extends NoteBase {
	entityType: 'note';
	// Propiedades requeridas para compatibilidad con AnyEntityWithStats
	name: string; // Alias para title
	description: string | null; // Alias para summary o content
	stats: NoteStatistics; // Campo principal (statistics es alias legacy)
	_count?: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
}

// Esquema Zod para validación
export const NoteSchema = z.object({
	id: z.string(),
	title: z.string(),
	content: z.string().nullable(),
	excerpt: z.string().nullable(),
	category: z.string().nullable(),
	status: z.string().nullable(),
	priority: z.number().nullable(),
	tags: z.string().nullable(),

	isFavorite: z.boolean(),
	parentId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Tipos inferidos de Zod
export type NoteValidated = z.infer<typeof NoteSchema>;

// Alias para compatibilidad
export type NoteStats = NoteStatistics;
