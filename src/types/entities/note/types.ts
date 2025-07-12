/**
 * @file Tipos canónicos para la entidad Note
 * @module types/entities/note/types
 * @description Estructura unificada y validada para Note. Todos los campos clave son obligatorios.
 * Última migración: 2025-06-18
 */

import type { z } from 'zod';
import type { AlbumWithStats } from '../album';
import type { CharacterWithStats } from '../character';
import type { CollectionWithStats } from '../collection';
import type { ConceptComplete } from '../concept';
import type { GroupWithStats } from '../group';
import type { ImageComplete } from '../image';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagWithStats } from '../tag';
import type { VideoWithStats } from '../video';
import type { WildcardWithStats } from '../wildcard';
import type { WorldItemWithStats } from '../world-item';
import { z } from 'zod';

/**
 * 📝 Tipo base canónico para Note
 */
export interface NoteBase {
	id: string;
	title: string;
	content: string;
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
 * 🆕 Datos para crear un Note
 */
export interface NoteCreateInput {
	title: string;
	content?: string;
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
 * 🏷️ Enumeraciones y tipos auxiliares
 */
export enum NoteStatus {
	ACTIVE = 'active',
	ARCHIVED = 'archived',
	COMPLETED = 'completed',
	DRAFT = 'draft',
	PENDING = 'pending',
}

export enum NoteCategory {
	GENERAL = 'general',
	STORY = 'story',
	LORE = 'lore',
	MECHANICS = 'mechanics',
	CHARACTER = 'character',
	PLACE = 'place',
	WORLD_ITEM = 'world_item',
	PROMPT = 'prompt',
	IDEA = 'idea',
	TODO = 'todo',
}

export enum NotePriority {
	LOWEST = 0,
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
	HIGHEST = 4,
}

export enum NoteSortCriteria {
	TITLE_ASC = 'title:asc',
	TITLE_DESC = 'title:desc',
	PRIORITY_ASC = 'priority:asc',
	PRIORITY_DESC = 'priority:desc',
	STATUS_ASC = 'status:asc',
	STATUS_DESC = 'status:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
}

/**
 * 📋 Opciones de ordenamiento para UI
 */
export enum NoteViewMode {
	GRID = 'grid',
	LIST = 'list',
	CARDS = 'cards',
	COMPACT = 'compact',
	DETAIL = 'detail',
}

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
};

/**
 * 📊 Estadísticas de Note
 */
export interface NoteStatistics {
	imageCount: number;
	videoCount: number;
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;
	wordCount: number;
	readingTime: number;
	completionScore: number;
	totalItems: number;
}

/**
 * 📝 Note completo con relaciones
 */
export interface NoteComplete extends NoteBase {
	// Relaciones
	images?: ImageComplete[];
	videos?: VideoWithStats[];
	albums?: AlbumWithStats[];
	collections?: CollectionWithStats[];
	tags?: TagWithStats[];
	characters?: CharacterWithStats[];
	places?: PlaceComplete[];
	worldItems?: WorldItemWithStats[];
	concepts?: ConceptWithStats[];
	prompts?: PromptComplete[];
	wildcards?: WildcardWithStats[];
	properties?: PropertyComplete[];
	groups?: GroupWithStats[];

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
	statistics?: NoteStatistics;
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
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	parentId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Tipos inferidos de Zod
export type NoteValidated = z.infer<typeof NoteSchema>;

// Alias para compatibilidad
export type NoteStats = NoteStatistics;
