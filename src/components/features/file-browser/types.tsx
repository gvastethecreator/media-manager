import type { FOLDER_EVENTS } from '@/services/folder-service-export';

export interface ProcessStatus {
	status?: string;
	current?: number;
	total?: number;
	progress?: number;
	currentFile?: string;
	timestamp?: number;
	folderId?: string;
	phase?: 'scanning' | 'indexing' | 'thumbnails' | 'metadata';
	filesProcessed?: number;
	totalFiles?: number;
	errors?: Array<{
		file: string;
		error: string;
		timestamp: number;
	}>;
	startTime?: number;
	estimatedTimeRemaining?: number;
	processingSpeed?: number;
}

export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}

export type { FOLDER_EVENTS };
