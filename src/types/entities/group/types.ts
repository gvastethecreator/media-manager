/**
 * @file Tipos canónicos para la entidad Group
 * @module types/entities/group/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Group.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Tipos de vista para grupos
 */
export enum GroupViewMode {
	GRID = 'grid',
	LIST = 'list',
}

/**
 * Tipos de grupos
 * @deprecated Este enum no se usa en el esquema actual de Prisma
 */
export enum GroupType {
	COLLECTION = 'collection',
	ALBUM = 'album',
	SMART = 'smart',
	DEFAULT = 'default',
}

/**
 * Criterios de ordenación para grupos
 */
export enum GroupSortCriteria {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	CREATED_ASC = 'created:asc',
	CREATED_DESC = 'created:desc',
	UPDATED_ASC = 'updated:asc',
	UPDATED_DESC = 'updated:desc',
	ITEMS_COUNT_ASC = 'itemsCount:asc',
	ITEMS_COUNT_DESC = 'itemsCount:desc',
}

/**
 * Estado de visualización para un grupo individual
 */
export interface GroupDisplayState {
	isExpanded: boolean;
	isVisible: boolean;
}

/**
 * Tipo base canónico para Group
 */
export interface GroupBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy: string;
	filters: string;
	featuredImage?: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Tipo extendido que incluye contador de items
 */
export type Group = GroupBase & {
	itemsCount?: number;
};

/**
 * Conteos de relaciones de un Group
 */
export interface GroupCounts {
	_count: {
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
		notes: number;
		wildcards: number;
		properties: number;
	};
}

/**
 * Relaciones que puede tener un Group (usando any[] para evitar dependencias circulares)
 */
export interface GroupRelations {
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
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
}

/**
 * Tipo extendido con relaciones completas
 */
export interface GroupExtended extends GroupBase {
	itemsCount: number;
	tags?: Array<{ id: string; name: string; color: string }>;
	images?: Array<{ id: string; name: string; path: string }>;
	videos?: Array<{ id: string; name: string; path: string }>;
	albums?: Array<{ id: string; name: string; emoji: string; color: string }>;
	collections?: Array<{ id: string; name: string; emoji: string; color: string }>;
	characters?: Array<{ id: string; name: string; emoji: string; color: string }>;
	places?: Array<{ id: string; name: string; emoji: string; color: string }>;
	worldItems?: Array<{ id: string; name: string; emoji: string; color: string }>;
	concepts?: Array<{ id: string; name: string; emoji: string; color: string }>;
	prompts?: Array<{ id: string; name: string; emoji: string; color: string }>;
	notes?: Array<{ id: string; name: string; emoji: string; color: string }>;
	wildcards?: Array<{ id: string; name: string; emoji: string; color: string }>;
	properties?: Array<{ id: string; name: string; emoji: string; color: string }>;
}

/**
 * Tipo completo con todas las relaciones y conteos
 */
export type GroupComplete = GroupBase & GroupRelations & GroupCounts;

/**
 * Input para creación
 */
export interface GroupCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	// Relaciones opcionales para conectar al crear
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
}

/**
 * Input para actualización
 */
export interface GroupUpdateInput extends Partial<Omit<GroupBase, 'id' | 'createdAt' | 'updatedAt'>> {
	// Relaciones para conectar/desconectar
	images?: { id: string }[];
	videos?: { id: string }[];
	albums?: { id: string }[];
	collections?: { id: string }[];
	tags?: { id: string }[];
	characters?: { id: string }[];
	places?: { id: string }[];
	worldItems?: { id: string }[];
	concepts?: { id: string }[];
	prompts?: { id: string }[];
	notes?: { id: string }[];
	wildcards?: { id: string }[];
	properties?: { id: string }[];
}

/**
 * Esquema Zod para validación de Group
 */
export const GroupSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	sortBy: z.string(),
	filters: z.string(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Tipo extendido para grupos con estadísticas y conteos de relaciones
 * Incluye la propiedad _count y un objeto stats calculado
 */
export type GroupWithStats = GroupBase &
	GroupCounts & {
		stats?: {
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
			totalNotes: number;
			totalWildcards: number;
			totalProperties: number;
			lastUpdated: Date;
		};
	};

/**
 * Interfaz para filtros de búsqueda de grupos
 */
export interface GroupFilters {
	searchQuery?: string;
	name?: string;
	category?: string;
	color?: string;
	onlyFavorites?: boolean;
	hasImages?: boolean;
	hasVideos?: boolean;
	minItemsCount?: number;
	maxItemsCount?: number;
	createdAfter?: Date;
	createdBefore?: Date;
	updatedAfter?: Date;
	updatedBefore?: Date;
}

/**
 * Resultado de búsqueda de grupos
 */
export interface GroupSearchResult {
	items: GroupExtended[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
	filters: GroupFilters;
	sortBy: GroupSortCriteria;
}

/**
 * Interfaz para tarjeta de grupo
 */
export interface GroupCard {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string;
	itemsCount: number;
	featuredImage?: string;
	isFavorite: boolean;
	updatedAt: Date;
}

/**
 * Interfaz para elemento de lista de grupo
 */
export interface GroupListItem {
	id: string;
	name: string;
	emoji: string;
	color: string;
	itemsCount: number;
	category?: string;
	isFavorite: boolean;
	images?: GroupListItemImage[];
}

/**
 * Interfaz para imagen en lista de grupo
 */
export interface GroupListItemImage {
	id: string;
	name: string;
	path: string;
	thumbnailUrl?: string;
}

/**
 * Props para lista de grupos
 */
export interface GroupListProps {
	groups: GroupListItem[];
	onGroupClick?: (group: GroupListItem) => void;
	onGroupFavorite?: (groupId: string, isFavorite: boolean) => void;
	loading?: boolean;
	emptyMessage?: string;
}

/**
 * Parámetros de búsqueda de grupos
 */
export interface GroupSearchParams {
	query?: string;
	category?: string;
	sortBy?: GroupSortCriteria;
	page?: number;
	limit?: number;
	filters?: GroupFilters;
}

/**
 * Opciones del transformador de grupos
 */
export interface GroupTransformerOptions {
	includeRelations?: boolean;
	includeStats?: boolean;
	includeImages?: boolean;
	maxImages?: number;
}

/**
 * Alias para compatibilidad con código existente
 */
export type CreateGroupData = GroupCreateInput;
export type UpdateGroupData = GroupUpdateInput;

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con GroupSchema antes de persistir.
