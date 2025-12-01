/**
 * Progress Tracking Service
 *
 * This service provides progress tracking capabilities for file operations
 * such as copy, move, delete, and download operations. It integrates with
 * the existing file service and toast service for user feedback.
 */

import type {
	ItemsInfo,
	OperationType,
	ProgressInfo,
	ProgressOperation,
	SizeInfo,
} from '@/types/file-browser/progress-tracking';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '../toast/toast.service';

// Export types for external use
export type {
	OperationType,
	ProgressInfo,
	ProgressOperation,
	ProgressStatus,
} from '@/types/file-browser/progress-tracking';

// Simple EventEmitter implementation for browser compatibility
type ProgressEvents =
	| { type: 'operationStarted'; payload: ProgressOperation }
	| { type: 'progressUpdated'; payload: ProgressOperation }
	| { type: 'operationCompleted'; payload: ProgressOperation }
	| { type: 'operationFailed'; payload: ProgressOperation }
	| { type: 'operationCancelled'; payload: ProgressOperation };

type Listener<T> = (payload: T) => void;

class TypedEventEmitter {
	private events: Map<string, Set<Listener<any>>> = new Map();

	on<TEvent extends ProgressEvents['type']>(
		event: TEvent,
		listener: Listener<Extract<ProgressEvents, { type: TEvent }>['payload']>
	): void {
		const set = this.events.get(event) ?? new Set();
		set.add(listener as Listener<any>);
		this.events.set(event, set);
	}

	off<TEvent extends ProgressEvents['type']>(
		event: TEvent,
		listener: Listener<Extract<ProgressEvents, { type: TEvent }>['payload']>
	): void {
		const set = this.events.get(event);
		if (!set) return;
		set.delete(listener as Listener<any>);
		if (set.size === 0) this.events.delete(event);
	}

	emit<TEvent extends ProgressEvents['type']>(
		event: TEvent,
		payload: Extract<ProgressEvents, { type: TEvent }>['payload']
	): void {
		const set = this.events.get(event);
		if (!set) return;
		for (const listener of set) {
			try {
				(listener as Listener<typeof payload>)(payload);
			} catch (err) {
				clientLogger.error('[ProgressTracking] listener error', err);
			}
		}
	}

	removeAllListeners(event?: ProgressEvents['type']): void {
		if (event) {
			this.events.delete(event);
		} else {
			this.events.clear();
		}
	}
}

export interface ProgressOptions {
	/** Show toast notifications */
	showToast?: boolean;
	/** Auto-dismiss completed operations */
	autoDismiss?: boolean;
	/** Auto-dismiss delay in milliseconds */
	autoDismissDelay?: number;
	/** Enable cancellation */
	cancellable?: boolean;
	/** Custom operation description */
	description?: string;
	/** Total number of items */
	totalItems?: number;
	/** Priority level */
	priority?: number;
	/** Metadata */
	metadata?: Record<string, any>;
}

export type ProgressCallback = (operation: ProgressOperation) => void;

/**
 * Progress Tracking Service
 * Manages progress tracking for long-running file operations
 */
class ProgressTrackingService extends TypedEventEmitter {
	private operations = new Map<string, ProgressOperation>();
	private callbacks = new Map<string, ProgressCallback[]>();
	private toastIds = new Map<string, string | number>();

