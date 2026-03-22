/**
 * @file Progress Information Types
 * @module types/progress-tracking/progress-info
 * @description Define los tipos base para el sistema de progreso
 */

export type OperationType = 'copy' | 'move' | 'delete' | 'download' | 'upload' | 'compress' | 'extract';

export type ProgressStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface ProgressInfo {
	/** Current item being processed */
	currentItem?: string;
	/** Error information if failed */
	error?: string;
	/** Estimated time remaining in milliseconds */
	estimatedTimeRemaining?: number;
	/** Cancellation token */
	isCancelled: boolean;
	/** Operation identifier */
	operationId: string;
	/** Items processed so far */
	processedItems: number;
	/** Current progress (0-100) */
	progress: number;
	/** Start time */
	startTime: number;
	/** Operation status */
	status: ProgressStatus;
	/** Throughput (items per second) */
	throughput?: number;
	/** Total items to process */
	totalItems: number;
	/** Operation type */
	type: OperationType;
}

export interface ProgressOptions {
	/** Auto-dismiss completed operations */
	autoDismiss?: boolean;
	/** Auto-dismiss delay in milliseconds */
	autoDismissDelay?: number;
	/** Enable cancellation */
	cancellable?: boolean;
	/** Custom operation description */
	description?: string;
	/** Show toast notifications */
	showToast?: boolean;
	/** Total number of items */
	totalItems?: number;
}

export type ProgressCallback = (progress: ProgressInfo) => void;
