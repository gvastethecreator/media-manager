import type { ProcessStatus } from '@/types/folders';
import type { FolderExtended, FolderStats } from '@/types/entities/folder';

/**
 * 📁 Extensión del tipo canónico para incluir estado de error temporal
 * Usado en los componentes de UI para mostrar errores de procesamiento
 */
export interface ExtendedFolder extends FolderExtended {
	error?: string; // Error temporal durante el procesamiento
}

// 🔄 Estado extendido del proceso con propiedades adicionales
export interface ExtendedProcessStatus extends ProcessStatus {
	phase?: 'starting' | 'scanning' | 'processing' | 'metadata' | 'complete';
	timestamp?: number;
	startTime?: number;
	filesProcessed?: number; // Añadido ya que se usa en use-folders.ts
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

// Usar FolderStatistics en lugar de FolderStats legacy
export const initialStats: FolderStats = {
	folderCount: 0,
	totalSize: 0,
	averageSize: 0,
	organizationScore: 0,
	hierarchyDepth: 0,
	indexingProgress: 0,
	lastIndexed: null,
	isIndexing: false,
	hasErrors: false,
	qualityScore: 0,
	tags: [],
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
