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
	autoReindex: boolean;
	lastIndexed: Date | null;
	parentId: string | null;
	presetId: string | null;
}

/**
 * 📁 Estadísticas calculadas para una carpeta
 */
export interface FolderStatistics {
	// Métricas de jerarquía
	hierarchyDepth: number;
	totalDescendants: number;
	directChildren: number;

	// Métricas de contenido
	contentDiversity: number; // 0-100 basado en variedad de tipos
	organizationScore: number; // 0-100 basado en estructura y nombres
	totalItems: number;
	totalFiles: number; // Movido de FolderBase
	totalSize: number; // Movido de FolderBase

	// Métricas de uso
	accessFrequency: number; // Frecuencia de acceso estimada
	lastActivity: Date | null;

	// Distribución de contenido
	imageCount: number;
	videoCount: number;
	noteCount: number;
	documentCount: number;
	folderCount: number;

	// Métricas de tamaño
	formattedSize: string; // "1.2 GB", "500 MB"
	averageFileSize: number;
	largestFile: number;

	// Análisis de nombres y organización
	hasConsistentNaming: boolean;
	hasDeepHierarchy: boolean; // >3 niveles
	isWellOrganized: boolean;

	// Breadcrumbs y navegación
	breadcrumbs: Array<{ id: string; name: string; path: string }>;
	fullPath: string;
	relativePath: string;

	// Auto-tags generados
	autoTags: string[];

	// Calidad general
	qualityGrade: 'A' | 'B' | 'C' | 'D'; // A: Excelente, D: Necesita organización

	// Relaciones
	totalRelations: number;
}

/**
 * 📁 Propiedades de UI para una carpeta
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
