/**
 * @file SelectionCounter component for displaying selection count
 * @module components/features/file-browser/components/selection-counter
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCounterProps {
  count: number;
  total: number;
  onClear?: () => void;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showClearButton?: boolean;
  showTotal?: boolean;
}

export function SelectionCounter({
  count,
  total,
  onClear,
  className,
  position = 'top-right',
  showClearButton = true,
  showTotal = false,
}: SelectionCounterProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'fixed z-50 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg border',
          'backdrop-blur-sm bg-primary/90',
          positionClasses[position],
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={`${count} elemento${count > 1 ? 's' : ''} seleccionado${count > 1 ? 's' : ''}${showTotal ? ` de ${total}` : ''}`}
      >
        {/* Icono de selección */}
        <div className="flex items-center justify-center w-5 h-5 bg-primary-foreground/20 rounded-full">
          <Check className="w-3 h-3" />
        </div>

        {/* Contador */}
        <span className="text-sm font-semibold">
          {count}
          {showTotal && (
            <span className="text-primary-foreground/70 ml-1">/ {total}</span>
          )}
        </span>

        {/* Texto descriptivo */}
        <span className="text-xs text-primary-foreground/80">
          {count === 1 ? 'elemento' : 'elementos'}
        </span>

        {/* Botón de limpiar selección */}
        {showClearButton && onClear && (
          <button
            onClick={onClear}
            className={cn(
              'flex items-center justify-center w-5 h-5 ml-1',
              'bg-primary-foreground/20 hover:bg-primary-foreground/30',
              'rounded-full transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-foreground/50'
            )}
            aria-label="Limpiar selección"
            title="Limpiar selección (Esc)"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Componente compacto para mostrar solo el número
 */
export function CompactSelectionCounter({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'selection-counter',
        'absolute top-2 right-2 z-10',
        'w-6 h-6 bg-primary text-primary-foreground',
        'rounded-full flex items-center justify-center',
        'text-xs font-bold shadow-md',
        className
      )}
      role="status"
      aria-label={`${count} seleccionado${count > 1 ? 's' : ''}`}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
}

/**
 * Hook para gestionar el estado del contador de selección
 */
export function useSelectionCounter(selectedIds: string[], totalItems: number) {
  const count = selectedIds.length;
  const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
  const isAllSelected = count === totalItems && totalItems > 0;
  const isPartialSelection = count > 0 && count < totalItems;

  return {
    count,
    total: totalItems,
    percentage,
    isAllSelected,
    isPartialSelection,
    hasSelection: count > 0,
  };
}

export default SelectionCounter;