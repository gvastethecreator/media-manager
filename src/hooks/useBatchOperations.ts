/**
 * Custom hook for managing batch file operations
 * 
 * Provides a React-friendly interface for batch operations with
 * automatic state management and event handling.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  batchFileOperationsService,
  type BatchOperation,
  type BatchOperationOptions,
  type BatchOperationType,
  type BatchOperationStatus,
} from '@/services/file/batch-operations.service';
import type { AnyEntityWithStats } from '@/types/entities';
import { toastService } from '@/services/toast/toast.service';

export interface UseBatchOperationsOptions {
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Filter operations by status */
  statusFilter?: BatchOperationStatus[];
  /** Filter operations by type */
  typeFilter?: BatchOperationType[];
  /** Maximum number of operations to track */
  maxOperations?: number;
  /** Auto-cleanup completed operations */
  autoCleanup?: boolean;
}

export interface BatchOperationSummary {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  paused: number;
}

export interface UseBatchOperationsReturn {
  /** All operations */
  operations: BatchOperation[];
  /** Active operations (queued, running, paused) */
  activeOperations: BatchOperation[];
  /** Completed operations (completed, failed, cancelled) */
  completedOperations: BatchOperation[];
  /** Operation summary statistics */
  summary: BatchOperationSummary;
  /** Whether any operations are currently running */
  isProcessing: boolean;
  /** Queue a copy operation */
  queueCopyOperation: (items: AnyEntityWithStats[], targetPath: string, options?: BatchOperationOptions) => Promise<string>;
  /** Queue a move operation */
  queueMoveOperation: (items: AnyEntityWithStats[], targetPath: string, options?: BatchOperationOptions) => Promise<string>;
  /** Queue a delete operation */
  queueDeleteOperation: (items: AnyEntityWithStats[], options?: BatchOperationOptions) => Promise<string>;
  /** Get specific operation */
  getOperation: (operationId: string) => BatchOperation | undefined;
  /** Cancel operation */
  cancelOperation: (operationId: string) => boolean;
  /** Pause operation */
  pauseOperation: (operationId: string) => boolean;
  /** Resume operation */
  resumeOperation: (operationId: string) => boolean;
  /** Clear completed operations */
  clearCompleted: () => void;
  /** Refresh operations list */
  refresh: () => void;
}

/**
 * Custom hook for managing batch file operations
 */
