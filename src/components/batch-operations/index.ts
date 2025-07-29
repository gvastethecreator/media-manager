/**
 * Batch Operations Components
 * 
 * Export all batch operations related components and hooks
 */

// Components
export { BatchOperationsPanel } from './BatchOperationsPanel';
export { 
  BatchOperationsIndicator, 
  BatchOperationsStatusIndicator 
} from './BatchOperationsIndicator';
export { BatchOperationDialog } from './BatchOperationDialog';

// Types
export type { BatchOperationDialogType } from './BatchOperationDialog';

// Re-export service and hook for convenience
export { batchFileOperationsService } from '@/services/file/batch-operations.service';
export { useBatchOperations } from '@/hooks/useBatchOperations';
export type {
  BatchOperation,
  BatchOperationType,
  BatchOperationStatus,
  BatchOperationOptions,
  BatchProgress,
  BatchOperationResult,
  BatchOperationError,
} from '@/services/file/batch-operations.service';
export type {
  UseBatchOperationsOptions,
  BatchOperationSummary,
  UseBatchOperationsReturn,
} from '@/hooks/useBatchOperations';