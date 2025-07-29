/**
 * 🌍 WORLD-ITEM BASE TYPES
 *
 * Tipos base para world-items usando tipos locales de Drizzle.
 *
 * @updated 2025-01-27
 */

/**
 * 🗿 Modelo base de WorldItem, derivado del schema de Drizzle.
 */
export interface WorldItemBase {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;

	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	type: string | null;
	rarity: string | null;
	value: string | null;
	weight: string | null;
	materials: string | null;
	origin: string | null;
	properties: string | null;
	uses: string | null;
	history: string | null;
	notes: string | null;
	featuredImage: string | null;
	parentId: string | null;
	shortcut?: string | null;
	attributes?: string | null;
	effects?: string | null;
	requirements?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Estadísticas específicas de WorldItem con análisis RPG
 */
export interface WorldItemStatistics {
	// Conteos de relaciones
	imageCount: number;
	videoCount: number;
	albumCount: number;
	collectionCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;

	// Alias para compatibilidad
	totalImages: number;
	totalVideos: number;
	totalAlbums: number;
	totalCollections: number;
	totalTags: number;
	totalCharacters: number;
	totalPlaces: number;
	totalConcepts: number;
	totalPrompts: number;
	totalNotes: number;
	totalWildcards: number;
	totalProperties: number;
	totalGroups: number;

	// Métricas RPG
	powerLevel: number; // Nivel de poder calculado
	rarityScore: number; // Puntuación de rareza (0-100)
	completenessScore: number; // Qué tan completo está el item
	popularityScore: number; // Basado en relaciones y favoritos

	// Análisis de contenido
	hasDescription: boolean;
	hasAttributes: boolean;
	hasEffects: boolean;
	hasRequirements: boolean;
	hasStats: boolean;
	mediaRichness: number; // Riqueza de medios (imágenes + videos)

	// Análisis temporal
	createdThisMonth: boolean;
	updatedThisWeek: boolean;
	daysSinceCreation: number;
	daysSinceLastUpdate: number;

	// Metadatos RPG
	totalAttributes: number;
	totalEffects: number;
	totalRequirements: number;
	totalStats: number;
	itemTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'artifact';

	// File system properties for browser integration
	/** File size in bytes */
	size: number;
	/** Last modification time */
	mtime: Date;
	/** File creation time */
	birthtime: Date;
	/** File type for browser compatibility */
	type: string;
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
}

/**
 * 🎮 Tipo principal optimizado con estadísticas pre-calculadas
 */
export interface WorldItemWithStats extends WorldItemBase {
	entityType: 'world-item';
	stats: WorldItemStatistics;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: WorldItemStatistics;
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * 🌟 Tipo completo de WorldItem con todas las relaciones
 */
export interface WorldItemComplete extends WorldItemWithStats {
	tags: string[];
	relations: {
		images: string[];
		videos: string[];
		albums: string[];
		collections: string[];
		characters: string[];
		places: string[];
		concepts: string[];
		prompts: string[];
		notes: string[];
		wildcards: string[];
		properties: string[];
		groups: string[];
	};
}
