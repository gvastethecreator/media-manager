/**
 * @file Progress Information Types
 * @module types/progress-tracking/progress-info
 * @description Define los tipos base para el sistema de progreso
 */

export type OperationType =
  | 'copy' | 'move' | 'delete' | 'download'
  | 'upload' | 'compress' | 'extract';

export type ProgressStatus =
  | 'pending' | 'running' | 'completed'
  | 'failed' | 'cancelled' | 'paused';

export interface ProgressInfo {
  /** Operation identifier */
  operationId: string;
  /** Operation type */
  type: OperationType;
  /** Current progress (0-100) */
  progress: number;
  /** Total items to process */
  totalItems: number;
  /** Items processed so far */
  processedItems: number;
  /** Current item being processed */
  currentItem?: string;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
  /** Throughput (items per second) */
  throughput?: number;
  /** Operation status */
  status: ProgressStatus;
  /** Start time */
  startTime: number;
  /** Error information if failed */
  error?: string;
  /** Cancellation token */
  isCancelled: boolean;
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
}

export interface ProgressCallback {
  (progress: ProgressInfo): void;
}
