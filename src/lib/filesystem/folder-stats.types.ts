/**
 * 📊 FOLDER STATS - TIPOS
 *
 * Tipos e interfaces para procesamiento de estadísticas de carpetas
 */

import type { ProcessStatus } from '@/types/folders';

export interface SimpleStats {
	errors: Array<{ file: string; error: string }>;
	failed: number;
	processed: number;
	successful: number;
	totalFiles: number;
}

export type ProgressEmitter = (status: ProcessStatus) => void;

export interface ProcessOptions {
	concurrency?: number;
	microPauseMs?: number;
	progressEmitter?: ProgressEmitter;
}

export interface FileEntityMapper {
	createBasicEntityFromFile: (
		filePath: string,
		folderId: string
	) => Promise<{ success: boolean; entityId?: string; entityType?: string }>;
	extractMetadataForEntity: (filePath: string, entityId: string) => Promise<{ success: boolean }>;
	processThumbnailForEntity: (filePath: string, entityId: string) => Promise<{ success: boolean }>;
}

export interface AggregateResult {
	imageCount?: number;
	lastIndexed?: Date;
	totalFiles: number;
	totalSize: number;
}
