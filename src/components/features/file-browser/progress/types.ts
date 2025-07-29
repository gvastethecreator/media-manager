import type { ProgressOperation } from '@/types/file-browser/progress-tracking';

export interface ProgressOperationCardProps {
  operation: ProgressOperation;
  compact?: boolean;
  onStart?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export interface OperationStatistics {
  totalOperations: number;
  activeOperations: number;
  completedOperations: number;
  failedOperations: number;
  successRate: number;
}

export interface ProgressOperationGroup {
  [key: string]: ProgressOperation[];
}
