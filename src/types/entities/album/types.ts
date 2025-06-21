/**
 * @file Tipos canónicos para la entidad Album
 * @module types/entities/album/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Album.
 * Última migración: 2025-06-18
 */

import type { Album as PrismaAlbum } from '@prisma/client';

/**
 * 💿 Interfaz que representa el payload de Prisma para un álbum, incluyendo las relaciones contadas.
 */
export type PrismaAlbumWithCounts = PrismaAlbum & {
	_count?: {
		images?: number;
		videos?: number;
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
};

/**
 * 📝 Metadatos de un álbum
 */
export interface AlbumMetadata {
	itemCount?: number;
	totalSize?: number;
	[key: string]: any;
}

/**
 * 📝 Tipo base para Album - definición canónica sin dependencias de Prisma
 */
export interface AlbumBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	filters: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	// ELIMINADO: parentId no existe en el modelo Album de Prisma
	// Metadatos opcionales
	metadata?: AlbumMetadata;
}

/**
 * 🔗 Relaciones de un álbum con otras entidades (simplificado para evitar dependencias circulares)
 */
export interface AlbumRelations {
	images?: any[];
	videos?: any[];
	collections?: any[];
	tags?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
}

/**
 * 🔢 Contadores de relaciones
 */
export interface AlbumCounts {
	images: number;
	videos: number;
	collections: number;
	tags: number;
	characters: number;
	places: number;
	worldItems: number;
	concepts: number;
	prompts: number;
	notes: number;
	wildcards: number;
	properties: number;
	groups: number;
}

/**
 * 🌟 Album con estadísticas calculadas y conteos
 */
export interface AlbumWithStats extends AlbumBase {
	_count?: Partial<AlbumCounts>;
	relations?: Partial<AlbumRelations>;
	stats: {
		totalItems: number;
		totalImages: number;
		totalVideos: number;
		lastUpdated: Date;
	};
}

/**
 * 🔍 Filtros para búsqueda de álbumes
 */
export interface AlbumFilters {
	query?: string;
	types?: string[];
	categories?: string[];
	hasImages?: boolean;
	hasVideos?: boolean;
	isFavorite?: boolean;
	dateRange?: {
		from?: Date;
		to?: Date;
	};
	images?: { id: string }[];
	videos?: { id: string }[];
}

/**
 * ➕ Input para crear un nuevo álbum
 */
export interface AlbumCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	images?: { id: string }[];
	videos?: { id: string }[];
}

/**
 * 🔄 Input para actualizar un álbum
 */
export type AlbumUpdateInput = Partial<
	Omit<AlbumBase, 'id' | 'createdAt' | 'updatedAt'> & {
		images: { id: string }[];
		videos: { id: string }[];
	}
>;

// 🟢 Documentación
// - Se utiliza el tipo Prisma como base canónica
// - Se extiende con interfaces para relaciones y operaciones
// - Todas las modificaciones deben validarse antes de persistir

/**
 * 📊 Tipo principal compuesto para Album
 * Usamos AlbumBase (PrismaAlbum) como núcleo y extendemos según necesidades
 */
export type Album = AlbumBase;

/* Exportación de tipos adicionales para retrocompatibilidad */
export type { AlbumCreateInput as CreateAlbumData, AlbumUpdateInput as UpdateAlbumData };

