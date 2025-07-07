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
import type { VideoComplete } from '../video';
import type { WildcardComplete } from '../wildcard';
import type { WorldItemComplete } from '../world-item';
import type { NoteSchema } from './schema';

/**
 * 📝 Tipo base canónico para Note
 */
export interface NoteBase {
	id: string;
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	color?: string;
	emoji?: string;
	featuredImage: string | null;
	isFavorite: boolean;
	presetId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🔗 Relaciones de Note optimizadas (usando tipos WithStats)
 */
export interface NoteRelations {
	albums?: AlbumWithStats[];
	characters?: CharacterWithStats[];
	collections?: CollectionWithStats[];
	concepts?: ConceptComplete[];
	groups?: GroupWithStats[];
	images?: ImageComplete[];
	places?: PlaceComplete[];
	prompts?: PromptComplete[];
	properties?: PropertyComplete[];
	tags?: TagWithStats[];
	videos?: VideoComplete[];
	wildcards?: WildcardComplete[];
	worldItems?: WorldItemComplete[];
}

/**
 * 📊 Estadísticas pre-calculadas para Note
 */
export interface NoteStatistics {
	totalItems: number;
	totalImages: number;
	totalVideos: number;
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalConcepts: number;
	totalPrompts: number;
	totalWildcards: number;
	totalProperties: number;
	totalGroups: number;
	wordCount: number;
	characterCount: number;
	readingTime: number; // en minutos
	completionScore: number; // 0-100 basado en contenido y relaciones
	lastUpdated: Date;
}

/**
 * 📝 Note optimizado con estadísticas pre-calculadas
 */
export interface NoteWithStats extends NoteBase {
	statistics: NoteStatistics;
	// Campos derivados calculados
	excerpt: string;
	formattedDate: string;
	priorityLabel: string;
	statusLabel: string;
	categoryLabel: string;
}

/**
 * 🖥️ Propiedades de UI para Note
 */
export interface NoteUI {
	isSelected?: boolean;
	isEditing?: boolean;
	isExpanded?: boolean;
	isHovered?: boolean;
	isNew?: boolean;
	isHighlighted?: boolean;
	isLoading?: boolean;
	hasError?: boolean;
	isDragging?: boolean;
	isDropTarget?: boolean;
}

/**
 * 📝 Note completo con relaciones (para casos que requieren relaciones completas)
 */
export interface NoteComplete extends NoteBase, NoteRelations, NoteUI {
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

// Tipos inferidos de Zod
export type NoteValidated = z.infer<typeof NoteSchema>;
