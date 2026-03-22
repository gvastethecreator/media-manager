/**
 * @file Enhanced progress types for 3-stage file reindexing
 * @module types/folders/reindex-progress
 * @description Types for detailed 3-stage reindexing progress tracking
 */

export type ReindexStage = 1 | 2 | 3;

export interface ReindexStageInfo {
	/** Current file being processed */
	currentFile?: string;
	/** Current stage (1-3) */
	currentStage: ReindexStage;
	/** Stage description */
	stageDescription: string;
	/** Files processed in current stage */
	stageFilesProcessed: number;
	/** Stage name */
	stageName: string;
	/** Stage-specific progress (0-100) */
	stageProgress: number;
	/** Total files for current stage */
	stageTotalFiles: number;
	/** Total number of stages */
	totalStages: 3;
}

export interface EnhancedProgressStatus {
	/** Errors encountered */
	errors?: Array<{
		stage: ReindexStage;
		file: string;
		error: string;
	}>;
	/** Estimated completion time */
	estimatedCompletion?: number;
	/** Files processed across all stages */
	filesProcessed: number;
	/** Folder ID being processed */
	folderId: string;
	/** Overall processing status */
	isProcessing: boolean;
	/** Overall message */
	message: string;
	/** Overall progress (0-100) across all stages */
	overallProgress: number;
	/** Processing phase */
	phase: 'starting' | 'stage1' | 'stage2' | 'stage3' | 'complete' | 'error';
	/** Processing speed (files/second) */
	processingSpeed?: number;
	/** Stage-specific information */
	stage: ReindexStageInfo;
	/** Start time */
	startTime?: number;
	/** Operation status */
	status: 'processing' | 'completed' | 'error';
	/** Timestamp */
	timestamp: number;
	/** Total files across all stages */
	totalFiles: number;
}

export const REINDEX_STAGES = {
	1: {
		name: 'Indexación',
		description: 'Escaneando archivos y creando entidades básicas',
		getProgressMessage: (processed: number, total: number) => `Etapa 1/3: Indexando archivos... ${processed}/${total}`,
	},
	2: {
		name: 'Metadata',
		description: 'Extrayendo metadata de archivos',
		getProgressMessage: (processed: number, total: number) => `Etapa 2/3: Extrayendo metadata... ${processed}/${total}`,
	},
	3: {
		name: 'Thumbnails',
		description: 'Generando miniaturas',
		getProgressMessage: (processed: number, total: number) =>
			`Etapa 3/3: Procesando thumbnails... ${processed}/${total}`,
	},
} as const;

export type StageConfig = (typeof REINDEX_STAGES)[keyof typeof REINDEX_STAGES];
