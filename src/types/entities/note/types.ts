/**
 * @file Tipos para la entidad Note
 * @module types/entities/note/types
 */

import type { z } from 'zod';
// Importación de tipos para relaciones
import type { NoteSchema } from './schema';

/**
 * 📝 Tipos canónicos para la entidad Note
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Note.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - NoteBase: tipo canónico principal
 * - NoteRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - NoteCreateInput, NoteUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

/**
 * 🔄 Tipo base para Note
 */
export interface NoteBase {
	id: string;
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	featuredImage: string | null;
	isFavorite: boolean;
	presetId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📝 Interfaz para tags de nota
 */
export interface NoteTags {
	items: string[];
}

/**
 * 🔗 Relaciones de Note
 */
// ⚠️ Limpieza: relaciones solo como any[] para evitar errores de tipos inexistentes
export interface NoteRelations {
	albums?: any[];
	characters?: any[];
	collections?: any[];
	concepts?: any[];
	groups?: any[];
	images?: any[];
	places?: any[];
	prompts?: any[];
	properties?: any[];
	tags?: any[];
	videos?: any[];
	wildcards?: any[];
	worldItems?: any[];
}

/**
 * 📊 Conteos de relaciones de Note
 */
export interface NoteCounts {
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
 * 🔄 UI y campos extendidos
 */
export interface NoteUI {
	// Propiedades de UI
	isSelected?: boolean;
	isEditing?: boolean;
	isExpanded?: boolean;
	isHovered?: boolean;
	isNew?: boolean;

	// Datos derivados
	excerpt?: string;
	wordCount?: number;
	formattedDate?: string;
}

/**
 * 🔄 Campos deserializados de Note
 */
export type NoteDeserialized = Record<string, unknown>;

/**
 * 🔍 Interfaz para filtros de búsqueda de notas
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
 * 🔄 Note completo con todas las relaciones
 */
export interface NoteComplete extends NoteBase, NoteRelations, NoteCounts, NoteUI, NoteDeserialized {}

/**
 * 📝 Datos para crear un Note
 */
export interface NoteCreateInput {
	title: string;
	content?: string;
	category?: string;
	priority?: number;
	status?: string;
	// UI
	featuredImage?: string | null;
	isFavorite?: boolean;
	presetId?: string | null;
	// Relaciones
	images?: string[] | { id: string }[];
	videos?: string[] | { id: string }[];
	albums?: string[] | { id: string }[];
	collections?: string[] | { id: string }[];
	tags?: string[] | { id: string }[];
	characters?: string[] | { id: string }[];
	places?: string[] | { id: string }[];
	worldItems?: string[] | { id: string }[];
	concepts?: string[] | { id: string }[];
	prompts?: string[] | { id: string }[];
	wildcards?: string[] | { id: string }[];
	properties?: string[] | { id: string }[];
	groups?: string[] | { id: string }[];
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
	// UI
	featuredImage?: string | null;
	isFavorite?: boolean;
	presetId?: string | null;
	// Relaciones
	images?: string[] | { id: string }[];
	videos?: string[] | { id: string }[];
	albums?: string[] | { id: string }[];
	collections?: string[] | { id: string }[];
	tags?: string[] | { id: string }[];
	characters?: string[] | { id: string }[];
	places?: string[] | { id: string }[];
	worldItems?: string[] | { id: string }[];
	concepts?: string[] | { id: string }[];
	prompts?: string[] | { id: string }[];
	wildcards?: string[] | { id: string }[];
	properties?: string[] | { id: string }[];
	groups?: string[] | { id: string }[];
}

/**
 * 🔍 Opciones de búsqueda para Note
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
 * 🎯 Opciones para el transformer de Note
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
 * Enumeración para criterios de ordenación
 */
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
 * Mapa de propiedades para ordenación
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
};

// Tipos inferidos de Zod
export type NoteValidated = z.infer<typeof NoteSchema>;
