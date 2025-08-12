/**
 * Batch File Operations Service
 *
 * This service extends the existing file operations with batch processing
 * capabilities, progress tracking, and operation queuing.
 */

// Browser-compatible EventEmitter implementation
class EventEmitter {
	private events: { [key: string]: Function[] } = {};

	on(event: string, listener: Function): this {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(listener);
		return this;
	}

	emit(event: string, ...args: any[]): boolean {
		if (!this.events[event]) {
			return false;
		}
		this.events[event].forEach((listener) => {
			try {
				listener(...args);
			} catch (error) {
				console.error('Error in event listener:', error);
			}
		});
		return true;
	}

	removeListener(event: string, listener: Function): this {
		if (!this.events[event]) {
			return this;
		}
		const index = this.events[event].indexOf(listener);
		if (index > -1) {
			this.events[event].splice(index, 1);
		}
		return this;
	}

	removeAllListeners(event?: string): this {
		if (event) {
			delete this.events[event];
		} else {
			this.events = {};
		}
		return this;
	}
}

import { serverLogger } from '@/lib/logger/server-logger';
import { progressTrackingService } from '@/services/progress/progress-tracking.service';
import { toastService } from '@/services/toast/toast.service';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileErrorCode } from '@/types/entities/file';
import {
	copyFile,
	deleteFile,
	type FileCopyMoveResult,
	type FileOperationOptions,
	type FileOperationResult,
	moveFile,
} from './file.service';

const logger = serverLogger.withContext('BatchOperationsService');

// Helpers de path compatibles con navegador
const SEP_WIN = '\\';
const SEP_POSIX = '/';
const detectSep = (p: string): string => (p.includes(SEP_WIN) ? SEP_WIN : SEP_POSIX);
const joinPaths = (a: string, b: string): string => {
	const sep = detectSep(a || b);
	const aTrim = a.endsWith(sep) ? a.slice(0, -1) : a;
	const bTrim = b.startsWith(sep) ? b.slice(1) : b;
	if (!aTrim) {
		return bTrim;
	}
	if (!bTrim) {
		return aTrim;
	}
	return `${aTrim}${sep}${bTrim}`;
};

// Batch operation types
export interface BatchOperation {
	/** Unique operation identifier */
	id: string;
	/** Operation type */
	type: BatchOperationType;
	/** Items to process */
	items: AnyEntityWithStats[];
	/** Target path for copy/move operations */
	targetPath?: string;
	/** Operation options */
	options?: BatchOperationOptions;
	/** Operation status */
	status: BatchOperationStatus;
	/** Priority level */
	priority: BatchOperationPriority;
	/** Creation timestamp */
	createdAt: number;
	/** Start timestamp */
	startedAt?: number;
	/** Completion timestamp */
	completedAt?: number;
	/** Progress information */
	progress: BatchProgress;
	/** Results */
	results: BatchOperationResult[];
	/** Errors */
	errors: BatchOperationError[];
}

export type BatchOperationType = 'copy' | 'move' | 'delete' | 'rename';
export type BatchOperationStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
export type BatchOperationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface BatchOperationOptions extends FileOperationOptions {
	/** Maximum concurrent operations */
	maxConcurrency?: number;
	/** Retry failed operations */
	retryOnFailure?: boolean;
	/** Maximum retry attempts */
	maxRetries?: number;
	/** Continue on errors */
	continueOnError?: boolean;
	/** Show progress notifications */
	showProgress?: boolean;
	/** Auto-cleanup completed operations */
	autoCleanup?: boolean;
	/** Custom operation description */
	description?: string;
	/** Operation priority */
	priority?: BatchOperationPriority;
}

export interface BatchProgress {
	/** Total items */
	total: number;
	/** Processed items */
	processed: number;
	/** Failed items */
	failed: number;
	/** Skipped items */
	skipped: number;
	/** Progress percentage */
	percentage: number;
	/** Current item being processed */
	currentItem?: string;
	/** Estimated time remaining */
	estimatedTimeRemaining?: number;
	/** Throughput (items per second) */
	throughput?: number;
}

