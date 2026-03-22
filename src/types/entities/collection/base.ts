/**
 * @file Tipos base para la entidad Collection.
 * @module types/entities/collection/base
 * @description Define los tipos canónicos para la entidad Collection, siguiendo el patrón `Base + Statistics + WithStats`.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

/**
 * 🗿 Modelo base de Collection, basado en el esquema de Drizzle.
 */
export interface CollectionBase {
	alternativeUrl: string | null;
	category: string | null;
	color: string | null;
	createdAt: Date;
	description: string | null;
	editions: CollectionEdition[] | null;
	emoji: string | null;
	featuredImage: string | null;
	id: string;

	isFavorite: boolean;
	lastImageAddedAt: Date | null;
	lastVideoAddedAt: Date | null;
	name: string;
	network: string | null;
	parentId: string | null;
	platform: string | null;
	price: number | null;
	sourceImage: string | null;
	tokenId: string | null;
	totalImages: number;
	totalSize: number;
	totalVideos: number;
	updatedAt: Date;
	url: string | null;
}

export interface CollectionEdition {
	available: number;
	currency: string;
	id: string;
	metadata?: Record<string, any>;
	name: string;
	price: number;
	quantity: number;
	releaseDate: Date;
	year: number;
}

import { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas y derivadas para una Collection.
 * Principalmente, los conteos de las relaciones.
 */
export interface CollectionStatistics extends EntityStats {
	// File system functions
	isDirectory: boolean;
	isFile: boolean;
}

/**
 * ✨ Modelo extendido de Collection con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface CollectionWithStats extends CollectionBase {
	entityType: 'collection';
	isRecent?: boolean;
	stats: CollectionStatistics;
}
