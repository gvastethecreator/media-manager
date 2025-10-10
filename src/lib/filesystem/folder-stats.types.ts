/**
 * 📊 FOLDER STATS - TIPOS
 *
 * Tipos e interfaces para procesamiento de estadísticas de carpetas
 */

import type { ProcessStatus } from '@/types/folders';

export type SimpleStats = {
	totalFiles: number;
	processed: number;
	successful: number;
	failed: number;
	errors: Array<{ file: string; error: string }>;
};

export type ProgressEmitter = (status: ProcessStatus) => void;

export interface ProcessOptions {
	concurrency?: number;
	progressEmitter?: ProgressEmitter;
	microPauseMs?: number;
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
	totalFiles: number;
	totalSize: number;
	lastIndexed?: Date;
	imageCount?: number;
}
