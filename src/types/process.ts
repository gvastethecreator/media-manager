export type ProcessPhase = 'scanning' | 'indexing' | 'thumbnails' | 'metadata';

export interface ProcessStatus {
	status?: string;
	current?: number;
	total?: number;
	progress?: number;
	currentFile?: string;
	timestamp?: number;
	folderId?: string;
	phase?: ProcessPhase;
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
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
	fileDetails?: {
		name: string;
		size: number;
		type: string;
		dimensions?: {
			width: number;
			height: number;
		};
	};
	extendedStats?: {
		fileTypes: { [key: string]: number };
		averageSize: number;
		processingSpeed: number;
		errorsByType: { [key: string]: number };
		healthScore: number;
	};
}

export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
	};
}

export interface ReindexProgress {
	isProcessing: boolean;
	progress: number;
	currentFolder?: string;
	processedFolders: number;
	totalFolders: number;
	errors: Array<{
		folderId: string;
		error: string;
	}>;
}

export interface ReindexAllProgressData {
	current: number;
	total: number;
	progress: number;
	currentFolder?: string;
	phase?: ProcessPhase;
	status?: string;
}

export interface ReindexAllCompleteData {
	processedFolders: number;
	totalFolders: number;
	errors: Array<{ folderId: string; error: string }>;
	status?: string;
	progress?: number;
}
