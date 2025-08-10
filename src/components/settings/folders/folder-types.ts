import { createDefaultEntityStats } from '@/lib/utils';
import type { FolderExtended, FolderStatistics } from '@/types/entities/folder';

/**
 * 📁 Extensión del tipo canónico para incluir estado de error temporal
 * Usado en los componentes de UI para mostrar errores de procesamiento
 */
export interface ExtendedFolder extends FolderExtended {
	error?: string; // Error temporal durante el procesamiento
	// lastIndexed ya está en FolderBase
	// emoji ya está en FolderBase
	// description ya está en FolderBase
	// isFavorite ya está en FolderBase
	// parentId ya está en FolderBase
	children?: ExtendedFolder[]; // Override para usar ExtendedFolder en lugar de FolderComplete
	// autoReindex ya está en FolderBase
	// path ya está en FolderBase

	// Propiedades adicionales para compatibilidad con componentes
	totalAudio?: number;
	totalDocuments?: number;
	totalOthers?: number;
	recentImages?: Array<{ id: string; name: string; thumbnailUrl?: string }>;
}

// 🔄 Estado extendido del proceso con propiedades adicionales
export interface ExtendedProcessStatus {
	isProcessing: boolean;
	progress?: number;
	message?: string;
	error?: string;
	folderId?: string;
	phase?: 'starting' | 'scanning' | 'processing' | 'metadata' | 'complete' | 'indexing' | 'thumbnails';
	timestamp?: number;
	filesProcessed?: number;
	totalFiles?: number;
	status?: 'processing' | 'completed' | 'error';
	startTime?: number;
	endTime?: number;
	currentFile?: string;
	estimatedTimeRemaining?: number;
	errors?: string[];
	extendedStats?: {
		processingSpeed?: number;
		averageSize?: number;
	};
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}

export interface GlobalReindexStatus {
	isProcessing: boolean;
	progress: number;
	processedFolders: number;
	totalFolders: number;
	errors: Array<{ folderId: string; error: string }>;
	currentFolder?: string;
	phase?: string;
	status?: string;
	startTime?: number;
	endTime?: number;
	duration?: number;
	lastUpdate?: number;
}

export interface GlobalProcessingState {
	isProcessing: boolean;
	currentFolder: string | null;
	currentFile: string | null;
	fileProgress: {
		processed: number;
		total: number;
		current: string;
	};
}

// Usar FolderStatistics del tipo correcto
export const initialStats: FolderStatistics = {
	// Base canónica de EntityStats: completa con contadores mínimos
	...createDefaultEntityStats({ type: 'directory' }),
	imageCount: 0,
	videoCount: 0,
	albumCount: 0,
	collectionCount: 0,
	tagCount: 0,
	characterCount: 0,
	placeCount: 0,
	worldItemCount: 0,
	conceptCount: 0,
	promptCount: 0,
	noteCount: 0,
	wildcardCount: 0,
	propertyCount: 0,
	groupCount: 0,
	viewCount: 0,
	downloadCount: 0,
	likeCount: 0,
	commentCount: 0,
	totalItems: 0,
	totalAssociations: 0,
	lastUpdated: new Date(0),

	// Métricas de jerarquía
	hierarchyDepth: 0,
	totalDescendants: 0,
	directChildren: 0,

	// Métricas de contenido
	contentDiversity: 0,
	organizationScore: 0,
	folderCount: 0,
	totalAudio: 0,
	totalOthers: 0,
	totalImages: 0,
	totalVideos: 0,
	totalDocuments: 0,
	totalFolders: 0,
	totalFiles: 0,
	documentCount: 0,
	totalRelations: 0,

	// Métricas de uso
	accessFrequency: 0,
	lastActivity: null,

	// Métricas de tamaño
	formattedSize: '0 B',
	totalSize: 0,
	averageFileSize: 0,
	largestFile: 0,

	// Análisis de nombres y organización
	hasConsistentNaming: false,
	hasDeepHierarchy: false,
	isWellOrganized: false,

	// Breadcrumbs y navegación
	breadcrumbs: [],
	fullPath: '',
	relativePath: '',

	// Auto-tags generados
	autoTags: [],

	// Calidad general
	qualityGrade: 'D',
};

export const initialGlobalReindexStatus: GlobalReindexStatus = {
	isProcessing: false,
	progress: 0,
	processedFolders: 0,
	totalFolders: 0,
	errors: [],
};

export const initialGlobalProcessingState: GlobalProcessingState = {
	isProcessing: false,
	currentFolder: null,
	currentFile: null,
	fileProgress: {
		processed: 0,
		total: 0,
		current: '',
	},
};
