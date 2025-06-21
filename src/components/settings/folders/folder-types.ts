import type { FolderResponse } from '@/app/actions/folders/folder-types.actions';
import type { FolderStatistics } from '@/types/entities/folder';

// Extender la interfaz Folder para incluir las propiedades adicionales
export interface ExtendedFolder extends Omit<FolderResponse, 'lastIndexed' | 'createdAt' | 'updatedAt'> {
	lastIndexed: Date | null;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		images: number;
	};
	totalSize: number;
	totalFiles: number;
	autoReindex: boolean;
	error?: string;
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
export const initialStats: FolderStatistics = {
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
