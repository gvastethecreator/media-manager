/**
 * 🗿 Modelo base de Group, basado en el esquema de Drizzle.
 */
export type GroupBase = {
	id: string;
	name: string;
	description: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isFavorite?: boolean;
	organizationType?: string | null;
	organizationLevel?: number;
	rarityLevel?: string | null;
	flexibilityScore?: number;
	power?: number;
	hp?: number;
	mp?: number;
	cardId?: string;
	filters?: any;
	recentImages?: any[];
	recentVideos?: any[];
	createdAt: Date;
	updatedAt: Date;
};

/**
 * 📊 Estadísticas calculadas y derivadas para un Group.
 * Principalmente, los conteos de las relaciones.
 */
export interface GroupStatistics {
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
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	// Alias para compatibilidad
	totalImages?: number;
	totalVideos?: number;
	totalAlbums?: number;
	totalCollections?: number;
	totalTags?: number;
	totalCharacters?: number;
	totalPlaces?: number;
	totalWorldItems?: number;
	totalConcepts?: number;
	totalPrompts?: number;
	totalNotes?: number;
	totalWildcards?: number;
	totalProperties?: number;
}

/**
 * ✨ Modelo extendido de Group con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface GroupWithStats extends GroupBase {
	entityType: 'group';
	stats: GroupStatistics;
}

/**
 * 🎛️ Modos de visualización para la entidad Group
 */
export enum GroupViewMode {
	GRID = 'grid',
	LIST = 'list',
	DETAIL = 'detail',
}

/**
 * 🔄 Claves de ordenamiento para la entidad Group
 */
export type GroupSortKey = 'name' | 'category' | 'createdAt';
