/**
 * Undo/Redo Panel Component
 * 
 * A panel that displays the history of undoable actions with the ability
 * to jump to specific points in history.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Move, 
  Trash2, 
  Edit, 
  Clock, 
  RotateCcw, 
  RotateCw,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import type { UndoableAction } from '@/services/undo-redo/undo-redo-manager';

export interface UndoRedoPanelProps {
  /** Panel className */
  className?: string;
  /** Maximum height of the panel */
  maxHeight?: string;
  /** Show action timestamps */
  showTimestamps?: boolean;
  /** Show action details */
  showDetails?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** On close callback */
  onClose?: () => void;
}

/**
 * Get icon for action type
 */
function getActionIcon(type: string) {
  switch (type) {
    case 'copy':
      return Copy;
    case 'move':
      return Move;
    case 'delete':
      return Trash2;
    case 'rename':
      return Edit;
    default:
      return Clock;
  }
}

/**
 * Get action description
 */
function getActionDescription(action: UndoableAction): string {
  const { type, metadata } = action;
  const itemCount = metadata?.itemCount || 1;
  const itemText = itemCount === 1 ? 'elemento' : 'elementos';
  
  switch (type) {
    case 'copy':
      return `Copiar ${itemCount} ${itemText}`;
    case 'move':
      return `Mover ${itemCount} ${itemText}`;
    case 'delete':
      return `Eliminar ${itemCount} ${itemText}`;
    case 'rename':
      return `Renombrar ${metadata?.oldName || 'elemento'}`;
    default:
      return `Acción ${type}`;
  }
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) { // Less than 1 minute
    return 'Hace un momento';
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `Hace ${minutes} min`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `Hace ${hours} h`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Undo/Redo panel component
 */
export function UndoRedoPanel({
  className,
  maxHeight = '400px',
  showTimestamps = true,
  showDetails = true,
  compact = false,
  onClose,
}: UndoRedoPanelProps) {
  const { state, undo, redo, clear } = useUndoRedo();
  const [isClearing, setIsClearing] = useState(false);
  
  const history = state.history;
  const currentIndex = state.currentIndex;
  
  const handleClear = async () => {
    setIsClearing(true);
    try {
      clear();
    } finally {
      setIsClearing(false);
    }
  };
  
  const handleJumpTo = async (targetIndex: number) => {
    const currentIdx = currentIndex;
    
    if (targetIndex === currentIdx) return;
    
    try {
      if (targetIndex < currentIdx) {
        // Undo to target
        for (let i = currentIdx; i > targetIndex; i--) {
          await undo();
        }
      } else {
        // Redo to target
        for (let i = currentIdx; i < targetIndex; i++) {
          await redo();
        }
      }
    } catch (error) {
      console.error('Failed to jump to history point:', error);
    }
  };
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className={cn('pb-3', compact && 'pb-2')}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn('text-base', compact && 'text-sm')}>
            Historial de Acciones
          </CardTitle>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isClearing}
                className="text-xs"
              >
                Limpiar
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total: {history.length}</span>
            <span>Posición: {currentIndex + 1}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className={cn('pt-0', compact && 'p-3 pt-0')}>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay acciones en el historial</p>
          </div>
        ) : (
          <ScrollArea className="h-full" style={{ maxHeight }}>
            <div className="space-y-1">
              {history.map((action, index) => {
                const Icon = getActionIcon(action.type);
                const isCurrent = index === currentIndex;
                const isExecuted = index <= currentIndex;
                const canJump = index !== currentIndex;
                
                return (
                  <div key={action.id}>
                    <div
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-md transition-all duration-200',
                        'hover:bg-muted/50 cursor-pointer',
                        isCurrent && 'bg-primary/10 border border-primary/20',
                        !isExecuted && 'opacity-50',
                        compact && 'p-1.5 gap-2'
                      )}
                      onClick={() => canJump && handleJumpTo(index)}
                    >
                      <div className={cn(
                        'flex items-center gap-2 flex-1 min-w-0',
                        compact && 'gap-1.5'
                      )}>
                        <Icon className={cn(
                          'h-4 w-4 flex-shrink-0',
                          compact && 'h-3 w-3'
                        )} />
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            compact && 'text-xs'
                          )}>
                            {getActionDescription(action)}
                          </p>
                          
                          {showDetails && action.metadata?.targetPath && (
                            <p className={cn(
                              'text-xs text-muted-foreground truncate',
                              compact && 'text-[10px]'
                            )}>
                              → {action.metadata.targetPath}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showTimestamps && (
                          <span className={cn(
                            'text-xs text-muted-foreground',
                            compact && 'text-[10px]'
                          )}>
                            {formatTimestamp(action.timestamp)}
                          </span>
                        )}
                        
                        {isCurrent && (
                          <Badge variant="secondary" className={cn(
                            'text-xs px-1.5 py-0.5',
                            compact && 'text-[10px] px-1'
                          )}>
                            Actual
                          </Badge>
                        )}
                        
                        {canJump && (
                          <div className="flex items-center">
                            {index < currentIndex ? (
                              <RotateCcw className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <RotateCw className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < history.length - 1 && !compact && (
                      <Separator className="my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}