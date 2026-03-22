/**
 * @file Tipos base para la entidad Image.
 * @module types/entities/image/base
 * @description Define los tipos canónicos para la entidad Image, siguiendo el patrón `Base + Statistics + WithStats`.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { TagWithStats } from '../tag';

/**
 * 🖼️ Modelo base de Image, basado en el esquema de Drizzle.
 */
export interface ImageBase {
	addedAt: Date;
	createdAt: Date;
	description: string | null;
	folderId: string;
	hash: string;
	height: number;
	id: string;
	isFavorite: boolean;
	metadata: string | null;
	name: string;
	noteId: string | null;
	path: string;
	size: number;
	tags?: TagWithStats[];
	thumbnail: string | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailHeight: number | null;
	thumbnailMimeType: string | null;
	thumbnailOptimizedAt: Date | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number;
}

import type { EntityStats } from '../entity.types';

/**
 * 📊 Estadísticas calculadas y derivadas para una Image.
 * Extiende EntityStats con propiedades específicas de imágenes.
 */
export interface ImageStatistics extends EntityStats {
	// Propiedades específicas de imágenes
	aspectRatio: number;
}

/**
 * 📊 Alias para compatibilidad - ImageStats apunta a ImageStatistics
 */
export type ImageStats = ImageStatistics;

/**
 * ✨ Modelo extendido de Image con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface ImageWithStats extends ImageBase {
	_count?: {
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
	entityType: 'image';
	fullUrl: string;
	stats: ImageStatistics;
	thumbnailUrl: string;

	// Propiedades adicionales de archivo
	type?: string;
}

export interface DrizzleImageWithCounts extends ImageBase {
	_count?: {
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
