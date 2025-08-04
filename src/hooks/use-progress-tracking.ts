/**
 * Progress Tracking Hook
 *
 * Custom hook for managing file operation progress tracking.
 * Provides utilities for starting operations, monitoring progress,
 * and handling operation lifecycle events.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { OperationType, ProgressInfo, ProgressOperation } from '@/types/file-browser/progress-tracking';

export interface UseProgressTrackingOptions {
	/** Whether to automatically track all operations */
	trackAll?: boolean;
	/** Specific operation types to track */
	operationTypes?: OperationType[];
	/** Callback when any operation starts */
	onOperationStart?: (operation: ProgressOperation) => void;
	/** Callback when any operation completes */
	onOperationComplete?: (operation: ProgressOperation) => void;
	/** Callback when any operation fails */
	onOperationFailed?: (operation: ProgressOperation, error: string) => void;
	/** Callback when any operation is cancelled */
	onOperationCancelled?: (operation: ProgressOperation) => void;
}

export interface UseProgressTrackingReturn {
	/** All active operations */
	operations: ProgressOperation[];
	/** Whether any operations are running */
	hasActiveOperations: boolean;
	/** Start a new operation */
	startOperation: (type: OperationType, options: Partial<ProgressOperation>) => string;
	/** Update operation progress */
	updateProgress: (operationId: string, progress: ProgressInfo, stepId?: string) => void;
	/** Complete an operation */
	completeOperation: (operationId: string) => void;
	/** Fail an operation */
	failOperation: (operationId: string, error: string) => void;
	/** Cancel an operation */
	cancelOperation: (operationId: string) => void;
	/** Get specific operation by ID */
	getOperation: (operationId: string) => ProgressOperation | undefined;
	/** Clear completed operations */
	clearCompleted: () => void;
}

// Internal service simulation
class ProgressTrackingServiceImpl {
	private operations = new Map<string, ProgressOperation>();
	private eventListeners = new Map<string, ((operation: ProgressOperation) => void)[]>();

	generateId(): string {
		return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	startOperation(type: OperationType, options: Partial<ProgressOperation>): string {
		const id = this.generateId();
		const now = Date.now();

		const operation: ProgressOperation = {
			id,
			type,
			name: options.name || `${type} operation`,
			description: options.description,
			status: 'pending',
			progress: {
				current: 0,
				total: options.items?.total || 100,
				percentage: 0,
				speed: 0,
				eta: null,
				startTime: now,
				endTime: null,
				duration: 0,
			},
			items: {
				processed: 0,
				total: options.items?.total || 0,
				failed: 0,
				skipped: 0,
				remaining: options.items?.total || 0,
			},
			size: {
				processed: 0,
				total: 0,
				remaining: 0,
			},
			steps: [],
			currentStep: null,
			priority: options.priority || 1,
			metadata: options.metadata || {},
			error: null,
			retryCount: 0,
			createdAt: now,
			updatedAt: now,
			startTime: now,
			...options,
		};

		this.operations.set(id, operation);
		this.emit('operationStarted', operation);
		return id;
	}

	updateProgress(operationId: string, progress: ProgressInfo, stepId?: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) return;

		const updatedOperation: ProgressOperation = {
			...operation,
			progress,
			updatedAt: Date.now(),
			status: progress.percentage >= 100 ? 'completed' : 'running',
		};

		this.operations.set(operationId, updatedOperation);
		this.emit('progressUpdated', updatedOperation);
	}

	completeOperation(operationId: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) return;

		const updatedOperation: ProgressOperation = {
			...operation,
			status: 'completed',
			progress: {
				...operation.progress,
				percentage: 100,
				endTime: Date.now(),
			},
			updatedAt: Date.now(),
		};

