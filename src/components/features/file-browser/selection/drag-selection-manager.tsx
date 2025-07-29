/**
 * Drag Selection Manager Component
 * 
 * Manages drag-to-select functionality for the file browser.
 * Handles mouse events, calculates selection rectangle, and integrates with selection store.
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useSelectionStore } from '@/stores/selection-store';
import { SelectionOverlay } from './selection-overlay';
import type { AnyEntityWithStats } from '@/types/entities';

interface DragSelectionManagerProps {
  children: React.ReactNode;
  items: AnyEntityWithStats[];
  containerRef: React.RefObject<HTMLElement>;
  getItemBounds: (itemId: string) => DOMRect | null;
  disabled?: boolean;
  className?: string;
}

interface SelectionRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const DragSelectionManager: React.FC<DragSelectionManagerProps> = ({
  children,
  items,
  containerRef,
  getItemBounds,
  disabled = false,
  className = ''
}) => {
  const {
    selectedItems,
    addToSelection,
    removeFromSelection,
    setSelection,
    clearSelection
  } = useSelectionStore();

  const [isDragging, setIsDragging] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [dragStartItems, setDragStartItems] = useState<Set<string>>(new Set());
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef(false);

  /**
   * Calculate normalized selection rectangle
   */
  const getNormalizedRect = useCallback((rect: SelectionRect) => {
    return {
      left: Math.min(rect.startX, rect.currentX),
      top: Math.min(rect.startY, rect.currentY),
      right: Math.max(rect.startX, rect.currentX),
      bottom: Math.max(rect.startY, rect.currentY)
    };
  }, []);

  /**
   * Check if an item intersects with the selection rectangle
   */
  const isItemInSelection = useCallback((itemId: string, rect: SelectionRect) => {
    const itemBounds = getItemBounds(itemId);
    if (!itemBounds || !containerRef.current) return false;

    const containerBounds = containerRef.current.getBoundingClientRect();
    const normalizedRect = getNormalizedRect(rect);

    // Convert item bounds to container-relative coordinates
    const itemRect = {
      left: itemBounds.left - containerBounds.left,
      top: itemBounds.top - containerBounds.top,
      right: itemBounds.right - containerBounds.left,
      bottom: itemBounds.bottom - containerBounds.top
    };

    // Check intersection
    return (
      itemRect.left < normalizedRect.right &&
      itemRect.right > normalizedRect.left &&
      itemRect.top < normalizedRect.bottom &&
      itemRect.bottom > normalizedRect.top
    );
  }, [getItemBounds, containerRef, getNormalizedRect]);

  /**
   * Update selection based on current drag rectangle
   */
  const updateSelection = useCallback((rect: SelectionRect, modifierKeys: {
    ctrlKey: boolean;
    shiftKey: boolean;
  }) => {
    const intersectingItems = items.filter(item => 
      isItemInSelection(item.id, rect)
    );

    if (modifierKeys.ctrlKey) {
      // Ctrl+drag: toggle selection of intersecting items
      intersectingItems.forEach(item => {
        if (dragStartItems.has(item.id)) {
          // Item was selected at drag start, remove it
          removeFromSelection(item.id);
        } else {
          // Item was not selected at drag start, add it
          addToSelection(item);
        }
      });
    } else if (modifierKeys.shiftKey) {
      // Shift+drag: add to existing selection
      intersectingItems.forEach(item => {
        addToSelection(item);
      });
    } else {
      // Normal drag: replace selection
      setSelection(intersectingItems);
    }
  }, [items, isItemInSelection, dragStartItems, addToSelection, removeFromSelection, setSelection]);

  /**
   * Handle mouse down event
   */
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || event.button !== 0) return; // Only left mouse button

    // Don't start selection if clicking on an interactive element
    const target = event.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('[role="button"]') ||
      target.closest('.file-item-actions')
    ) {
      return;
    }

    const containerBounds = containerRef.current?.getBoundingClientRect();
    if (!containerBounds) return;

    const startX = event.clientX - containerBounds.left;
    const startY = event.clientY - containerBounds.top;

    dragStartRef.current = { x: startX, y: startY };
    isMouseDownRef.current = true;

    // Store current selection state
    setDragStartItems(new Set(selectedItems.map(item => item.id)));

    // Clear selection if not using modifiers (unless clicking on selected item)
    if (!event.ctrlKey && !event.shiftKey) {
      const clickedItem = items.find(item => {
        const bounds = getItemBounds(item.id);
        if (!bounds) return false;
        
        return (
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom
        );
      });

      if (!clickedItem || !selectedItems.some(selected => selected.id === clickedItem.id)) {
        clearSelection();
      }
    }

    event.preventDefault();
  }, [disabled, containerRef, selectedItems, items, getItemBounds, clearSelection]);

  /**
   * Handle mouse move event
   */
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isMouseDownRef.current || !dragStartRef.current || !containerRef.current) return;

    const containerBounds = containerRef.current.getBoundingClientRect();
    const currentX = event.clientX - containerBounds.left;
    const currentY = event.clientY - containerBounds.top;

    // Start dragging if moved enough distance
    const deltaX = Math.abs(currentX - dragStartRef.current.x);
    const deltaY = Math.abs(currentY - dragStartRef.current.y);
    const threshold = 5; // pixels

    if (!isDragging && (deltaX > threshold || deltaY > threshold)) {
      setIsDragging(true);
    }

    if (isDragging || (deltaX > threshold || deltaY > threshold)) {
      const rect: SelectionRect = {
        startX: dragStartRef.current.x,
        startY: dragStartRef.current.y,
        currentX,
        currentY
      };

      setSelectionRect(rect);
      updateSelection(rect, {
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey
      });
    }
  }, [isDragging, containerRef, updateSelection]);

  /**
   * Handle mouse up event
   */
  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    setIsDragging(false);
    setSelectionRect(null);
    dragStartRef.current = null;
    setDragStartItems(new Set());
  }, []);

  /**
   * Handle escape key to cancel selection
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isDragging) {
      handleMouseUp();
      event.preventDefault();
    }
  }, [isDragging, handleMouseUp]);

  // Set up global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleKeyDown]);

  return (
    <div
      className={`relative ${className}`}
      onMouseDown={handleMouseDown}
      style={{ userSelect: 'none' }}
    >
      {children}
      
      {isDragging && selectionRect && (
        <SelectionOverlay
          rect={selectionRect}
          containerRef={containerRef}
        />
      )}
    </div>
  );
};

export default DragSelectionManager;