export interface BatchOperationResult {
	/** Source item */
	item: AnyEntityWithStats;
	/** Operation success */
	success: boolean;
	/** Result data */
	result?: FileCopyMoveResult | FileOperationResult;
	/** Error if failed */
	error?: string;
	/** Processing time */
	processingTime: number;
}

export interface BatchOperationError {
	/** Source item */
	item: AnyEntityWithStats;
	/** Error message */
	message: string;
	/** Error code */
	code?: FileErrorCode;
	/** Retry count */
	retryCount: number;
	/** Timestamp */
	timestamp: number;
}

/**
 * Batch File Operations Service
 */
class BatchFileOperationsService extends EventEmitter {
	private operations = new Map<string, BatchOperation>();
	private queue: string[] = [];
	private running = new Set<string>();
	private maxConcurrentOperations = 3;
	private isProcessing = false;

	constructor() {
		super();
		this.startQueueProcessor();
	}

	/**
	 * Queue a batch copy operation
	 */
	async queueCopyOperation(
		items: AnyEntityWithStats[],
		targetPath: string,
		options: BatchOperationOptions = {}
	): Promise<string> {
		const operationId = this.generateOperationId();

		const operation: BatchOperation = {
			id: operationId,
			type: 'copy',
			items,
			targetPath,
			options: {
				maxConcurrency: 3,
				retryOnFailure: true,
				maxRetries: 2,
				continueOnError: true,
				showProgress: true,
				autoCleanup: true,
				priority: 'normal',
				...options,
			},
			status: 'queued',
			priority: options.priority || 'normal',
			createdAt: Date.now(),
			progress: {
				total: items.length,
				processed: 0,
				failed: 0,
				skipped: 0,
				percentage: 0,
			},
			results: [],
			errors: [],
		};

		this.operations.set(operationId, operation);
		this.addToQueue(operationId);

		logger.info('📋 Batch copy operation queued:', {
			operationId,
			itemCount: items.length,
			targetPath,
		});

		return operationId;
	}

	/**
	 * Queue a batch move operation
	 */
	async queueMoveOperation(
		items: AnyEntityWithStats[],
		targetPath: string,
		options: BatchOperationOptions = {}
	): Promise<string> {
		const operationId = this.generateOperationId();

		const operation: BatchOperation = {
			id: operationId,
			type: 'move',
			items,
			targetPath,
			options: {
				maxConcurrency: 3,
				retryOnFailure: true,
				maxRetries: 2,
				continueOnError: true,
				showProgress: true,
				autoCleanup: true,
				priority: 'normal',
				...options,
			},
			status: 'queued',
			priority: options.priority || 'normal',
			createdAt: Date.now(),
			progress: {
				total: items.length,
				processed: 0,
				failed: 0,
				skipped: 0,
				percentage: 0,
			},
			results: [],
			errors: [],
		};

		this.operations.set(operationId, operation);
		this.addToQueue(operationId);

		logger.info('🚚 Batch move operation queued:', {
			operationId,
			itemCount: items.length,
			targetPath,
		});

		return operationId;
	}

	/**
	 * Queue a batch delete operation
	 */
	async queueDeleteOperation(items: AnyEntityWithStats[], options: BatchOperationOptions = {}): Promise<string> {
		const operationId = this.generateOperationId();

		const operation: BatchOperation = {
			id: operationId,
			type: 'delete',
			items,
			options,
			status: 'queued',
			priority: options.priority || 'normal',
			createdAt: Date.now(),
			progress: {
				total: items.length,
				processed: 0,
				failed: 0,
				skipped: 0,
				percentage: 0,
			},
			results: [],
			errors: [],
		};

		this.operations.set(operationId, operation);
		this.addToQueue(operationId);

		logger.info('🗑️ Batch delete operation queued:', {
			operationId,
			itemCount: items.length,
		});

		return operationId;
	}

	/**
	 * Get operation status
	 */
	getOperation(operationId: string): BatchOperation | undefined {
		return this.operations.get(operationId);
	}

	/**
	 * Get all operations
	 */
	getAllOperations(): BatchOperation[] {
		return Array.from(this.operations.values());
	}

