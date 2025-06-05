/**
 * 🎯 SELECTION HOOKS
 *
 * Hooks especializados para gestión de selección de items
 * Incluye selección individual, múltiple, rangos y keyboard shortcuts
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { useUnifiedFileManager } from '@/store/unified-file-manager.store';
import type { FileItem } from '@/types/file-item';
import { useCallback, useEffect } from 'react';

const selectionLogger = clientLogger.withContext('SelectionHooks');

// 🎯 Hook principal de selección
export const useSelection = () => {
  const store = useUnifiedFileManager();

  return {
    // 📍 Estado de selección
    selectedItems: store.selectedItems,
    selectedItem: store.selectedItem,
    lastSelectedItem: store.lastSelectedItem,

    // 🎯 Acciones básicas
    selectItem: store.selectItem,
    deselectItem: store.deselectItem,
    toggleItemSelection: store.toggleItemSelection,
    clearSelection: store.clearSelection,
    selectAll: store.selectAll,
    selectRange: store.selectRange,

    // 📊 Información de selección
    getSelectionStats: () => ({
      count: store.selectedItems.length,
      totalSize: store.selectedItems.reduce((acc, item) => acc + (item.size || 0), 0),
      hasSelection: store.selectedItems.length > 0,
      isMultipleSelection: store.selectedItems.length > 1,
      selectedTypes: [...new Set(store.selectedItems.map(item => item.type))],
      selectedFolders: [...new Set(store.selectedItems.map(item => item.folderId))]
    }),

    // 🔍 Utilidades de selección
    isSelected: (itemId: string) => store.selectedItems.some(item => item.id === itemId),
    getSelectedIds: () => store.selectedItems.map(item => item.id),
    getSelectedByType: (type: 'image' | 'file' | 'folder') =>
      store.selectedItems.filter(item => item.type === type),

    // 🎨 Selección por criterios
    selectByType: (type: 'image' | 'file' | 'folder') => {
      const itemsOfType = store.displayedItems.filter(item => item.type === type);
      itemsOfType.forEach(item => store.selectItem(item));
      selectionLogger.info(`🎯 Seleccionados ${itemsOfType.length} items de tipo ${type}`);
    },

    selectBySize: (minSize?: number, maxSize?: number) => {
      const filteredItems = store.displayedItems.filter(item => {
        const size = item.size || 0;
        return (!minSize || size >= minSize) && (!maxSize || size <= maxSize);
      });
      filteredItems.forEach(item => store.selectItem(item));
      selectionLogger.info(`🎯 Seleccionados ${filteredItems.length} items por tamaño`);
    },

    selectRecent: (days = 7) => {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const recentItems = store.displayedItems.filter(item =>
        item.createdAt && item.createdAt > cutoffDate
      );
      recentItems.forEach(item => store.selectItem(item));
      selectionLogger.info(`🎯 Seleccionados ${recentItems.length} items recientes (${days} días)`);
    }
  };
};

// ⌨️ Hook para keyboard shortcuts de selección
export const useSelectionKeyboard = () => {
  const store = useUnifiedFileManager();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 🔍 Solo procesar si no estamos en un input/textarea
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key) {
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          store.selectAll();
          selectionLogger.info('⌨️ Ctrl+A - Seleccionar todo');
        }
        break;

      case 'Escape':
        if (store.selectedItems.length > 0) {
          event.preventDefault();
          store.clearSelection();
          selectionLogger.info('⌨️ Escape - Limpiar selección');
        }
        break;

      case 'Delete':
      case 'Backspace':
        if (store.selectedItems.length > 0) {
          // TODO: Integrar con acciones de borrado
          selectionLogger.info('⌨️ Delete - Borrar seleccionados (TODO)');
        }
        break;
    }
  }, [store]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    // 🎯 Funciones manuales de keyboard
    selectAllKeyboard: () => store.selectAll(),
    clearSelectionKeyboard: () => store.clearSelection(),

    // 📊 Estado de keyboard
    keyboardEnabled: true
  };
};

// 🖱️ Hook para selección con mouse/touch optimizada
export const useSelectionMouse = () => {
  const store = useUnifiedFileManager();

  const handleItemClick = useCallback((
    item: FileItem,
    event: React.MouseEvent | MouseEvent
  ) => {
    const isCtrlPressed = event.ctrlKey || event.metaKey;
    const isShiftPressed = event.shiftKey;

    if (isShiftPressed && store.lastSelectedItem) {
      // 📐 Selección de rango
      const currentIndex = store.displayedItems.findIndex(i => i.id === item.id);
      const lastIndex = store.displayedItems.findIndex(i => i.id === store.lastSelectedItem!.id);

      if (currentIndex !== -1 && lastIndex !== -1) {
        store.selectRange(lastIndex, currentIndex);
        selectionLogger.info(`🖱️ Shift+Click - Rango ${lastIndex}-${currentIndex}`);
      }
    } else if (isCtrlPressed) {
      // 🎯 Toggle selección múltiple
      store.toggleItemSelection(item, true);
      selectionLogger.info(`🖱️ Ctrl+Click - Toggle ${item.id}`);
    } else {
      // 👆 Selección simple
      store.toggleItemSelection(item, false);
      selectionLogger.info(`🖱️ Click - Selección simple ${item.id}`);
    }
  }, [store]);

  return {
    handleItemClick,

    // 🎨 Helpers para componentes
    getItemProps: (item: FileItem) => ({
      onClick: (event: React.MouseEvent) => handleItemClick(item, event),
      'data-selected': store.selectedItems.some(selected => selected.id === item.id),
      'data-last-selected': store.lastSelectedItem?.id === item.id
    })
  };
};

// 📱 Hook para selección táctil (móvil/tablet)
export const useSelectionTouch = () => {
  const store = useUnifiedFileManager();

  const handleItemLongPress = useCallback((item: FileItem) => {
    // 📱 Long press activa selección múltiple
    if (store.selectedItems.length === 0) {
      store.selectItem(item);
      selectionLogger.info(`📱 Long press - Iniciar selección ${item.id}`);
    } else {
      store.toggleItemSelection(item, true);
      selectionLogger.info(`📱 Long press - Toggle en modo multi ${item.id}`);
    }
  }, [store]);

  const handleItemTap = useCallback((item: FileItem) => {
    if (store.selectedItems.length > 0) {
      // 📱 Si hay selección activa, hacer toggle
      store.toggleItemSelection(item, true);
      selectionLogger.info(`📱 Tap - Toggle en modo multi ${item.id}`);
    } else {
      // 📱 Tap normal - selección simple o navegación
      store.toggleItemSelection(item, false);
      selectionLogger.info(`📱 Tap - Selección simple ${item.id}`);
    }
  }, [store]);

  return {
    handleItemLongPress,
    handleItemTap,

    // 📱 Estados para UI móvil
    isMultiSelectMode: store.selectedItems.length > 0,

    // 🎨 Props para componentes táctiles
    getTouchProps: (item: FileItem) => ({
      onTouchStart: () => {
        // TODO: Implementar timer para long press
      },
      onTouchEnd: () => handleItemTap(item),
      'data-selected': store.selectedItems.some(selected => selected.id === item.id)
    })
  };
};

selectionLogger.info('🎯 Selection hooks configurados correctamente');
