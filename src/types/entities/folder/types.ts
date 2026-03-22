/**
 * @file Tipos canónicos para la entidad Folder - Patrón EntityWithStats
 * @module types/entities/folder/types
 * @description Estructura unificada y validada para Folder siguiendo el patrón EntityWithStats.
 * Última migración: 2025-01-20
 */

/**
 * 📁 Tipo base para una carpeta - Campos principales
 */
import type { EntityBase } from '../entity.types';

/**
 * 📁 Tipo base para una carpeta - Campos principales
 */
export interface FolderBase extends EntityBase {
	color: string | null;
	description: string | null;
	emoji: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	lastIndexed: Date | null;
	name: string;
	parentId: string | null;
	path: string;
	presetId: string | null;
	totalFiles: number;
	totalSize: number;
}

/**
 * 📁 Tipo principal optimizado con estadísticas (USAR ESTE)
 */
export interface FolderWithStats extends FolderBase {
	// Conteos para compatibilidad
	_count?: FolderCounts;

	// Propiedades del sistema de archivos y navegación
	children?: FolderWithStats[]; // Para estructuras recursivas
	entityType: 'folder';
	recentImages?: Array<{
		id: string;
		name: string;
		thumbnailUrl: string;
	}>; // Imágenes recientes para compatibilidad con ExtendedFolder
	stats: FolderStatistics;

	// Propiedades adicionales de archivo
	type?: string;
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
	hasImages?: boolean;
	hierarchyDepth?: number;
	isFavorite?: boolean;
	organizationScore?: { min?: number; max?: number };
	parentId?: string | null;
	search?: string;
}

/**
 * 📁 Opciones para las consultas de búsqueda de carpetas
 */
export interface FolderSearchOptions {
	filters?: FolderFilters;
	include?: Record<string, boolean>;
	orderBy?: Record<string, 'asc' | 'desc'>;
	skip?: number;
	take?: number;
}

/**
 * 📁 Configuración de vista para carpetas
 */
export interface FolderViewConfig {
	cardSize: 'small' | 'medium' | 'large';
	compactView: boolean;
	enableAnimations: boolean;
	gridColumns: number;
	groupBy: string | null;
	imageCount: number;
	showImages: boolean;
	showStats: boolean;
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	viewType: 'grid' | 'list' | 'tree';
}

/**
 * 📁 Propiedades de UI para carpetas
 */
export interface FolderUIProps {
	_count?: {
		children?: number;
		images?: number;
		videos?: number;
	};
}

import { EntityStats } from '../entity.types';

/**
 * 📁 Estadísticas avanzadas para carpetas
 */
export interface FolderStatistics extends EntityStats {
	// Métricas de uso
	accessFrequency: number;

	// Auto-tags generados
	autoTags: string[];
	averageFileSize: number;

	// Breadcrumbs y navegación
	breadcrumbs: Array<{ id: string; name: string; path: string }>;

	// Métricas de contenido
	contentDiversity: number;
	directChildren: number; // También conocido como directoryCount
	documentCount: number; // Conteo de documentos
	folderCount: number; // Número total de subcarpetas

	// Métricas de tamaño
	formattedSize: string;
	fullPath: string;

	// Análisis de nombres y organización
	hasConsistentNaming: boolean;
	hasDeepHierarchy: boolean;
	// Métricas de jerarquía
	hierarchyDepth: number;

	// Funciones de archivo del sistema
	isDirectory?: () => boolean;
	isFile?: () => boolean;
	isWellOrganized: boolean;
	largestFile: number;
	lastActivity: Date | null;

	// Compatibilidad con componentes
	lastScanned?: string;
	organizationScore: number;

	// Calidad general
	qualityGrade: 'A' | 'B' | 'C' | 'D';
	recentImages?: Array<{
		id: string;
		path: string;
		name: string;
		createdAt: string;
	}>;
	relativePath: string;
	totalAudio: number; // Archivos de audio
	totalDescendants: number;
	totalDocuments: number; // Total de documentos
	totalFiles: number; // Total de archivos
	totalFolders: number; // Total de carpetas
	totalImages: number; // Total de imágenes
	totalOthers: number; // Otros tipos de archivos
	totalRelations: number; // Total de relaciones
	totalSize: number; // Tamaño total en bytes
	totalVideos: number; // Total de videos
}

/**
 * 📁 Conteos relacionados para carpetas
 */
export interface FolderCounts {
	children?: number;
	images?: number;
	videos?: number;
}

/**
 * 📁 Relaciones de carpetas
 */
export interface FolderRelations {
	children?: FolderBase[];
	images?: any[];
	parent?: FolderBase | null;
	videos?: any[];
}

/**
 * 📁 Carpeta completa con relaciones
 */
export interface FolderComplete extends FolderBase {
	_count?: FolderCounts;
	children?: FolderComplete[];
	images?: any[];
	parent?: FolderBase | null;
	videos?: any[];
}

/**
 * 📁 Carpeta extendida con propiedades de UI
 */
export interface FolderExtended extends FolderComplete, FolderUIProps {
	// Propiedades adicionales de UI se heredan de FolderUIProps
}

/**
 * 📁 Carpeta extendida completa
 */
export interface FolderExtendedComplete extends FolderExtended {
	statistics?: FolderStatistics;
}

/**
 * 📁 Carpeta con relaciones completas
 */
export interface FolderWithRelations extends FolderBase {
	relations: FolderRelations;
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
