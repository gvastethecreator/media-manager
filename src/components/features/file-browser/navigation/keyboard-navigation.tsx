import React, { useEffect, useRef, useCallback } from 'react';
import { useSelectionStore } from '@/store/selection.store';
import { AnyEntityWithStats } from '../../../../types/entities';
import { keyboardShortcutManager } from '../../../../lib/keyboard/keyboard-shortcut-manager';
import { toast } from 'sonner';

interface KeyboardNavigationProps {
  items: AnyEntityWithStats[];
  containerRef: React.RefObject<HTMLElement>;
  getItemElement: (itemId: string) => HTMLElement | null;
  onOpenItem?: (item: AnyEntityWithStats) => void;
  onPreviewItem?: (item: AnyEntityWithStats) => void;
  gridColumns?: number;
  viewType: 'list' | 'grid' | 'cards' | 'masonry';
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  items,
  containerRef,
  getItemElement,
  onOpenItem,
  onPreviewItem,
  gridColumns = 4,
  viewType
}) => {
  const {
    selectedItems,
    selectedIds,
    focusedId,
    isItemSelected,
    toggleSelection,
    selectItem,
    clearSelection,
    isMultiSelectMode,
    setMultiSelectMode,
    setFocusedId,
    addToSelection,
    removeFromSelection,
    setSelection,
    selectRange
  } = useSelectionStore();
  
  const lastSelectedIndexRef = useRef<number>(-1);
  const isNavigatingRef = useRef(false);

  // Calcular el índice del elemento enfocado basado en focusedId
  const focusedIndex = React.useMemo(() => {
    if (!focusedId) return -1;
    return items.findIndex(item => item.id === focusedId);
  }, [focusedId, items]);

  // Obtener el índice de un elemento
  const getItemIndex = useCallback((itemId: string): number => {
    return items.findIndex(item => item.id === itemId);
  }, [items]);

  // Obtener el elemento en un índice específico
  const getItemAtIndex = useCallback((index: number): AnyEntityWithStats | null => {
    return items[index] || null;
  }, [items]);

  // Hacer scroll a un elemento
  const scrollToItem = useCallback((itemId: string) => {
    const element = getItemElement(itemId);
    if (!element || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Verificar si el elemento está visible
    const isVisible = (
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom &&
      elementRect.left >= containerRect.left &&
      elementRect.right <= containerRect.right
    );

    if (!isVisible) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [getItemElement, containerRef]);

  // Función para enfocar un elemento por índice
  const focusItem = useCallback((index: number) => {
    if (index < 0 || index >= items.length) return;
    
    const item = items[index];
    setFocusedId(item.id);
    
    // Hacer scroll al elemento si es necesario
    scrollToItem(item.id);
  }, [items, scrollToItem, setFocusedId]);

  // Navegar a un elemento específico
  const navigateToItem = useCallback((targetIndex: number, extend: boolean = false) => {
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    const targetItem = items[targetIndex];
    if (!targetItem) return;

    // Actualizar el foco
    setFocusedId(targetItem.id);
    
    // Manejar selección
    if (extend && isMultiSelectMode) {
      // Selección extendida: desde el último elemento seleccionado hasta el actual
      const lastSelectedIndex = selectedItems.length > 0 
        ? getItemIndex(selectedItems[selectedItems.length - 1].id)
        : focusedIndex;
      
      if (lastSelectedIndex !== -1) {
        const start = Math.min(lastSelectedIndex, targetIndex);
        const end = Math.max(lastSelectedIndex, targetIndex);
        const rangeIds = items.slice(start, end + 1).map(item => item.id);
        selectRange(rangeIds);
      }
    } else {
      // Selección normal: solo el elemento actual
      setSelection([targetItem.id]);
    }

    // Hacer scroll al elemento si es necesario
    scrollToItem(targetItem.id);
  }, [items, getItemIndex, setFocusedId, setSelection, selectRange, scrollToItem, isMultiSelectMode, selectedItems, focusedIndex]);

  // Navegación con flechas
  const handleArrowNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right', extend: boolean = false) => {
    if (items.length === 0) return;
    
    let targetIndex = focusedIndex;
    
    // Si no hay elemento enfocado, empezar desde el primero
    if (targetIndex === -1) {
      targetIndex = 0;
    } else {
      // Calcular el siguiente índice basado en el tipo de vista
      switch (viewType) {
        case 'list':
          // En vista de lista, solo up/down
          if (direction === 'up') targetIndex = Math.max(0, targetIndex - 1);
          else if (direction === 'down') targetIndex = Math.min(items.length - 1, targetIndex + 1);
          break;
          
        case 'grid':
        case 'cards':
        case 'masonry':
          // En vistas de grid, usar gridColumns
          switch (direction) {
            case 'left':
              targetIndex = Math.max(0, targetIndex - 1);
              break;
            case 'right':
              targetIndex = Math.min(items.length - 1, targetIndex + 1);
              break;
            case 'up':
              targetIndex = Math.max(0, targetIndex - gridColumns);
              break;
            case 'down':
              targetIndex = Math.min(items.length - 1, targetIndex + gridColumns);
              break;
          }
          break;
      }
    }
    
    navigateToItem(targetIndex, extend);
  }, [focusedIndex, items.length, viewType, gridColumns, navigateToItem]);

  // Navegación por páginas
  const handlePageNavigation = useCallback((direction: 'pageup' | 'pagedown', extend: boolean = false) => {
    if (!containerRef.current || items.length === 0) return;

    const container = containerRef.current;
    const containerHeight = container.clientHeight;
    const itemHeight = viewType === 'list' ? 60 : 200; // Estimación
    const itemsPerPage = Math.floor(containerHeight / itemHeight);
    
    let currentIndex = focusedIndex;
    
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    let targetIndex = currentIndex;
    if (direction === 'pageup') {
      targetIndex = Math.max(0, currentIndex - itemsPerPage);
    } else {
      targetIndex = Math.min(items.length - 1, currentIndex + itemsPerPage);
    }

    navigateToItem(targetIndex, extend);
  }, [containerRef, focusedIndex, navigateToItem, viewType, items.length]);

  // Ir al inicio o final
  const handleHomeEnd = useCallback((direction: 'home' | 'end', extend: boolean = false) => {
    if (items.length === 0) return;
    
    const targetIndex = direction === 'home' ? 0 : items.length - 1;
    navigateToItem(targetIndex, extend);
  }, [items.length, navigateToItem]);

  // Registrar atajos de teclado
  useEffect(() => {
    // Navegación con flechas
    keyboardShortcutManager.register({
      key: 'arrowup',
      modifiers: [],
      action: 'navigate-up',
      context: 'file-browser',
      description: 'Navegar hacia arriba'
    }, () => handleArrowNavigation('up'));

    keyboardShortcutManager.register({
      key: 'arrowdown',
      modifiers: [],
      action: 'navigate-down',
      context: 'file-browser',
      description: 'Navegar hacia abajo'
    }, () => handleArrowNavigation('down'));

    keyboardShortcutManager.register({
      key: 'arrowleft',
      modifiers: [],
      action: 'navigate-left',
      context: 'file-browser',
      description: 'Navegar hacia la izquierda'
    }, () => handleArrowNavigation('left'));

    keyboardShortcutManager.register({
      key: 'arrowright',
      modifiers: [],
      action: 'navigate-right',
      context: 'file-browser',
      description: 'Navegar hacia la derecha'
    }, () => handleArrowNavigation('right'));

    // Navegación extendida con Shift
    keyboardShortcutManager.register({
      key: 'arrowup',
      modifiers: ['shift'],
      action: 'navigate-up-extend',
      context: 'file-browser',
      description: 'Extender selección hacia arriba'
    }, () => handleArrowNavigation('up', true));

    keyboardShortcutManager.register({
      key: 'arrowdown',
      modifiers: ['shift'],
      action: 'navigate-down-extend',
      context: 'file-browser',
      description: 'Extender selección hacia abajo'
    }, () => handleArrowNavigation('down', true));

    keyboardShortcutManager.register({
      key: 'arrowleft',
      modifiers: ['shift'],
      action: 'navigate-left-extend',
      context: 'file-browser',
      description: 'Extender selección hacia la izquierda'
    }, () => handleArrowNavigation('left', true));

    keyboardShortcutManager.register({
      key: 'arrowright',
      modifiers: ['shift'],
      action: 'navigate-right-extend',
      context: 'file-browser',
      description: 'Extender selección hacia la derecha'
    }, () => handleArrowNavigation('right', true));

    // Navegación por páginas
    keyboardShortcutManager.register({
      key: 'pageup',
      modifiers: [],
      action: 'navigate-page-up',
      context: 'file-browser',
      description: 'Página anterior'
    }, () => handlePageNavigation('pageup'));

    keyboardShortcutManager.register({
      key: 'pagedown',
      modifiers: [],
      action: 'navigate-page-down',
      context: 'file-browser',
      description: 'Página siguiente'
    }, () => handlePageNavigation('pagedown'));

    keyboardShortcutManager.register({
      key: 'pageup',
      modifiers: ['shift'],
      action: 'navigate-page-up-extend',
      context: 'file-browser',
      description: 'Extender selección página anterior'
    }, () => handlePageNavigation('pageup', true));

    keyboardShortcutManager.register({
      key: 'pagedown',
      modifiers: ['shift'],
      action: 'navigate-page-down-extend',
      context: 'file-browser',
      description: 'Extender selección página siguiente'
    }, () => handlePageNavigation('pagedown', true));

    // Home/End
    keyboardShortcutManager.register({
      key: 'home',
      modifiers: [],
      action: 'navigate-home',
      context: 'file-browser',
      description: 'Ir al inicio'
    }, () => handleHomeEnd('home'));

    keyboardShortcutManager.register({
      key: 'end',
      modifiers: [],
      action: 'navigate-end',
      context: 'file-browser',
      description: 'Ir al final'
    }, () => handleHomeEnd('end'));

    keyboardShortcutManager.register({
      key: 'home',
      modifiers: ['shift'],
      action: 'navigate-home-extend',
      context: 'file-browser',
      description: 'Extender selección al inicio'
    }, () => handleHomeEnd('home', true));

    keyboardShortcutManager.register({
      key: 'end',
      modifiers: ['shift'],
      action: 'navigate-end-extend',
      context: 'file-browser',
      description: 'Extender selección al final'
    }, () => handleHomeEnd('end', true));

    // Abrir elemento
    keyboardShortcutManager.register({
      key: 'enter',
      modifiers: [],
      action: 'open-focused',
      context: 'file-browser',
      description: 'Abrir elemento enfocado'
    }, () => {
      if (focusedIndex !== -1 && onOpenItem) {
        const item = items[focusedIndex];
        onOpenItem(item);
      }
    });

    // Vista previa
    keyboardShortcutManager.register({
      key: ' ',
      modifiers: [],
      action: 'preview-focused',
      context: 'file-browser',
      description: 'Vista previa del elemento enfocado'
    }, () => {
      if (focusedIndex !== -1 && onPreviewItem) {
        const item = items[focusedIndex];
        onPreviewItem(item);
      }
    });

    // Cleanup
    return () => {
      const actions = [
        'navigate-up', 'navigate-down', 'navigate-left', 'navigate-right',
        'navigate-up-extend', 'navigate-down-extend', 'navigate-left-extend', 'navigate-right-extend',
        'navigate-page-up', 'navigate-page-down', 'navigate-page-up-extend', 'navigate-page-down-extend',
        'navigate-home', 'navigate-end', 'navigate-home-extend', 'navigate-end-extend',
        'open-focused', 'preview-focused'
      ];
      
      actions.forEach(action => {
        keyboardShortcutManager.unregisterByAction(action);
      });
    };
  }, [handleArrowNavigation, handlePageNavigation, handleHomeEnd, focusedIndex, items, onOpenItem, onPreviewItem]);

  // Actualizar el último índice seleccionado cuando cambia la selección
  useEffect(() => {
    if (selectedIds.length > 0) {
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const index = getItemIndex(lastSelectedId);
      if (index >= 0) {
        lastSelectedIndexRef.current = index;
      }
    }
  }, [selectedIds, getItemIndex]);

  // Enfocar el primer elemento si no hay nada seleccionado
  useEffect(() => {
    if (items.length > 0 && selectedIds.length === 0 && !focusedId) {
      setFocusedId(items[0].id);
    }
  }, [items, selectedIds, focusedId, setFocusedId]);

  return null; // Este componente no renderiza nada, solo maneja la navegación
};

export default KeyboardNavigation;