/**
 * @file Tipos canónicos para la entidad Folder - Patrón EntityWithStats
 * @module types/entities/folder/types
 * @description Estructura unificada y validada para Folder siguiendo el patrón EntityWithStats.
 * Última migración: 2025-01-20
 */

/**
 * 📁 Tipo base para una carpeta - Campos principales
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
 * 📁 Tipo principal optimizado con estadísticas (USAR ESTE)
 */
export interface FolderWithStats extends FolderBase {
	statistics: FolderStatistics;
	_count: {
		children: number;
		images: number;
		videos: number;
	};
}

/**
 * 📁 Tipo completo para casos especiales (backward compatibility)
 */
export interface FolderComplete extends FolderBase {
	parent?: FolderBase | null;
	children?: FolderBase[];
	images?: unknown[];
	videos?: unknown[];
	_count?: {
		children?: number;
		images?: number;
		videos?: number;
		notes?: number;
		documents?: number;
	};
}

/**
 * 📁 Input para crear una nueva carpeta
 */
export interface FolderCreateInput
	extends Omit<
		FolderBase,
		| 'id'
		| 'createdAt'
		| 'updatedAt'
		| 'totalFiles'
		| 'totalSize'
		| 'lastIndexed'
		| 'isFavorite'
		| 'featuredImage'
		| 'description'
		| 'emoji'
		| 'color'
		| 'parentId'
		| 'presetId'
	> {
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	parentId?: string | null;
	presetId?: string | null;
	isFavorite?: boolean;
	featuredImage?: string | null;
}

/**
 * 📁 Input para actualizar una carpeta existente
 */
export interface FolderUpdateInput extends Partial<FolderCreateInput> {}

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
 * 📁 Tipo extendido con estado de UI
 */
export interface FolderExtended extends FolderComplete, FolderUIProps {}

/**
 * 📁 Tipo extendido y completo, con hijos también extendidos
 */
export interface FolderExtendedComplete extends FolderExtended {
	children?: FolderExtendedComplete[];
}

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
	orderBy?: Record<string, any>;
	filters?: FolderFilters;
	include?: Record<string, any>;
}

/**
 * 📁 Relaciones de una carpeta (para FolderComplete)
 */
export interface FolderRelations {
	images?: unknown[];
	videos?: unknown[];
	parent?: FolderBase | null;
	children?: FolderBase[];
}

/**
 * 📁 Conteos de las relaciones (para FolderComplete)
 */
export interface FolderCounts {
	_count?: {
		images?: number;
		children?: number;
		videos?: number;
		notes?: number;
		documents?: number;
	};
}

/**
 * 📁 Estadísticas básicas de una carpeta (legacy)
 */
export interface FolderStats {
	totalSize: number;
	totalFiles: number;
	lastModified: Date;
	imageCount: number;
	videoCount: number;
	directoryCount: number;
}

// Alias para retrocompatibilidad
export type CreateFolderData = FolderCreateInput;
export type UpdateFolderData = FolderUpdateInput;
export type FolderWithRelations = FolderComplete;
export type Folder = FolderComplete; // Alias principal

// 🟢 Documentación y advertencia:
// - USAR FolderWithStats como tipo principal en stores, componentes y lógica de negocio
// - FolderComplete solo para casos especiales o backward compatibility
// - Validar siempre con FolderSchema antes de persistir
// - El patrón EntityWithStats está consolidado y optimizado
