/**
 * @file Tipos para File3D
 * @module types/entities/file3d/types
 * @description Este archivo contiene tipos auxiliares para la entidad File3D.
 */

import type { File3DBase, File3DStatistics, File3DWithStats, File3DCreateInput, File3DUpdateInput } from './base';

// Re-exportar tipos principales
export type { File3DBase, File3DStatistics, File3DWithStats, File3DCreateInput, File3DUpdateInput };

// Alias para compatibilidad
export type File3D = File3DWithStats;
export type CreateFile3DInput = File3DCreateInput;
export type UpdateFile3DInput = File3DUpdateInput;

/**
 * Filtros para búsqueda de archivos 3D
 */
export interface File3DFilters {
	search?: string;
	format?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	minSize?: number;
	maxSize?: number;
	hasAnimations?: boolean;
	hasTextures?: boolean;
	minVertices?: number;
	maxVertices?: number;
	folderId?: string;
}

/**
 * Opciones de ordenamiento para archivos 3D
 */
export interface File3DSortOptions {
	sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt' | 'vertices' | 'faces';
	sortDirection?: 'asc' | 'desc';
}

/**
 * Opciones de paginación para archivos 3D
 */
export interface File3DPaginationOptions extends File3DSortOptions {
	page?: number;
	limit?: number;
}

/**
 * Resultado paginado de archivos 3D
 */
export interface PaginatedFile3Ds {
	items: File3DWithStats[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - File3D es un alias para File3DWithStats para compatibilidad.