	/**
	 * Generate unique operation ID
	 */
	generateOperationId(): string {
		return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Start tracking a new operation
	 */
	startOperation(type: OperationType, totalItems: number, options: ProgressOptions = {}): ProgressInfo {
		const operationId = this.generateOperationId();
		const now = Date.now();

		const progressInfo: ProgressInfo = {
			current: 0,
			total: totalItems || 100,
			percentage: 0,
			speed: 0,
			eta: null,
			startTime: now,
			endTime: null,
			duration: 0,
		};

		const itemsInfo: ItemsInfo = {
			processed: 0,
			total: totalItems || 0,
			failed: 0,
			skipped: 0,
			remaining: totalItems || 0,
		};

		const sizeInfo: SizeInfo = {
			processed: 0,
			total: 0,
			remaining: 0,
		};

		const operation: ProgressOperation = {
			id: operationId,
			type,
			name: options.description || this.getOperationDescription(type, totalItems || 0),
			description: options.description,
			status: 'pending',
			progress: progressInfo,
			items: itemsInfo,
			size: sizeInfo,
			steps: [],
			currentStep: null,
			priority: options.priority || 1,
			metadata: options.metadata || {},
			error: null,
			retryCount: 0,
			createdAt: now,
			updatedAt: now,
			startTime: now,
			cancellable: options.cancellable,
			pausable: false,
			paused: false,
		};

		this.operations.set(operationId, operation);
		this.callbacks.set(operationId, []);

		// Show initial toast if enabled
		if (options.showToast !== false) {
			const description = operation.name;
			const toastId = toastService.info(`${description} - Iniciando...`, {
				duration: 0, // Don't auto-dismiss
				action: options.cancellable
					? {
							label: 'Cancelar',
							onClick: () => this.cancelOperation(operationId),
						}
					: undefined,
			});
			this.toastIds.set(operationId, toastId);
		}

		this.emit('operationStarted', operation);
		return progressInfo;
	}

	/**
	 * Update operation progress
	 */
	updateProgress(operationId: string, progressValue: number, _currentItem?: string): void {
		const operation = this.operations.get(operationId);
		if (!operation || operation.status === 'cancelled') {
			return;
		}

		const percentage = Math.min(100, Math.max(0, progressValue));
		const now = Date.now();
		const startTime = operation.progress.startTime || operation.startTime || operation.createdAt;
		const elapsed = now - startTime;

		// Calculate throughput and estimated time remaining
		const processedItems = Math.floor((percentage / 100) * operation.items.total);
		const throughput = processedItems / (elapsed / 1000);
		const remainingItems = operation.items.total - processedItems;
		const estimatedTimeRemaining = throughput > 0 ? (remainingItems / throughput) * 1000 : null;

		const updatedProgress: ProgressInfo = {
			...operation.progress,
			current: processedItems,
			percentage,
			speed: throughput,
			eta: estimatedTimeRemaining ? now + estimatedTimeRemaining : null,
			endTime: percentage >= 100 ? now : null,
			duration: elapsed,
		};

		const updatedItems: ItemsInfo = {
			...operation.items,
			processed: processedItems,
			remaining: operation.items.total - processedItems,
		};

		const updatedOperation: ProgressOperation = {
			...operation,
			progress: updatedProgress,
			items: updatedItems,
			status: percentage >= 100 ? 'completed' : 'running',
			updatedAt: now,
		};

		this.operations.set(operationId, updatedOperation);

		// Update toast
		const toastId = this.toastIds.get(operationId);
		if (toastId) {
			const progressText = `${Math.round(percentage)}%`;
			const etaText = estimatedTimeRemaining ? ` - ${this.formatTimeRemaining(estimatedTimeRemaining)} restante` : '';

			const message = `${operation.name} - ${progressText}${etaText}`;
			toastService.dismiss(toastId);

			const newToastId = toastService.info(message, {
				duration: 0,
				action: operation.cancellable
					? {
							label: 'Cancelar',
							onClick: () => this.cancelOperation(operationId),
						}
					: undefined,
			});
			this.toastIds.set(operationId, newToastId);
		}

		// Notify callbacks
		const callbacks = this.callbacks.get(operationId) || [];
		for (const callback of callbacks) callback(updatedOperation);

		this.emit('progressUpdated', updatedOperation);

		// Complete operation if finished
		if (percentage >= 100) {
			this.completeOperation(operationId);
		}
	}

	/**
	 * Complete an operation
	 */
	completeOperation(operationId: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) {
			return;
		}

		const now = Date.now();
		const startTime = operation.progress.startTime || operation.startTime || operation.createdAt;
		const completedOperation: ProgressOperation = {
			...operation,
			status: 'completed',
			progress: {
				...operation.progress,
				percentage: 100,
				endTime: now,
				duration: now - startTime,
			},
			updatedAt: now,
		};

		this.operations.set(operationId, completedOperation);

		// Update toast to success
		const toastId = this.toastIds.get(operationId);
		if (toastId) {
			toastService.dismiss(toastId);
			toastService.success(`${operation.name} - Completado`, { duration: 3000 });
		}

		// Notify callbacks
		const callbacks = this.callbacks.get(operationId) || [];
		for (const callback of callbacks) callback(completedOperation);

		this.emit('operationCompleted', completedOperation);

		// Clean up after delay
		setTimeout(() => {
			this.cleanupOperation(operationId);
		}, 5000);
	}

	/**
	 * Fail an operation
	 */
	failOperation(operationId: string, error: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) {
			return;
		}

		const failedOperation: ProgressOperation = {
			...operation,
			status: 'failed',
			error,
			updatedAt: Date.now(),
		};

		this.operations.set(operationId, failedOperation);

		// Update toast to error
		const toastId = this.toastIds.get(operationId);
		if (toastId) {
			toastService.dismiss(toastId);
			toastService.error(`${operation.name} - Error: ${error}`, { duration: 5000 });
		}

		// Notify callbacks
		const callbacks = this.callbacks.get(operationId) || [];
		for (const callback of callbacks) callback(failedOperation);

		this.emit('operationFailed', failedOperation);

