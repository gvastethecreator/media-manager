/**
 * @file Tipos base para la entidad Collection.
 * @module types/entities/collection/base
 * @description Define los tipos canónicos para la entidad Collection, siguiendo el patrón `Base + Statistics + WithStats`.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 🗿 Modelo base de Collection, basado en el esquema de Drizzle.
 */
export type CollectionBase = {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	featuredImage: string | null;

	isFavorite: boolean;
	totalImages: number;
	totalVideos: number;
	totalSize: number;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	parentId: string | null;
	category: string | null;
	platform: string | null;
	price: number | null;
	network: string | null;
	tokenId: string | null;
	url: string | null;
	alternativeUrl: string | null;
	editions: CollectionEdition[] | null;
	sourceImage: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export interface CollectionEdition {
	id: string;
	name: string;
	price: number;
	currency: string;
	quantity: number;
	available: number;
	releaseDate: Date;
	year: number;
	metadata?: Record<string, any>;
}

/**
 * 📊 Estadísticas calculadas y derivadas para una Collection.
 * Principalmente, los conteos de las relaciones.
 */
export interface CollectionStatistics {
	imageCount: number;
	videoCount: number;
	albumCount: number;
	tagCount: number;
	characterCount: number;
	placeCount: number;
	worldItemCount: number;
	conceptCount: number;
	promptCount: number;
	noteCount: number;
	wildcardCount: number;
	propertyCount: number;
	groupCount: number;

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
 * ✨ Modelo extendido de Collection con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface CollectionWithStats extends CollectionBase {
	entityType: 'collection';
	stats: CollectionStatistics;
	isRecent?: boolean;
}