	/**
	 * Cancel an operation
	 */
	cancelOperation(operationId: string): boolean {
		const operation = this.operations.get(operationId);
		if (!operation) {
			return false;
		}

		if (operation.status === 'queued') {
			// Remove from queue
			const queueIndex = this.queue.indexOf(operationId);
			if (queueIndex !== -1) {
				this.queue.splice(queueIndex, 1);
			}
		}

		operation.status = 'cancelled';
		operation.completedAt = Date.now();

		this.running.delete(operationId);
		this.emit('operationCancelled', operation);

		logger.info('❌ Operation cancelled:', operationId);
		return true;
	}

	/**
	 * Pause an operation
	 */
	pauseOperation(operationId: string): boolean {
		const operation = this.operations.get(operationId);
		if (!operation || operation.status !== 'running') {
			return false;
		}

		operation.status = 'paused';
		this.emit('operationPaused', operation);

		logger.info('⏸️ Operation paused:', operationId);
		return true;
	}

	/**
	 * Resume a paused operation
	 */
	resumeOperation(operationId: string): boolean {
		const operation = this.operations.get(operationId);
		if (!operation || operation.status !== 'paused') {
			return false;
		}

		operation.status = 'queued';
		this.addToQueue(operationId);
		this.emit('operationResumed', operation);

		logger.info('▶️ Operation resumed:', operationId);
		return true;
	}

	/**
	 * Clear completed operations
	 */
	clearCompletedOperations(): void {
		const completedIds: string[] = [];

		for (const [id, operation] of this.operations) {
			if (operation.status === 'completed' || operation.status === 'failed' || operation.status === 'cancelled') {
				completedIds.push(id);
			}
		}

		completedIds.forEach((id) => {
			this.operations.delete(id);
		});

		logger.info('🧹 Cleared completed operations:', completedIds.length);
	}

	/**
	 * Add operation to queue with priority sorting
	 */
	private addToQueue(operationId: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) {
			return;
		}

		// Insert based on priority
		const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
		const operationPriority = priorityOrder[operation.priority];

		let insertIndex = this.queue.length;
		for (let i = 0; i < this.queue.length; i++) {
			const queuedOperation = this.operations.get(this.queue[i]);
			if (queuedOperation && priorityOrder[queuedOperation.priority] > operationPriority) {
				insertIndex = i;
				break;
			}
		}

