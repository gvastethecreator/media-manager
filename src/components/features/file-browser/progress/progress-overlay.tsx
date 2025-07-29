/**
 * Progress Overlay Component
 * 
 * This component displays progress information for ongoing file operations
 * in a non-intrusive overlay that appears when operations are running.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Pause, 
  Play, 
  Square, 
  ChevronDown, 
  ChevronUp,
  Download,
  Copy,
  Move,
  Trash2,
  Upload,
  Archive,
  FolderOpen
} from 'lucide-react';
import { progressTrackingService } from '@/services/progress/progress-tracking.service';
import type { ProgressOperation, OperationType } from '@/types/file-browser/progress-tracking';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressOverlayProps {
  className?: string;
}

const OPERATION_ICONS: Record<OperationType, React.ComponentType<{ className?: string }>> = {
  file_copy: Copy,
  file_move: Move,
  file_delete: Trash2,
  file_download: Download,
  file_upload: Upload,
  file_compress: Archive,
  file_extract: FolderOpen,
  image_resize: Archive,
  image_convert: Archive,
  video_convert: Archive,
  audio_convert: Archive,
  thumbnail_generate: Archive,
  metadata_extract: Archive,
  search_index: Archive,
  backup_create: Archive,
  backup_restore: Archive,
  sync_files: Archive,
  batch_operation: Archive,
  custom: Archive,
};

const OPERATION_COLORS: Record<OperationType, string> = {
  file_copy: 'text-blue-600',
  file_move: 'text-purple-600',
  file_delete: 'text-red-600',
  file_download: 'text-green-600',
  file_upload: 'text-orange-600',
  file_compress: 'text-yellow-600',
  file_extract: 'text-indigo-600',
  image_resize: 'text-pink-600',
  image_convert: 'text-cyan-600',
  video_convert: 'text-violet-600',
  audio_convert: 'text-emerald-600',
  thumbnail_generate: 'text-amber-600',
  metadata_extract: 'text-lime-600',
  search_index: 'text-teal-600',
  backup_create: 'text-slate-600',
  backup_restore: 'text-rose-600',
  sync_files: 'text-sky-600',
  batch_operation: 'text-stone-600',
  custom: 'text-gray-600',
};

export function ProgressOverlay({ className }: ProgressOverlayProps) {
  const [operations, setOperations] = useState<ProgressOperation[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateOperations = () => {
      const activeOps = progressTrackingService.getActiveOperations();
      setOperations(activeOps);
      setIsVisible(activeOps.length > 0);
    };

    // Initial load
    updateOperations();

    // Listen for progress events
    const handleProgressUpdate = () => updateOperations();
    const handleOperationStart = () => updateOperations();
    const handleOperationComplete = () => {
      // Delay to show completion briefly
      setTimeout(updateOperations, 1000);
    };
    const handleOperationFailed = () => updateOperations();
    const handleOperationCancelled = () => updateOperations();

    progressTrackingService.on('progressUpdated', handleProgressUpdate);
    progressTrackingService.on('operationStarted', handleOperationStart);
    progressTrackingService.on('operationCompleted', handleOperationComplete);
    progressTrackingService.on('operationFailed', handleOperationFailed);
    progressTrackingService.on('operationCancelled', handleOperationCancelled);

    return () => {
      progressTrackingService.off('progressUpdated', handleProgressUpdate);
      progressTrackingService.off('operationStarted', handleOperationStart);
      progressTrackingService.off('operationCompleted', handleOperationComplete);
      progressTrackingService.off('operationFailed', handleOperationFailed);
      progressTrackingService.off('operationCancelled', handleOperationCancelled);
    };
  }, []);

  const handleCancelOperation = (operationId: string) => {
    progressTrackingService.cancelOperation(operationId);
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.ceil(seconds / 3600);
      return `${hours}h`;
    }
  };

  const formatThroughput = (throughput: number): string => {
    if (throughput < 1) {
      return `${(throughput * 60).toFixed(1)} elementos/min`;
    } else {
      return `${throughput.toFixed(1)} elementos/s`;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-80 max-w-md',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Operaciones en progreso ({operations.length})
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Operations List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-80 overflow-y-auto">
                {operations.map((operation) => {
                  const Icon = OPERATION_ICONS[operation.type];
                  const colorClass = OPERATION_COLORS[operation.type];

                  return (
                    <div
                      key={operation.id}
                      className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      {/* Operation Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', colorClass)} />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {operation.type.charAt(0).toUpperCase() + operation.type.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelOperation(operation.id)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                            title="Cancelar operación"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <Progress 
                          value={operation.progress.percentage} 
                          className="h-2"
                        />
                      </div>

                      {/* Progress Details */}
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          {operation.items.processed} / {operation.items.total} elementos
                        </span>
                        <span>{Math.round(operation.progress.percentage)}%</span>
                      </div>

                      {/* Current Step */}
                      {operation.currentStep && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 truncate">
                          {operation.currentStep}
                        </div>
                      )}

                      {/* Time and Speed */}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {operation.progress.eta && (
                          <span>
                            {formatTimeRemaining(operation.progress.eta - Date.now())} restante
                          </span>
                        )}
                        {operation.progress.speed && (
                          <span>
                            {formatThroughput(operation.progress.speed)}
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      {operation.status !== 'running' && (
                        <div className="mt-2">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            {
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': operation.status === 'pending',
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': operation.status === 'completed',
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': operation.status === 'failed',
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': operation.status === 'cancelled',
                              'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': operation.status === 'paused',
                            }
                          )}>
                            {operation.status === 'pending' && 'Pendiente'}
                            {operation.status === 'completed' && 'Completado'}
                            {operation.status === 'failed' && 'Error'}
                            {operation.status === 'cancelled' && 'Cancelado'}
                            {operation.status === 'paused' && 'Pausado'}
                          </span>
                        </div>
                      )}

                      {/* Error Message */}
                      {operation.error && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          {operation.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProgressOverlay;