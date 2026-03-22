/**
 * @file Tipos canónicos para la entidad Note
 * @module types/entities/note/types
 * @description Estructura unificada y validada para Note. Todos los campos clave son obligatorios.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';
import type { AlbumWithStats } from '../album';
import type { CharacterWithStats } from '../character';
import type { CollectionWithStats } from '../collection';
import type { ConceptWithStats } from '../concept';
import type { GroupWithStats } from '../group';
import type { ImageComplete } from '../image';
import type { PlaceComplete } from '../place';
import type { PromptComplete } from '../prompt';
import type { PropertyComplete } from '../property';
import type { TagWithStats } from '../tag';
import type { VideoWithStats } from '../video';
import type { WildcardWithStats } from '../wildcard';
import type { WorldItemWithStats } from '../world-item';

/**
 * 📝 Tipo base canónico para Note
 */
export interface NoteBase {
	category: string;
	color?: string | null;
	content: string;
	createdAt: Date;
	emoji?: string | null;
	featuredImage: string | null;
	id: string;
	isFavorite: boolean;
	presetId: string | null;
	priority: number;
	status: string;
	summary?: string;
	tags?: any;
	title: string;
	updatedAt: Date;
}

/**
 * 🆕 Datos para crear un Note
 */
export interface NoteCreateInput {
	albums?: string[];
	category?: string;
	characters?: string[];
	collections?: string[];
	color?: string;
	concepts?: string[];
	content?: string;
	emoji?: string;
	featuredImage?: string | null;
	groups?: string[];
	images?: string[];
	isFavorite?: boolean;
	places?: string[];
	presetId?: string | null;
	priority?: number;
	prompts?: string[];
	properties?: string[];
	status?: string;
	summary?: string;
	tags?: string[];
	title: string;
	videos?: string[];
	wildcards?: string[];
	worldItems?: string[];
}

/**
 * 📝 Datos para actualizar un Note
 */
export interface NoteUpdateInput {
	albums?: string[];
	category?: string;
	characters?: string[];
	collections?: string[];
	color?: string;
	concepts?: string[];
	content?: string;
	emoji?: string;
	featuredImage?: string | null;
	groups?: string[];
	images?: string[];
	isFavorite?: boolean;
	places?: string[];
	presetId?: string | null;
	priority?: number;
	prompts?: string[];
	properties?: string[];
	status?: string;
	summary?: string;
	tags?: string[];
	title?: string;
	videos?: string[];
	wildcards?: string[];
	worldItems?: string[];
}

/**
 * 🔎 Filtros de búsqueda para Note
 */
export interface NoteFilters {
	categories?: string[];
	contentContains?: string;
	hasImages?: boolean;
	hasTags?: boolean;
	hasVideos?: boolean;
	onlyFavorites?: boolean;
	priorities?: number[];
	searchQuery?: string;
	statuses?: string[];
}

/**
 * 🔎 Opciones de búsqueda para Note
 */
export interface NoteSearchOptions {
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
	orderBy?: {
		[key in keyof NoteBase]?: 'asc' | 'desc';
	};
	skip?: number;
	take?: number;
	where?: NoteFilters;
}

/**
 * 📊 Resultado de búsqueda de Notes
 */
export interface NoteSearchResult {
	hasMore: boolean;
	items: NoteComplete[];
	total: number;
}

/**
 * 🛠️ Opciones para el transformer de Note
 */
export interface NoteTransformerOptions {
	customFields?: (keyof NoteComplete)[];
	deserializeFields?: boolean;
	includeCount?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
	validateFields?: boolean;
}

/**
 * 🔗 Interfaz para notas relacionadas
 */
export interface RelatedNote {
	category?: string;
	count: number;
	excerpt?: string;
	id: string;
	strength: number;
	title: string;
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

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas de Note
 */
export interface NoteStatistics extends EntityStats {
	completionScore: number;

	// File system functions
	isDirectory: boolean;
	isFile: boolean;
	readingTime: number;
	wordCount: number;
}

/**
 * 📝 Note completo con relaciones
 */
export interface NoteComplete extends NoteBase {
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
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
	collections?: CollectionWithStats[];
	concepts?: ConceptWithStats[];
	entityType: 'note';
	groups?: GroupWithStats[];
	// Relaciones
	images?: ImageComplete[];
	places?: PlaceComplete[];
	prompts?: PromptComplete[];
	properties?: PropertyComplete[];
	tags?: TagWithStats[];
	videos?: VideoWithStats[];
	wildcards?: WildcardWithStats[];
	worldItems?: WorldItemWithStats[];
}

/**
 * 📊 Note con estadísticas
 */
export interface NoteWithStats extends NoteBase {
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
	description: string | null; // Alias para summary o content
	entityType: 'note';
	// Propiedades requeridas para compatibilidad con AnyEntityWithStats
	name: string; // Alias para title
	stats: NoteStatistics; // Campo principal (statistics es alias legacy)
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
