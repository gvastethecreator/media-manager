/**
 * Progress Indicator Component
 * 
 * A compact progress indicator for displaying in toolbars or status bars.
 * Shows a summary of active operations with minimal visual footprint.
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Copy,
  Move,
  Trash2,
  Upload,
  Archive,
  FolderOpen
} from 'lucide-react';
import { useProgressTracking } from '@/hooks/use-progress-tracking';
import type { OperationType } from '@/services/progress/progress-tracking.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProgressIndicatorProps {
  className?: string;
  /** Whether to show operation details in tooltip */
  showDetails?: boolean;
  /** Maximum number of operations to show in tooltip */
  maxOperationsShown?: number;
  /** Callback when indicator is clicked */
  onClick?: () => void;
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

const OPERATION_LABELS: Record<OperationType, string> = {
  file_copy: 'Copiando',
  file_move: 'Moviendo',
  file_delete: 'Eliminando',
  file_download: 'Descargando',
  file_upload: 'Subiendo',
  file_compress: 'Comprimiendo',
  file_extract: 'Extrayendo',
  image_resize: 'Redimensionando',
  image_convert: 'Convirtiendo imagen',
  video_convert: 'Convirtiendo video',
  audio_convert: 'Convirtiendo audio',
  thumbnail_generate: 'Generando miniaturas',
  metadata_extract: 'Extrayendo metadatos',
  search_index: 'Indexando',
  backup_create: 'Creando respaldo',
  backup_restore: 'Restaurando respaldo',
  sync_files: 'Sincronizando',
  batch_operation: 'Operación por lotes',
  custom: 'Operación personalizada',
};

export function ProgressIndicator({ 
  className, 
  showDetails = true,
  maxOperationsShown = 3,
  onClick 
}: ProgressIndicatorProps) {
  const { operations, hasActiveOperations } = useProgressTracking({ trackAll: true });

  if (!hasActiveOperations) {
    return null;
  }

  const runningOperations = operations.filter(op => op.status === 'running');
  const completedOperations = operations.filter(op => op.status === 'completed');
  const failedOperations = operations.filter(op => op.status === 'failed');
  const totalProgress = operations.length > 0 
    ? operations.reduce((sum, op) => sum + op.progress.percentage, 0) / operations.length 
    : 0;

  const getStatusIcon = () => {
    if (failedOperations.length > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (runningOperations.length > 0) {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (completedOperations.length > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (failedOperations.length > 0) {
      return `${failedOperations.length} error${failedOperations.length > 1 ? 'es' : ''}`;
    }
    if (runningOperations.length > 0) {
      return `${runningOperations.length} operación${runningOperations.length > 1 ? 'es' : ''}`;
    }
    if (completedOperations.length > 0) {
      return 'Completado';
    }
    return 'Procesando';
  };

  const renderTooltipContent = () => {
    if (!showDetails) {
      return getStatusText();
    }

    const operationsToShow = operations.slice(0, maxOperationsShown);
    const remainingCount = Math.max(0, operations.length - maxOperationsShown);

    return (
      <div className="space-y-2 max-w-xs">
        <div className="font-medium text-sm">
          Operaciones activas ({operations.length})
        </div>
        
        {operationsToShow.map((operation) => {
          const Icon = OPERATION_ICONS[operation.type];
          const label = OPERATION_LABELS[operation.type];
          
          return (
            <div key={operation.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="h-3 w-3" />
                <span className="text-xs">{label}</span>
                <span className="text-xs text-gray-400">
                  {Math.round(operation.progress.percentage)}%
                </span>
              </div>
              
              {/* Mini progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <motion.div
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    {
                      'bg-blue-500': operation.status === 'running',
                      'bg-green-500': operation.status === 'completed',
                      'bg-red-500': operation.status === 'failed',
                      'bg-yellow-500': operation.status === 'paused',
                      'bg-gray-400': operation.status === 'cancelled',
                    }
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${operation.progress}%` }}
                />
              </div>
              
              {operation.currentStep && (
                <div className="text-xs text-gray-500 truncate">
                  {operation.currentStep}
                </div>
              )}
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {operation.items.processed} / {operation.items.total}
                </span>
                {operation.progress.eta && (
                  <span>
                    {Math.ceil((operation.progress.eta - Date.now()) / 1000)}s restante
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {remainingCount > 0 && (
          <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
            +{remainingCount} operación{remainingCount > 1 ? 'es' : ''} más
          </div>
        )}
        
        <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
          Progreso total: {Math.round(totalProgress)}%
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
              'flex items-center gap-2 h-8 px-2 text-xs',
              className
            )}
          >
            {getStatusIcon()}
            
            {/* Progress ring */}
            <div className="relative">
              <svg className="h-4 w-4 transform -rotate-90" viewBox="0 0 16 16">
                {/* Background circle */}
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-300 dark:text-gray-600"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="8"
                  cy="8"
                  r="6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  className={cn({
                    'text-blue-500': runningOperations.length > 0,
                    'text-green-500': runningOperations.length === 0 && completedOperations.length > 0,
                    'text-red-500': failedOperations.length > 0,
                  })}
                  initial={{ strokeDasharray: '0 37.7' }}
                  animate={{ 
                    strokeDasharray: `${(totalProgress / 100) * 37.7} 37.7` 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </svg>
            </div>
            
            <span className="hidden sm:inline">
              {getStatusText()}
            </span>
          </Button>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-none">
          {renderTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ProgressIndicator;