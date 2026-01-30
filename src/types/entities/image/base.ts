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
	id: string;
	name: string;
	description: string | null;
	path: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	metadata: string | null;
	thumbnail: string | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	thumbnailMimeType: string | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailOptimizedAt: Date | null;
	isFavorite: boolean;
	folderId: string;
	noteId: string | null;
	createdAt: Date;
	updatedAt: Date;
	addedAt: Date;
	tags?: TagWithStats[];
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
	entityType: 'image';
	stats: ImageStatistics;
	thumbnailUrl: string;
	fullUrl: string;

	// Propiedades adicionales de archivo
	type?: string;

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
