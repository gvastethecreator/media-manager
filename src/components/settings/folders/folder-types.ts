import type { FolderResponse } from '@/app/actions/folders/folder-types.actions';
import type { FolderStats } from '@/types/entities/folder';
import type {
	ExtendedProcessStatus,
	ProcessStatus,
	ReindexAllCompleteData,
	ReindexAllProgressData,
} from '@/types/process';

// Extender la interfaz Folder para incluir las propiedades adicionales
export interface ExtendedFolder extends Omit<FolderResponse, 'lastIndexed' | 'createdAt' | 'updatedAt'> {
	lastIndexed: Date | null;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		images: number;
	};
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

export const initialStats: FolderStats = {
	totalFolders: 0,
	totalFiles: 0,
	totalSize: 0,
	lastIndexed: null,
	createdAt: new Date(),
	updatedAt: new Date(),
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
