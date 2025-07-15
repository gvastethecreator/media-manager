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
	isPublic: boolean;
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
}

/**
 * 🎮 Tipo principal optimizado con estadísticas pre-calculadas
 */
export interface WorldItemWithStats extends WorldItemBase {
	_stats: WorldItemStatistics;
}
