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
	entityType: 'folder';
	stats: FolderStatistics;
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

/**
 * 📁 Estadísticas avanzadas para carpetas
 */
export interface FolderStatistics {
	// Métricas de jerarquía
	hierarchyDepth: number;
	totalDescendants: number;
	directChildren: number; // También conocido como directoryCount

	// Métricas de contenido
	contentDiversity: number;
	organizationScore: number;
	totalItems: number; // También conocido como totalFiles
	folderCount: number; // Número total de subcarpetas

	// Métricas de uso
	accessFrequency: number;
	lastActivity: Date | null;

	// Distribución de contenido
	imageCount: number; // También conocido como totalImages
	videoCount: number; // También conocido como totalVideos
	noteCount: number;
	documentCount: number; // También conocido como totalDocuments
	totalAudio: number; // Archivos de audio
	totalOthers: number; // Otros tipos de archivos

	// Métricas de tamaño
	formattedSize: string;
	totalSize: number; // Tamaño total en bytes
	averageFileSize: number;
	largestFile: number;

	// Análisis de nombres y organización
	hasConsistentNaming: boolean;
	hasDeepHierarchy: boolean;
	isWellOrganized: boolean;

	// Breadcrumbs y navegación
	breadcrumbs: Array<{ id: string; name: string; path: string }>;
	fullPath: string;
	relativePath: string;

	// Auto-tags generados
	autoTags: string[];

	// Calidad general
	qualityGrade: 'A' | 'B' | 'C' | 'D';

	// Relaciones
	totalRelations: number;

	// Compatibilidad con componentes
	lastScanned?: string;
	recentImages?: Array<{
		id: string;
		path: string;
		name: string;
		createdAt: string;
	}>;
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
	parent?: FolderBase | null;
	children?: FolderBase[];
	images?: any[];
	videos?: any[];
}

/**
 * 📁 Carpeta completa con relaciones
 */
export interface FolderComplete extends FolderBase {
	parent?: FolderBase | null;
	children?: FolderComplete[];
	images?: any[];
	videos?: any[];
	_count?: FolderCounts;
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