		this.operations.set(operationId, updatedOperation);
		this.emit('operationCompleted', updatedOperation);
	}

	failOperation(operationId: string, error: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) return;

		const updatedOperation: ProgressOperation = {
			...operation,
			status: 'failed',
			error,
			updatedAt: Date.now(),
		};

		this.operations.set(operationId, updatedOperation);
		this.emit('operationFailed', updatedOperation);
	}

	cancelOperation(operationId: string): void {
		const operation = this.operations.get(operationId);
		if (!operation) return;

		const updatedOperation: ProgressOperation = {
			...operation,
			status: 'cancelled',
			updatedAt: Date.now(),
		};

		this.operations.set(operationId, updatedOperation);
		this.emit('operationCancelled', updatedOperation);
	}

	getOperation(operationId: string): ProgressOperation | undefined {
		return this.operations.get(operationId);
	}

	getActiveOperations(): ProgressOperation[] {
		return Array.from(this.operations.values()).filter((op) => op.status === 'running' || op.status === 'pending');
	}

	clearCompleted(): void {
		for (const [id, operation] of this.operations.entries()) {
			if (operation.status === 'completed' || operation.status === 'failed' || operation.status === 'cancelled') {
				this.operations.delete(id);
			}
		}
	}

	on(event: string, listener: (operation: ProgressOperation) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(listener);
	}

	off(event: string, listener: (operation: ProgressOperation) => void): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(listener);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	private emit(event: string, operation: ProgressOperation): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => listener(operation));
		}
	}
}

const progressService = new ProgressTrackingServiceImpl();

/**
 * Hook for tracking file operation progress
 */
export function useProgressTracking(options: UseProgressTrackingOptions = {}): UseProgressTrackingReturn {
	const [operations, setOperations] = useState<ProgressOperation[]>([]);
	const optionsRef = useRef(options);

	// Update options ref when options change
	useEffect(() => {
		optionsRef.current = options;
	}, [options]);

	// Update operations state
	const updateOperations = useCallback(() => {
		const activeOps = progressService.getActiveOperations();

		// Filter by operation types if specified
		const filteredOps = options.operationTypes
			? activeOps.filter((op) => options.operationTypes!.includes(op.type))
			: activeOps;

		setOperations(filteredOps);
	}, [options.operationTypes]);

	// Set up event listeners
	useEffect(() => {
		if (!options.trackAll && !options.operationTypes) {
			return;
		}

		const handleOperationStart = (operation: ProgressOperation) => {
			updateOperations();
			optionsRef.current.onOperationStart?.(operation);
		};

		const handleProgressUpdate = (operation: ProgressOperation) => {
			updateOperations();
		};

		const handleOperationComplete = (operation: ProgressOperation) => {
			updateOperations();
			optionsRef.current.onOperationComplete?.(operation);
		};

		const handleOperationFailed = (operation: ProgressOperation) => {
			updateOperations();
			optionsRef.current.onOperationFailed?.(operation, operation.error || 'Unknown error');
		};

		const handleOperationCancelled = (operation: ProgressOperation) => {
			updateOperations();
			optionsRef.current.onOperationCancelled?.(operation);
		};

		// Initial load
		updateOperations();

		// Subscribe to events
		progressService.on('operationStarted', handleOperationStart);
		progressService.on('progressUpdated', handleProgressUpdate);
		progressService.on('operationCompleted', handleOperationComplete);
		progressService.on('operationFailed', handleOperationFailed);
		progressService.on('operationCancelled', handleOperationCancelled);

		return () => {
			progressService.off('operationStarted', handleOperationStart);
			progressService.off('progressUpdated', handleProgressUpdate);
			progressService.off('operationCompleted', handleOperationComplete);
			progressService.off('operationFailed', handleOperationFailed);
			progressService.off('operationCancelled', handleOperationCancelled);
		};
	}, [options.trackAll, options.operationTypes, updateOperations]);

	// Operation management functions
	const startOperation = useCallback((type: OperationType, progressOptions: Partial<ProgressOperation>): string => {
		return progressService.startOperation(type, progressOptions);
	}, []);

	const updateProgress = useCallback((operationId: string, progress: ProgressInfo, stepId?: string) => {
		progressService.updateProgress(operationId, progress, stepId);
	}, []);

	const completeOperation = useCallback((operationId: string) => {
		progressService.completeOperation(operationId);
	}, []);

	const failOperation = useCallback((operationId: string, error: string) => {
		progressService.failOperation(operationId, error);
	}, []);

	const cancelOperation = useCallback((operationId: string) => {
		progressService.cancelOperation(operationId);
	}, []);

	const getOperation = useCallback((operationId: string): ProgressOperation | undefined => {
		return progressService.getOperation(operationId);
	}, []);

	const clearCompleted = useCallback(() => {
		progressService.clearCompleted();
		updateOperations();
	}, [updateOperations]);

	const hasActiveOperations = operations.length > 0;

	return {
		operations,
		hasActiveOperations,
		startOperation,
		updateProgress,
		completeOperation,
		failOperation,
		cancelOperation,
		getOperation,
		clearCompleted,
	};
}

