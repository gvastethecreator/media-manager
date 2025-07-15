/**
 * @file Tipos canónicos para la entidad Folder - Patrón EntityWithStats
 * @module types/entities/folder/types
 * @description Estructura unificada y validada para Folder siguiendo el patrón EntityWithStats.
 * Última migración: 2025-01-20
 */

/**
 * 📁 Tipo base para una carpeta - Campos principales
 */
import type { EntityBase, EntityWithStats } from '@/types/entities/entity.types';

/**
 * 📁 Tipo base para una carpeta - Campos principales
 */
export interface FolderBase extends EntityBase {
	name: string;
	description: string | null;
	path: string;
	emoji: string | null;
	color: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	totalFiles: number;
	totalSize: number;
	autoReindex: boolean;
	lastIndexed: Date | null;
	parentId: string | null;
	presetId: string | null;
}

/**
 * 📁 Tipo principal optimizado con estadísticas (USAR ESTE)
 */
export interface FolderWithStats extends FolderBase, EntityWithStats, FolderUIProps {
	statistics: FolderStatistics;
	children?: FolderWithStats[]; // Para estructuras recursivas
}

/**
 * 📁 Input para crear una nueva carpeta
 */
export interface FolderCreateInput extends Omit<FolderBase, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * 📁 Input para actualizar una carpeta existente
 */
export type FolderUpdateInput = Partial<FolderCreateInput>;

/**
 * 📁 Filtros para buscar carpetas
 */
export interface FolderFilters {
	search?: string;
	isFavorite?: boolean;
	parentId?: string | null;
	hasImages?: boolean;
	hierarchyDepth?: number;
	organizationScore?: { min?: number; max?: number };
}

/**
 * 📁 Opciones para las consultas de búsqueda de carpetas
 */
export interface FolderSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: Record<string, 'asc' | 'desc'>;
	filters?: FolderFilters;
	include?: Record<string, boolean>;
}

// Alias para retrocompatibilidad (mantener solo si es estrictamente necesario)
export type CreateFolderData = FolderCreateInput;
export type UpdateFolderData = FolderUpdateInput;
export type Folder = FolderWithStats; // Alias principal

// 🟢 Documentación y advertencia:
// - USAR FolderWithStats como tipo principal en stores, componentes y lógica de negocio
// - FolderComplete solo para casos especiales o backward compatibility
// - Validar siempre con FolderSchema antes de persistir
// - El patrón EntityWithStats está consolidado y optimizado
