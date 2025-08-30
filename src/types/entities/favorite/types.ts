/**
 * @file Tipos canónicos para la entidad Favorite
 * @module types/entities/favorite/types
 */

/**
 * ⭐ Enum para los tipos de entidades que pueden ser marcadas como favoritas.
 * Se utiliza tanto para validación de tipos como para valores en tiempo de ejecución.
 */
export enum FavoriteEntityType {
	IMAGE = 'image',
	VIDEO = 'video',
	ALBUM = 'album',
	COLLECTION = 'collection',
	FOLDER = 'folder',
	CHARACTER = 'character',
	PLACE = 'place',
	WORLD_ITEM = 'world-item',
	CONCEPT = 'concept',
	PROMPT = 'prompt',
	NOTE = 'note',
	DOCUMENT = 'document',
	FILE = 'file',
	TAG = 'tag',
	GROUP = 'group',
	FAVORITE = 'favorite',
}

/**
 * ⭐ Tipo base para un favorito.
 * Representa la estructura de un favorito en la base de datos.
 */
export interface FavoriteBase {
	id: string;
	entityId: string;
	entityType: FavoriteEntityType;
	userId: string | null;
	profileId: string | null;
	addedAt: Date;
	notes: string | null;
	category: string | null;
	priority: number | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * ⭐ Input para crear un nuevo favorito.
 */
export type FavoriteCreateInput = Omit<FavoriteBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ⭐ Relaciones de un favorito.
 * Por ahora, un favorito no tiene relaciones directas complejas.
 */
export type FavoriteRelations = Record<never, never>;

/**
 * ⭐ Tipo completo de un favorito con sus relaciones.
 */
export interface FavoriteComplete extends FavoriteBase, FavoriteRelations {}

/**
 * ⭐ Favorito extendido con propiedades adicionales para la UI
 */
export interface FavoriteExtended extends FavoriteComplete {
	entityName?: string;
	entityPreview?: string;
	entityIcon?: string;
	entityColor?: string;
	isSelected?: boolean;
	isHovered?: boolean;
	_count?: Record<string, number>;
}

/**
 * ⭐ Favorito con imagen asociada
 */
export interface FavoriteWithImage extends FavoriteComplete {
	image: any; // FileItem type
}

/**
 * ⭐ Estadísticas de favoritos
 */
export interface FavoriteStats {
	totalCount: number;
	byType: Record<string, number>;
	recentlyAdded: FavoriteComplete[];
}

/**
 * ⭐ Favorito con estadísticas calculadas
 */
export interface FavoriteWithStats extends Omit<FavoriteComplete, 'entityType'> {
	entityType: 'favorite';
	statistics?: FavoriteStats;
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
 * 🔍 Resultado de búsqueda de favoritos
 */
export interface FavoriteSearchResult {
	favorites: FavoriteWithStats[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
}

/**
 * ⭐ Agrupación de favoritos por tipo
 */
export interface FavoritesByType {
	type: string;
	displayName: string;
	icon: string;
	color: string;
	count: number;
	items: FavoriteComplete[];
}

/**
 * ⭐ Filtros para favoritos
 */
export interface FavoriteFilters {
	entityType?: string[];
	createdAfter?: Date | null;
	createdBefore?: Date | null;
	search?: string;
	limit?: number;
	offset?: number;
	sort?: string;
	order?: 'asc' | 'desc';
}

/**
 * ⭐ Input para actualizar un favorito
 */
export interface FavoriteUpdateInput extends Partial<FavoriteCreateInput> {
	id: string;
}

/**
 * 🔍 Opciones de búsqueda para favoritos
 */
export interface FavoriteSearchOptions {
	filters?: FavoriteFilters;
	pagination?: {
		page?: number;
		pageSize?: number;
	};
	sort?: {
		field?: string;
		direction?: 'asc' | 'desc';
	};
	include?: {
		entity?: boolean;
		stats?: boolean;
	};
}

// Constantes para mapeo de entidades
export const FAVORITE_ENTITY_EMOJIS: Record<string, string> = {
	[FavoriteEntityType.IMAGE]: '🖼️',
	[FavoriteEntityType.VIDEO]: '🎥',
	[FavoriteEntityType.ALBUM]: '📸',
	[FavoriteEntityType.COLLECTION]: '🌟',
	[FavoriteEntityType.FOLDER]: '📁',
	[FavoriteEntityType.CHARACTER]: '👤',
	[FavoriteEntityType.PLACE]: '📍',
	[FavoriteEntityType.WORLD_ITEM]: '🎯',
	[FavoriteEntityType.CONCEPT]: '💡',
	[FavoriteEntityType.PROMPT]: '🎯',
	[FavoriteEntityType.NOTE]: '📝',
	[FavoriteEntityType.DOCUMENT]: '📄',
	[FavoriteEntityType.FILE]: '📎',
	[FavoriteEntityType.TAG]: '🏷️',
	[FavoriteEntityType.GROUP]: '👥',
	[FavoriteEntityType.FAVORITE]: '⭐',
	default: '⭐',
};

export const FAVORITE_ENTITY_COLORS: Record<string, string> = {
	[FavoriteEntityType.IMAGE]: '#3b82f6',
	[FavoriteEntityType.VIDEO]: '#ef4444',
	[FavoriteEntityType.ALBUM]: '#f97316',
	[FavoriteEntityType.COLLECTION]: '#8b5cf6',
	[FavoriteEntityType.FOLDER]: '#22c55e',
	[FavoriteEntityType.CHARACTER]: '#f43f5e',
	[FavoriteEntityType.PLACE]: '#0ea5e9',
	[FavoriteEntityType.WORLD_ITEM]: '#d946ef',
	[FavoriteEntityType.CONCEPT]: '#fbbf24',
	[FavoriteEntityType.PROMPT]: '#10b981',
	[FavoriteEntityType.NOTE]: '#ef4444',
	[FavoriteEntityType.DOCUMENT]: '#64748b',
	[FavoriteEntityType.FILE]: '#6b7280',
	[FavoriteEntityType.TAG]: '#ec4899',
	[FavoriteEntityType.GROUP]: '#14b8a6',
	[FavoriteEntityType.FAVORITE]: '#fbbf24',
	default: '#3b82f6',
};

export const FAVORITE_ENTITY_DISPLAY_NAMES: Record<string, string> = {
	[FavoriteEntityType.IMAGE]: 'Imágenes',
	[FavoriteEntityType.VIDEO]: 'Videos',
	[FavoriteEntityType.ALBUM]: 'Álbumes',
	[FavoriteEntityType.COLLECTION]: 'Colecciones',
	[FavoriteEntityType.FOLDER]: 'Carpetas',
	[FavoriteEntityType.CHARACTER]: 'Personajes',
	[FavoriteEntityType.PLACE]: 'Lugares',
	[FavoriteEntityType.WORLD_ITEM]: 'Objetos',
	[FavoriteEntityType.CONCEPT]: 'Conceptos',
	[FavoriteEntityType.PROMPT]: 'Prompts',
	[FavoriteEntityType.NOTE]: 'Notas',
	[FavoriteEntityType.DOCUMENT]: 'Documentos',
	[FavoriteEntityType.FILE]: 'Archivos',
	[FavoriteEntityType.TAG]: 'Etiquetas',
	[FavoriteEntityType.GROUP]: 'Grupos',
	[FavoriteEntityType.FAVORITE]: 'Favoritos',
	default: 'Favoritos',
};

// Alias para consistencia
export type CreateFavoriteData = FavoriteCreateInput;
