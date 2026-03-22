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
	addedAt: Date;
	category: string | null;
	createdAt: Date;
	entityId: string;
	entityType: FavoriteEntityType;
	id: string;
	notes: string | null;
	priority: number | null;
	profileId: string | null;
	updatedAt: Date;
	userId: string | null;
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
	_count?: Record<string, number>;
	entityColor?: string;
	entityIcon?: string;
	entityName?: string;
	entityPreview?: string;
	isHovered?: boolean;
	isSelected?: boolean;
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
	byType: Record<string, number>;
	recentlyAdded: FavoriteComplete[];
	totalCount: number;
}

/**
 * ⭐ Favorito con estadísticas calculadas
 */
export interface FavoriteWithStats extends Omit<FavoriteComplete, 'entityType'> {
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
	entityType: 'favorite';
	statistics?: FavoriteStats;
}

/**
 * 🔍 Resultado de búsqueda de favoritos
 */
export interface FavoriteSearchResult {
	favorites: FavoriteWithStats[];
	hasMore: boolean;
	limit: number;
	page: number;
	total: number;
}

/**
 * ⭐ Agrupación de favoritos por tipo
 */
export interface FavoritesByType {
	color: string;
	count: number;
	displayName: string;
	icon: string;
	items: FavoriteComplete[];
	type: string;
}

/**
 * ⭐ Filtros para favoritos
 */
export interface FavoriteFilters {
	createdAfter?: Date | null;
	createdBefore?: Date | null;
	entityType?: string[];
	limit?: number;
	offset?: number;
	order?: 'asc' | 'desc';
	search?: string;
	sort?: string;
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
	include?: {
		entity?: boolean;
		stats?: boolean;
	};
	pagination?: {
		page?: number;
		pageSize?: number;
	};
	sort?: {
		field?: string;
		direction?: 'asc' | 'desc';
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

/**
 * Colores por tipo de entidad favorita.
 * NOTA: Ahora utilizamos variables CSS semánticas para asegurar la integración
 * con los diferentes temas de la aplicación.
 */
export const FAVORITE_ENTITY_COLORS: Record<string, string> = {
	[FavoriteEntityType.IMAGE]: 'var(--entity-image)',
	[FavoriteEntityType.VIDEO]: 'var(--entity-video)',
	[FavoriteEntityType.ALBUM]: 'var(--entity-album)',
	[FavoriteEntityType.COLLECTION]: 'var(--entity-collection)',
	[FavoriteEntityType.FOLDER]: 'var(--entity-folder)',
	[FavoriteEntityType.CHARACTER]: 'var(--entity-character)',
	[FavoriteEntityType.PLACE]: 'var(--entity-place)',
	[FavoriteEntityType.WORLD_ITEM]: 'var(--entity-world-item)',
	[FavoriteEntityType.CONCEPT]: 'var(--entity-concept)',
	[FavoriteEntityType.PROMPT]: 'var(--entity-prompt)',
	[FavoriteEntityType.NOTE]: 'var(--entity-note)',
	[FavoriteEntityType.DOCUMENT]: 'var(--entity-document)',
	[FavoriteEntityType.FILE]: 'var(--entity-file)',
	[FavoriteEntityType.TAG]: 'var(--entity-tag)',
	[FavoriteEntityType.GROUP]: 'var(--entity-group)',
	[FavoriteEntityType.FAVORITE]: 'var(--entity-favorite)',
	default: 'var(--dt-primary-500)',
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
