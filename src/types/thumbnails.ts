export interface ThumbnailStats {
	pending: number;
	processed: number;
	totalFiles: number;
	withThumbnail: number;
	totalSize: number;
	errors: ThumbnailError[];
}

export interface ThumbnailError {
	imageId: string;
	imagePath: string;
	error: string;
	timestamp: string | Date;
}

export interface ThumbnailProcessStatus {
	status?: string;
	current?: number;
	total?: number;
	progress?: number;
	currentFile?: string;
	lastProcessed?: LastProcessedThumbnail;
}

export interface LastProcessedThumbnail {
	id: string;
	path: string;
	processedAt: string;
	saved?: number;
}

export interface OptimizeResult {
	optimized: number;
	totalSaved: number;
}

export interface CleanResult {
	cleaned: number;
	totalFreed: number;
}

export interface ReprocessResult {
	processed: number;
}

export interface ThumbnailCallbacks {
	onProgress?: (status: ThumbnailProcessStatus) => void;
	onError?: (error: unknown) => void;
	onComplete?: (data: OptimizeResult | CleanResult | ReprocessResult) => void;
}

export enum ThumbnailQuality {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

export interface ThumbnailQualityConfig {
	quality: number;
	width: number;
	height: number;
}

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, ThumbnailQualityConfig> = {
	[ThumbnailQuality.LOW]: { quality: 70, width: 300, height: 300 },
	[ThumbnailQuality.MEDIUM]: { quality: 80, width: 400, height: 400 },
	[ThumbnailQuality.HIGH]: { quality: 90, width: 500, height: 500 },
};