		this.queue.splice(insertIndex, 0, operationId);
	}

	/**
	 * Start queue processor
	 */
	private startQueueProcessor(): void {
		if (this.isProcessing) {
			return;
		}

		this.isProcessing = true;
		this.processQueue();
	}

	/**
	 * Process operation queue
	 */
	private async processQueue(): Promise<void> {
		while (this.isProcessing) {
			// Check if we can start more operations
			if (this.running.size >= this.maxConcurrentOperations || this.queue.length === 0) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				continue;
			}

			const operationId = this.queue.shift();
			if (!operationId) {
				continue;
			}

			const operation = this.operations.get(operationId);
			if (!operation || operation.status !== 'queued') {
				continue;
			}

			this.running.add(operationId);
			this.executeOperation(operationId).finally(() => {
				this.running.delete(operationId);
			});
		}
	}

	/**
	 * Execute a batch operation
	 */
	private async executeOperation(operationId: string): Promise<void> {
		const operation = this.operations.get(operationId);
		if (!operation) {
			return;
		}

		try {
			operation.status = 'running';
			operation.startedAt = Date.now();

			// Map batch operation type to progress tracking type
			const progressType =
				operation.type === 'copy'
					? 'file_copy'
					: operation.type === 'move'
						? 'file_move'
						: operation.type === 'delete'
							? 'file_delete'
							: 'batch_operation';

			// Start progress tracking
			const progressId = `batch-${operationId}`;
			progressTrackingService.startOperation(progressType, operation.items.length, {
				showToast: operation.options?.showProgress !== false,
				description: operation.options?.description || this.getOperationDescription(operation),
				cancellable: true,
			});

			this.emit('operationStarted', operation);

			// Process items
			for (let i = 0; i < operation.items.length; i++) {
				// Si la operación fue cancelada/pausada, detener el loop
				if (operation.status !== 'running') {
					break;
				}

				const item = operation.items[i];
				const startTime = Date.now();
				const itemName = 'name' in item ? (item as any).name : (item as any).fileName || `item-${i + 1}`;

				try {
					let result: FileCopyMoveResult | FileOperationResult | undefined;

					// Get file path from entity
					const itemPath = 'path' in item ? (item as any).path : (item as any).filePath || '';

					switch (operation.type) {
						case 'copy':
							if (operation.targetPath && itemPath) {
								const destPath = joinPaths(operation.targetPath, itemName);
								result = await copyFile(itemPath, destPath, operation.options);
							}
							break;

						case 'move':
							if (operation.targetPath && itemPath) {
								const destPath = joinPaths(operation.targetPath, itemName);
								result = await moveFile(itemPath, destPath, operation.options);
							}
							break;

						case 'delete':
							if (itemPath) {
								result = await deleteFile(itemPath);
							}
							break;
					}

					const processingTime = Date.now() - startTime;

					operation.results.push({
						item,
						success: true,
						result,
						processingTime,
					});

					operation.progress.processed++;
				} catch (error) {
					const processingTime = Date.now() - startTime;
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';

					operation.errors.push({
						item,
						message: errorMessage,
						code: (error as any)?.code,
						retryCount: 0,
						timestamp: Date.now(),
					});

					operation.results.push({
						item,
						success: false,
						error: errorMessage,
						processingTime,
					});

					operation.progress.failed++;

					// Continue on error if configured
					if (!operation.options?.continueOnError) {
						throw error;
					}
				}

				// Update progress
				operation.progress.percentage = Math.round(
					((operation.progress.processed + operation.progress.failed) / operation.progress.total) * 100
				);

				progressTrackingService.updateProgress(
					progressId,
					operation.progress.processed + operation.progress.failed,
					itemName
				);

				this.emit('operationProgress', operation);
			}

			// Complete operation
			operation.status = operation.progress.failed > 0 && !operation.options?.continueOnError ? 'failed' : 'completed';
			operation.completedAt = Date.now();

			progressTrackingService.completeOperation(progressId);
			this.emit('operationCompleted', operation);

			// Show completion toast
			if (operation.options?.showProgress !== false) {
				const successCount = operation.progress.processed;
				const failedCount = operation.progress.failed;

				if (failedCount === 0) {
					toastService.success(
						`${this.getOperationDescription(operation)} completada: ${successCount} elementos procesados`
					);
				} else {
					toastService.warning(
						`${this.getOperationDescription(operation)} completada con errores: ${successCount} exitosos, ${failedCount} fallidos`
					);
				}
			}

			// Auto-cleanup if enabled
			if (operation.options?.autoCleanup) {
				setTimeout(() => {
					this.operations.delete(operationId);
				}, 30_000); // Clean up after 30 seconds
			}
		} catch (error) {
			operation.status = 'failed';
			operation.completedAt = Date.now();

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			logger.error('❌ Batch operation failed:', { operationId, error: errorMessage });

			this.emit('operationFailed', operation, error);

			if (operation.options?.showProgress !== false) {
				toastService.error(`${this.getOperationDescription(operation)} falló: ${errorMessage}`);
			}
		}
	}

	/**
	 * Generate unique operation ID
	 */
	private generateOperationId(): string {
		return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Get operation description
	 */
	private getOperationDescription(operation: BatchOperation): string {
		const itemCount = operation.items.length;
		const itemText = itemCount === 1 ? 'elemento' : 'elementos';

		switch (operation.type) {
			case 'copy':
				return `Copiando ${itemCount} ${itemText}`;
			case 'move':
				return `Moviendo ${itemCount} ${itemText}`;
			case 'delete':
				return `Eliminando ${itemCount} ${itemText}`;
			default:
				return `Procesando ${itemCount} ${itemText}`;
		}
	}
}

// Create and export service instance
export const batchFileOperationsService = new BatchFileOperationsService();
