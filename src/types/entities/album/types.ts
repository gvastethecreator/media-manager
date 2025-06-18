/**
 * @file Tipos canónicos para la entidad Album
 * @module types/entities/album/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Album.
 * Última migración: 2025-06-18
 */

import type { Album as PrismaAlbum } from '@prisma/client';
import type { Image } from '../image';
import type { Video } from '../video';

/**
 * 📝 Tipo base para Album - hereda directamente del tipo Prisma
 */
export type AlbumBase = PrismaAlbum;

/**
 * 🔗 Relaciones de un álbum con otras entidades
 */
export interface AlbumRelations {
	images?: Image[];
	videos?: Video[];
}

/**
 * 🔢 Contadores de relaciones
 */
export interface AlbumCounts {
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
}

/**
 * 🌟 Album con relaciones y conteos
 */
export interface AlbumWithRelations extends AlbumBase, AlbumRelations {
	_count?: AlbumCounts;
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
	images?: { connect: { id: string }[] };
	videos?: { connect: { id: string }[] };
}

/**
 * 🔄 Input para actualizar un álbum
 */
export interface AlbumUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string;
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	images?: { set?: { id: string }[] };
	videos?: { set?: { id: string }[] };
}

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