/**
 * Hook for tracking a specific operation
 */
export function useOperationProgress(operationId: string | null) {
	const [operation, setOperation] = useState<ProgressOperation | null>(null);

	useEffect(() => {
		if (!operationId) {
			setOperation(null);
			return;
		}

		const updateOperation = () => {
			const op = progressService.getOperation(operationId);
			setOperation(op || null);
		};

		// Initial load
		updateOperation();

		// Listen for updates
		const handleProgressUpdate = () => updateOperation();
		const handleOperationComplete = () => updateOperation();
		const handleOperationFailed = () => updateOperation();
		const handleOperationCancelled = () => updateOperation();

		progressService.on('progressUpdated', handleProgressUpdate);
		progressService.on('operationCompleted', handleOperationComplete);
		progressService.on('operationFailed', handleOperationFailed);
		progressService.on('operationCancelled', handleOperationCancelled);

		return () => {
			progressService.off('progressUpdated', handleProgressUpdate);
			progressService.off('operationCompleted', handleOperationComplete);
			progressService.off('operationFailed', handleOperationFailed);
			progressService.off('operationCancelled', handleOperationCancelled);
		};
	}, [operationId]);

	return operation;
}

/**
 * Hook for batch operations with progress tracking
 */
export function useBatchOperation() {
	const [batchOperations, setBatchOperations] = useState<Map<string, ProgressOperation>>(new Map());

	const startBatchOperation = useCallback(
		(type: OperationType, items: string[], options?: Partial<ProgressOperation>) => {
			const operationId = progressService.startOperation(type, {
				items: {
					processed: 0,
					total: items.length,
					failed: 0,
					skipped: 0,
					remaining: items.length,
				},
				...options,
			});

			setBatchOperations((prev) => {
				const newMap = new Map(prev);
				const operation = progressService.getOperation(operationId);
				if (operation) {
					newMap.set(operationId, operation);
				}
				return newMap;
			});

			return operationId;
		},
		[]
	);

	const updateBatchProgress = useCallback((operationId: string, processedCount: number, currentItem?: string) => {
		const operation = progressService.getOperation(operationId);
		if (operation) {
			const progress: ProgressInfo = {
				...operation.progress,
				current: processedCount,
				percentage: (processedCount / operation.items.total) * 100,
			};

			progressService.updateProgress(operationId, progress);

			setBatchOperations((prev) => {
				const newMap = new Map(prev);
				const updatedOperation = progressService.getOperation(operationId);
				if (updatedOperation) {
					newMap.set(operationId, updatedOperation);
				}
				return newMap;
			});
		}
	}, []);

	const completeBatchOperation = useCallback((operationId: string) => {
		progressService.completeOperation(operationId);
		setBatchOperations((prev) => {
			const newMap = new Map(prev);
			newMap.delete(operationId);
			return newMap;
		});
	}, []);

	const failBatchOperation = useCallback((operationId: string, error: string) => {
		progressService.failOperation(operationId, error);
		setBatchOperations((prev) => {
			const newMap = new Map(prev);
			newMap.delete(operationId);
			return newMap;
		});
	}, []);

	return {
		batchOperations: Array.from(batchOperations.values()),
		startBatchOperation,
		updateBatchProgress,
		completeBatchOperation,
		failBatchOperation,
	};
}

export default useProgressTracking;
