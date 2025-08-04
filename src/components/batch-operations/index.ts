/**
 * Batch Operations Components
 *
 * Export all batch operations related components and hooks
 */

export type {
	BatchOperationSummary,
	UseBatchOperationsOptions,
	UseBatchOperationsReturn,
} from '@/hooks/useBatchOperations';
export { useBatchOperations } from '@/hooks/useBatchOperations';
export type {
	BatchOperation,
	BatchOperationError,
	BatchOperationOptions,
	BatchOperationResult,
	BatchOperationStatus,
	BatchOperationType,
	BatchProgress,
} from '@/services/file/batch-operations.service';
// Re-export service and hook for convenience
export { batchFileOperationsService } from '@/services/file/batch-operations.service';
// Types
export type { BatchOperationDialogType } from './BatchOperationDialog';
export { BatchOperationDialog } from './BatchOperationDialog';
export {
	BatchOperationsIndicator,
	BatchOperationsStatusIndicator,
} from './BatchOperationsIndicator';
// Components
export { BatchOperationsPanel } from './BatchOperationsPanel';
