/**
 * @file Tipos canónicos para la entidad Folder
 * @module types/entities/folder/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Folder.
 * Última migración: 2025-06-18
 */

import type { Prisma } from '@prisma/client';

/**
 * 📁 Tipo base para una carpeta.
 */
export interface FolderBase {
	id: string;
	name: string;
	description: string | null;
	path: string;
	emoji: string | null;
	color: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	autoReindex: boolean;
	totalFiles: number;
	totalSize: number;
	lastIndexed: Date | null;
	parentId: string | null;
	presetId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📁 Input para crear una nueva carpeta.
 */
export interface FolderCreateInput
	extends Omit<FolderBase, 'id' | 'createdAt' | 'updatedAt' | 'totalFiles' | 'totalSize' | 'lastIndexed'> {}

/**
 * 📁 Input para actualizar una carpeta existente.
 */
export interface FolderUpdateInput extends Partial<FolderCreateInput> {}

/**
 * 📁 Relaciones de una carpeta.
 */
export interface FolderRelations {
	images?: unknown[];
	parent?: FolderBase | null;
	children?: FolderBase[];
}

/**
 * 📁 Conteos de las relaciones.
 */
export interface FolderCounts {
	_count?: {
		images?: number;
		children?: number;
	};
}

/**
 * 📁 Tipo completo de una carpeta con relaciones y conteos.
 */
export interface FolderComplete extends FolderBase, FolderRelations, FolderCounts {}

/**
 * 📁 Propiedades de UI para una carpeta.
 */
export interface FolderUIProps {
	isSelected?: boolean;
	isOpen?: boolean;
	isLoading?: boolean;
	hasError?: boolean;
	isDragging?: boolean;
	isDropTarget?: boolean;
	level?: number;
}

/**
 * 📁 Tipo extendido con estado de UI.
 */
export interface FolderExtended extends FolderComplete, FolderUIProps {}

/**
 * 📁 Tipo extendido y completo, con hijos también extendidos.
 */
export interface FolderExtendedComplete extends FolderExtended {
	children?: FolderExtendedComplete[];
}

// Alias
export type CreateFolderData = FolderCreateInput;
export type UpdateFolderData = FolderUpdateInput;
export type FolderWithRelations = FolderComplete;

/**
 * 📁 Filtros para buscar carpetas.
 */
export interface FolderFilters {
	search?: string;
	isFavorite?: boolean;
	parentId?: string | null;
	hasImages?: boolean;
}

/**
 * 📁 Opciones para las consultas de búsqueda de carpetas.
 */
export interface FolderSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Prisma.FolderOrderByWithRelationInput;
	filters?: FolderFilters;
	include?: Prisma.FolderInclude;
}

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con FolderSchema antes de persistir.
