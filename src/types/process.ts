export type ProcessPhase = 'scanning' | 'indexing' | 'thumbnails' | 'metadata' | 'error' | 'starting';

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
	errors?: Array<{
		file: string;
		error: string;
		timestamp: number;
	}>;
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
		processed?: number;
	};
	startTime?: number;
	endTime?: number;
	processingSpeed?: number;
	estimatedTimeRemaining?: number;
	message?: string;
}

export interface ExtendedProcessStatus extends ProcessStatus {
	globalProgress?: {
		current: number;
		total: number;
		progress: number;
		processed?: number;
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
	processedFolders: number;
	errors?: Array<{ folderId: string; error: string }>;
}

export interface ReindexAllCompleteData {
	processedFolders: number;
	totalFolders: number;
	errors: Array<{ folderId: string; error: string }>;
	status?: string;
	progress?: number;
}

export interface ErrorResponse {
	message: string;
	details?: string;
	folderId?: string;
	phase?: string;
	timestamp: number;
	type?: string;
}
