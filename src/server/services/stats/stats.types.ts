/**
 * Tipos para el servicio de estadísticas
 */

/**
 * Estadísticas generales del sistema (22 entidades)
 */
export interface GeneralStats {
	// Archivos multimedia
	totalImages: number;
	totalVideos: number;
	totalAudio: number;
	totalDocuments: number;
	totalJsonFiles: number;
	totalFile3D: number;

	// Organización
	totalFolders: number;
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalFavorites: number;

	// Worldbuilding
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalConcepts: number;
	totalPrompts: number;
	totalNotes: number;
	totalProperties: number;
	totalWildcards: number;

	// Sistema
	totalThumbnails: number;
	totalMetadata: number;
	totalViews: number;
	totalDownloads: number;
	totalSize: number;
	totalActivities: number;

	// Información de espacio en disco
	usedSpace?: number;
	freeSpace?: number;
	diskUsage?: {
		total: number;
		used: number;
		free: number;
		usedPercentage: number;
	};

	// Top tags y actividad reciente
	topTags: Array<{
		id: string;
		name: string;
		color: string;
		count: number;
	}>;
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
}

/**
 * Response para estadísticas agrupadas por entidad
 */
export interface StatsResponse {
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
	tags: Array<{
		id: string;
		name: string;
		count: number;
		color: string;
	}>;
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
	places: Array<{
		id: string;
		name: string;
		count: number;
		emoji: string;
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
	totalDocuments: number;
	totalAudio: number;
	totalJsonFiles: number;
	totalFile3D: number;
}

/**
 * Tipos helper internos para queries
 */
export type CountRow = { count: number };
export type SizeRow = { totalSize: number };

/**
 * Conteos de archivos multimedia
 */
export type MediaCounts = {
	images: number;
	videos: number;
	audios: number;
	documents: number;
	jsonFiles: number;
	file3Ds: number;
};

/**
 * Conteos de entidades organizacionales
 */
export type OrgCounts = {
	folders: number;
	albums: number;
	collections: number;
	tags: number;
	favorites: number;
};

/**
 * Conteos de entidades worldbuilding
 */
export type WorldCounts = {
	characters: number;
	places: number;
	worldItems: number;
	concepts: number;
	prompts: number;
	notes: number;
	properties: number;
	wildcards: number;
};

/**
 * Conteos de entidades del sistema
 */
export type SystemCounts = {
	thumbnails: number;
	metadatas: number;
};

/**
 * Sumas de tamaños por tipo de archivo
 */
export type SizeSums = {
	totalFoldersSize: number;
	totalAudioSize: number;
	totalDocumentSize: number;
	totalJsonSize: number;
	totalFile3DSize: number;
};

/**
 * Tag popular con conteo de imágenes
 */
export interface TopTag {
	id: string;
	name: string;
	color: string;
	_count: {
		images: number;
	};
}

/**
 * Entidad genérica con conteo de imágenes
 */
export interface EntityWithImageCount {
	id: string;
	name: string;
	_count: {
		images: number;
	};
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
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	images: Array<{
		id: string;
		name: string;
		fileType: string;
		mimeType: string | null;
		size: number;
		createdAt: Date;
	}>;
}
