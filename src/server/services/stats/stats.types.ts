/**
 * Tipos para el servicio de estadísticas
 */

/**
 * Estadísticas generales del sistema (22 entidades)
 */
export interface GeneralStats {
	diskUsage?: {
		total: number;
		used: number;
		free: number;
		usedPercentage: number;
	};
	freeSpace?: number;
	recentActivity: Array<{
		id: string;
		type: string;
		description: string;
		createdAt: Date;
		image: {
			id: string;
			name: string;
			thumbnail: Uint8Array | null;
		} | null;
	}>;

	// Top tags y actividad reciente
	topTags: Array<{
		id: string;
		name: string;
		color: string;
		count: number;
	}>;
	totalActivities: number;
	totalAlbums: number;
	totalAudio: number;

	// Worldbuilding
	totalCharacters: number;
	totalCollections: number;
	totalConcepts: number;
	totalDocuments: number;
	totalDownloads: number;
	totalFavorites: number;
	totalFile3D: number;

	// Organización
	totalFolders: number;
	// Archivos multimedia
	totalImages: number;
	totalJsonFiles: number;
	totalMetadata: number;
	totalNotes: number;
	totalPlaces: number;
	totalPrompts: number;
	totalProperties: number;
	totalSize: number;
	totalTags: number;

	// Sistema
	totalThumbnails: number;
	totalVideos: number;
	totalViews: number;
	totalWildcards: number;
	totalWorldItems: number;

	// Información de espacio en disco
	usedSpace?: number;
}

/**
 * Response para estadísticas agrupadas por entidad
 */
export interface StatsResponse {
	albums: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	characters: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	collections: Array<{
		id: string;
		name: string;
		count: number;
		color?: string;
		emoji?: string;
	}>;
	folders: Array<{
		id: string;
		name: string;
		count: number;
	}>;
	places: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
	tags: Array<{
		id: string;
		name: string;
		count: number;
		color: string;
	}>;
	worldItems: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
	}>;
}

/**
 * Estadísticas extendidas (entidades adicionales)
 */
export interface ExtendedStats {
	totalAudio: number;
	totalDocuments: number;
	totalFile3D: number;
	totalJsonFiles: number;
}

/**
 * Tipos helper internos para queries
 */
export interface CountRow {
	count: number;
}
export interface SizeRow {
	totalSize: number;
}

/**
 * Conteos de archivos multimedia
 */
export interface MediaCounts {
	audios: number;
	documents: number;
	file3Ds: number;
	images: number;
	jsonFiles: number;
	videos: number;
}

/**
 * Conteos de entidades organizacionales
 */
export interface OrgCounts {
	albums: number;
	collections: number;
	favorites: number;
	folders: number;
	tags: number;
}

/**
 * Conteos de entidades worldbuilding
 */
export interface WorldCounts {
	characters: number;
	concepts: number;
	notes: number;
	places: number;
	prompts: number;
	properties: number;
	wildcards: number;
	worldItems: number;
}

/**
 * Conteos de entidades del sistema
 */
export interface SystemCounts {
	metadatas: number;
	thumbnails: number;
}

/**
 * Sumas de tamaños por tipo de archivo
 */
export interface SizeSums {
	totalAudioSize: number;
	totalDocumentSize: number;
	totalFile3DSize: number;
	totalFoldersSize: number;
	totalJsonSize: number;
}

/**
 * Tag popular con conteo de imágenes
 */
export interface TopTag {
	_count: {
		images: number;
	};
	color: string;
	id: string;
	name: string;
}

/**
 * Entidad genérica con conteo de imágenes
 */
export interface EntityWithImageCount {
	_count: {
		images: number;
	};
	id: string;
	name: string;
}

/**
 * Colección con datos adicionales
 */
export interface CollectionWithData extends EntityWithImageCount {
	color: string;
	description: string;
}

/**
 * Tag con datos adicionales
 */
export interface TagWithData extends EntityWithImageCount {
	color: string;
}

/**
 * Entidad con emoji (characters, places, worldItems, etc.)
 */
export interface EntityWithEmoji extends EntityWithImageCount {
	emoji: string;
}

/**
 * Resultado de búsqueda con imágenes asociadas
 */
export interface EntitySearchResult {
	color?: string;
	emoji?: string;
	id: string;
	images: Array<{
		id: string;
		name: string;
		fileType: string;
		mimeType: string | null;
		size: number;
		createdAt: Date;
	}>;
	name: string;
}