		// Clean up after delay
		setTimeout(() => {
			this.cleanupOperation(operationId);
		}, 10_000);
	}

	/**
	 * Cancel an operation
	 */
	cancelOperation(operationId: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) {
			return;
		}

		const cancelledOperation: ProgressOperation = {
			...operation,
			status: 'cancelled',
			updatedAt: Date.now(),
		};

		this.operations.set(operationId, cancelledOperation);

		// Update toast
		const toastId = this.toastIds.get(operationId);
		if (toastId) {
			toastService.dismiss(toastId);
			toastService.warning(`${operation.name} - Cancelado`, { duration: 3000 });
		}

		// Notify callbacks
		const callbacks = this.callbacks.get(operationId) || [];
		for (const callback of callbacks) callback(cancelledOperation);

		this.emit('operationCancelled', cancelledOperation);

		// Clean up after delay
		setTimeout(() => {
			this.cleanupOperation(operationId);
		}, 3000);
	}

	/**
	 * Subscribe to progress updates for an operation
	 */
	onProgress(operationId: string, callback: ProgressCallback): () => void {
		const callbacks = this.callbacks.get(operationId) || [];
		callbacks.push(callback);
		this.callbacks.set(operationId, callbacks);

		// Return unsubscribe function
		return () => {
			const updatedCallbacks = this.callbacks.get(operationId) || [];
			const index = updatedCallbacks.indexOf(callback);
			if (index > -1) {
				updatedCallbacks.splice(index, 1);
				this.callbacks.set(operationId, updatedCallbacks);
			}
		};
	}

	/**
	 * Get current operation info
	 */
	getOperation(operationId: string): ProgressOperation | undefined {
		return this.operations.get(operationId);
	}

	/**
	 * Get all active operations
	 */
	getActiveOperations(): ProgressOperation[] {
		return Array.from(this.operations.values()).filter((op) => op.status === 'running' || op.status === 'pending');
	}

	/**
	 * Get all operations
	 */
	getAllOperations(): ProgressOperation[] {
		return Array.from(this.operations.values());
	}

	/**
	 * Check if operation is cancelled
	 */
	isCancelled(operationId: string): boolean {
		const operation = this.operations.get(operationId);
		return operation?.status === 'cancelled';
	}

	/**
	 * Clear completed operations
	 */
	clearCompleted(): void {
		for (const [id, operation] of this.operations.entries()) {
			if (operation.status === 'completed' || operation.status === 'failed' || operation.status === 'cancelled') {
				this.cleanupOperation(id);
			}
		}
	}

	/**
	 * Clean up operation data
	 */
	private cleanupOperation(operationId: string): void {
		this.operations.delete(operationId);
		this.callbacks.delete(operationId);

		const toastId = this.toastIds.get(operationId);
		if (toastId) {
			toastService.dismiss(toastId);
			this.toastIds.delete(operationId);
		}
	}

	/**
	 * Get operation description
	 */
	private getOperationDescription(type: OperationType, totalItems: number): string {
		const itemText = totalItems === 1 ? 'elemento' : 'elementos';

		switch (type) {
			case 'file_copy':
				return `Copiando ${totalItems} ${itemText}`;
			case 'file_move':
				return `Moviendo ${totalItems} ${itemText}`;
			case 'file_delete':
				return `Eliminando ${totalItems} ${itemText}`;
			case 'file_download':
				return `Descargando ${totalItems} ${itemText}`;
			case 'file_upload':
				return `Subiendo ${totalItems} ${itemText}`;
			case 'file_compress':
				return `Comprimiendo ${totalItems} ${itemText}`;
			case 'file_extract':
				return `Extrayendo ${totalItems} ${itemText}`;
			case 'image_resize':
				return `Redimensionando ${totalItems} imagen(es)`;
			case 'image_convert':
				return `Convirtiendo ${totalItems} imagen(es)`;
			case 'video_convert':
				return `Convirtiendo ${totalItems} video(s)`;
			case 'audio_convert':
				return `Convirtiendo ${totalItems} audio(s)`;
			case 'thumbnail_generate':
				return `Generando ${totalItems} miniatura(s)`;
			case 'metadata_extract':
				return `Extrayendo metadatos de ${totalItems} ${itemText}`;
			case 'search_index':
				return `Indexando ${totalItems} ${itemText}`;
			case 'backup_create':
				return `Creando respaldo de ${totalItems} ${itemText}`;
			case 'backup_restore':
				return `Restaurando ${totalItems} ${itemText}`;
			case 'sync_files':
				return `Sincronizando ${totalItems} ${itemText}`;
			case 'batch_operation':
				return `Operación en lote: ${totalItems} ${itemText}`;
			default:
				return `Procesando ${totalItems} ${itemText}`;
		}
	}

	/**
	 * Format time remaining
	 */
	private formatTimeRemaining(milliseconds: number): string {
		const seconds = Math.ceil(milliseconds / 1000);

		if (seconds < 60) {
			return `${seconds}s`;
		}
		if (seconds < 3600) {
			const minutes = Math.ceil(seconds / 60);
			return `${minutes}m`;
		}
		const hours = Math.ceil(seconds / 3600);
		return `${hours}h`;
	}
}

// Export singleton instance
export const progressTrackingService = new ProgressTrackingService();
export default progressTrackingService;