export function useBatchOperations(options: UseBatchOperationsOptions = {}): UseBatchOperationsReturn {
  const {
    refreshInterval = 1000,
    statusFilter,
    typeFilter,
    maxOperations = 100,
    autoCleanup = true,
  } = options;

  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Refresh operations from service
  const refresh = useCallback(() => {
    let allOperations = batchFileOperationsService.getAllOperations();

    // Apply filters
    if (statusFilter && statusFilter.length > 0) {
      allOperations = allOperations.filter(op => statusFilter.includes(op.status));
    }

    if (typeFilter && typeFilter.length > 0) {
      allOperations = allOperations.filter(op => typeFilter.includes(op.type));
    }

    // Limit operations
    if (maxOperations > 0) {
      allOperations = allOperations
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, maxOperations);
    }

    setOperations(allOperations);
    setLastUpdate(Date.now());
  }, [statusFilter, typeFilter, maxOperations]);

  // Auto-cleanup completed operations
  useEffect(() => {
    if (!autoCleanup) return;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const cleanupThreshold = 5 * 60 * 1000; // 5 minutes

      const operationsToCleanup = operations.filter(op => {
        const isCompleted = ['completed', 'failed', 'cancelled'].includes(op.status);
        const isOld = op.completedAt && (now - op.completedAt) > cleanupThreshold;
        return isCompleted && isOld;
      });

      if (operationsToCleanup.length > 0) {
        batchFileOperationsService.clearCompletedOperations();
        refresh();
      }
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, [operations, autoCleanup, refresh]);

  // Set up event listeners
  useEffect(() => {
    const handleOperationUpdate = () => {
      refresh();
    };

    // Listen to all operation events
    const events = [
      'operationStarted',
      'operationProgress',
      'operationCompleted',
      'operationFailed',
      'operationCancelled',
      'operationPaused',
      'operationResumed',
    ];

    events.forEach(event => {
      batchFileOperationsService.on(event, handleOperationUpdate);
    });

    // Initial load
    refresh();

    return () => {
      events.forEach(event => {
        batchFileOperationsService.removeListener(event, handleOperationUpdate);
      });
    };
  }, [refresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  // Queue operations with error handling
  const queueCopyOperation = useCallback(async (
    items: AnyEntityWithStats[],
    targetPath: string,
    options: BatchOperationOptions = {}
  ): Promise<string> => {
    try {
      const operationId = await batchFileOperationsService.queueCopyOperation(
        items,
        targetPath,
        {
          showProgress: true,
          continueOnError: true,
          autoCleanup: autoCleanup,
          ...options,
        }
      );
      
      toastService.info(
        `Operación de copia iniciada: ${items.length} elemento${items.length !== 1 ? 's' : ''}`
      );
      
      return operationId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toastService.error(`Error al iniciar operación de copia: ${message}`);
      throw error;
    }
  }, [autoCleanup]);

  const queueMoveOperation = useCallback(async (
    items: AnyEntityWithStats[],
    targetPath: string,
    options: BatchOperationOptions = {}
  ): Promise<string> => {
    try {
      const operationId = await batchFileOperationsService.queueMoveOperation(
        items,
        targetPath,
        {
          showProgress: true,
          continueOnError: true,
          autoCleanup: autoCleanup,
          ...options,
        }
      );
      
      toastService.info(
        `Operación de movimiento iniciada: ${items.length} elemento${items.length !== 1 ? 's' : ''}`
      );
      
      return operationId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toastService.error(`Error al iniciar operación de movimiento: ${message}`);
      throw error;
    }
  }, [autoCleanup]);

  const queueDeleteOperation = useCallback(async (
    items: AnyEntityWithStats[],
    options: BatchOperationOptions = {}
  ): Promise<string> => {
    try {
      const operationId = await batchFileOperationsService.queueDeleteOperation(
        items,
        {
          showProgress: true,
          continueOnError: false, // More conservative for delete operations
          autoCleanup: autoCleanup,
          ...options,
        }
      );
      
      toastService.info(
        `Operación de eliminación iniciada: ${items.length} elemento${items.length !== 1 ? 's' : ''}`
      );
      
      return operationId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toastService.error(`Error al iniciar operación de eliminación: ${message}`);
      throw error;
    }
  }, [autoCleanup]);

  // Operation management functions
  const getOperation = useCallback((operationId: string): BatchOperation | undefined => {
    return batchFileOperationsService.getOperation(operationId);
  }, []);

  const cancelOperation = useCallback((operationId: string): boolean => {
    const success = batchFileOperationsService.cancelOperation(operationId);
    if (success) {
      toastService.info('Operación cancelada');
      refresh();
    }
    return success;
  }, [refresh]);

  const pauseOperation = useCallback((operationId: string): boolean => {
    const success = batchFileOperationsService.pauseOperation(operationId);
    if (success) {
      toastService.info('Operación pausada');
      refresh();
    }
    return success;
  }, [refresh]);

  const resumeOperation = useCallback((operationId: string): boolean => {
    const success = batchFileOperationsService.resumeOperation(operationId);
    if (success) {
      toastService.info('Operación reanudada');
      refresh();
    }
    return success;
  }, [refresh]);

  const clearCompleted = useCallback(() => {
    batchFileOperationsService.clearCompletedOperations();
    toastService.info('Operaciones completadas eliminadas');
    refresh();
  }, [refresh]);

  // Computed values
  const activeOperations = operations.filter(op => 
    ['queued', 'running', 'paused'].includes(op.status)
  );

  const completedOperations = operations.filter(op => 
    ['completed', 'failed', 'cancelled'].includes(op.status)
  );

  const summary: BatchOperationSummary = {
    total: operations.length,
    queued: operations.filter(op => op.status === 'queued').length,
    running: operations.filter(op => op.status === 'running').length,
    completed: operations.filter(op => op.status === 'completed').length,
    failed: operations.filter(op => op.status === 'failed').length,
    cancelled: operations.filter(op => op.status === 'cancelled').length,
    paused: operations.filter(op => op.status === 'paused').length,
  };

  const isProcessing = summary.running > 0;

  return {
    operations,
    activeOperations,
    completedOperations,
    summary,
    isProcessing,
    queueCopyOperation,
    queueMoveOperation,
    queueDeleteOperation,
    getOperation,
    cancelOperation,
    pauseOperation,
    resumeOperation,
    clearCompleted,
    refresh,
  };
}

export default useBatchOperations;