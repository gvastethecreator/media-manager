/**
 * @file Tests unitarios para useSelectionStore
 * @module tests/stores/selection.store
 */

import { useSelectionStore } from '@/store/selection.store';
import type { FileItem } from '@/types/file-item';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

// 🧪 Mock de datos de prueba
const mockFileItem1: FileItem = {
  id: 'img-1',
  name: 'test-image-1.jpg',
  path: '/test/test-image-1.jpg',
  type: 'image/jpeg',
  size: 1024000,
  width: 1920,
  height: 1080,
  metadata: {},
  thumbnail: '/thumbnails/test-image-1.webp',
  isPublic: false,
  isFavorite: false,
  folderId: 'folder-1',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  collections: [],
  tags: [],
  albums: [],
  characters: [],
  places: [],
  worldItems: [],
  concepts: [],
  prompts: [],
  notes: []
};

const mockFileItem2: FileItem = {
  ...mockFileItem1,
  id: 'img-2',
  name: 'test-image-2.jpg',
  path: '/test/test-image-2.jpg'
};

const mockFileItem3: FileItem = {
  ...mockFileItem1,
  id: 'img-3',
  name: 'test-image-3.jpg',
  path: '/test/test-image-3.jpg'
};

describe('🧪 Selection Store - Core Operations', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    const { result } = renderHook(() => useSelectionStore());
    act(() => {
      result.current.clearSelection();
    });
  });

  describe('📦 Estado inicial', () => {
    it('debe tener un estado inicial vacío', () => {
      const { result } = renderHook(() => useSelectionStore());

      expect(result.current.selectedItems).toEqual([]);
      expect(result.current.selectedItem).toBe(null);
      expect(result.current.lastSelectedItem).toBe(null);
      expect(result.current.selectedIds).toEqual([]);
    });
  });

  describe('🎯 Selección individual', () => {
    it('debe seleccionar un item individual', () => {
      const { result } = renderHook(() => useSelectionStore());

      act(() => {
        result.current.selectItem(mockFileItem1);
      });

      expect(result.current.selectedItems).toHaveLength(1);
      expect(result.current.selectedItem?.id).toBe('img-1');
      expect(result.current.lastSelectedItem?.id).toBe('img-1');
      expect(result.current.selectedIds).toContain('img-1');
    });

    it('debe cambiar a otro item cuando se selecciona uno diferente', () => {
      const { result } = renderHook(() => useSelectionStore());

      // Seleccionar primer item
      act(() => {
        result.current.selectItem(mockFileItem1);
      });

      expect(result.current.selectedItem?.id).toBe('img-1');

      // Seleccionar segundo item
      act(() => {
        result.current.selectItem(mockFileItem2);
      });

      expect(result.current.selectedItems).toHaveLength(1);
      expect(result.current.selectedItem?.id).toBe('img-2');
      expect(result.current.lastSelectedItem?.id).toBe('img-2');
    });

    it('debe deseleccionar un item por ID', () => {
      const { result } = renderHook(() => useSelectionStore());

      // Seleccionar item
      act(() => {
        result.current.selectItem(mockFileItem1);
      });

      expect(result.current.selectedItems).toHaveLength(1);

      // Deseleccionar item
      act(() => {
        result.current.deselectItem('img-1');
      });

      expect(result.current.selectedItems).toHaveLength(0);
      expect(result.current.selectedItem).toBe(null);
    });
  });

  describe('🎯 Selección múltiple', () => {
    it('debe permitir selección múltiple con toggle', () => {
      const { result } = renderHook(() => useSelectionStore());

      // Toggle primer item (agregar)
      act(() => {
        result.current.toggleItemSelection(mockFileItem1, true);
      });

      expect(result.current.selectedItems).toHaveLength(1);
      expect(result.current.selectedIds).toContain('img-1');

      // Toggle segundo item (agregar)
      act(() => {
        result.current.toggleItemSelection(mockFileItem2, true);
      });

      expect(result.current.selectedItems).toHaveLength(2);
      expect(result.current.selectedIds).toContain('img-1');
      expect(result.current.selectedIds).toContain('img-2');
    });

    it('debe remover item con toggle si ya está seleccionado', () => {
      const { result } = renderHook(() => useSelectionStore());

      // Seleccionar item
      act(() => {
        result.current.toggleItemSelection(mockFileItem1, true);
      });

      expect(result.current.selectedItems).toHaveLength(1);

      // Toggle mismo item (remover)
      act(() => {
        result.current.toggleItemSelection(mockFileItem1, true);
      });

      expect(result.current.selectedItems).toHaveLength(0);
    });

    it('debe reemplazar selección cuando isMultiSelect es false', () => {
      const { result } = renderHook(() => useSelectionStore());

      // Seleccionar múltiples items
      act(() => {
        result.current.toggleItemSelection(mockFileItem1, true);
        result.current.toggleItemSelection(mockFileItem2, true);
      });

      expect(result.current.selectedItems).toHaveLength(2);

      // Toggle con isMultiSelect false (reemplazar)
      act(() => {
        result.current.toggleItemSelection(mockFileItem3, false);
      });

      expect(result.current.selectedItems).toHaveLength(1);
      expect(result.current.selectedItem?.id).toBe('img-3');
    });

    it('debe seleccionar todos los items', () => {
      const { result } = renderHook(() => useSelectionStore());
      const allItems = [mockFileItem1, mockFileItem2, mockFileItem3];

      act(() => {
        result.current.selectAll(allItems);
      });

      expect(result.current.selectedItems).toHaveLength(3);
      expect(result.current.selectedIds).toEqual(['img-1', 'img-2', 'img-3']);
    });

    it('debe seleccionar rango de items', () => {
      const { result } = renderHook(() => useSelectionStore());
      const allItems = [mockFileItem1, mockFileItem2, mockFileItem3];

      act(() => {
        result.current.selectRange(allItems, 0, 1);
      });

      expect(result.current.selectedItems).toHaveLength(2);
      expect(result.current.selectedIds).toContain('img-1');
      expect(result.current.selectedIds).toContain('img-2');
      expect(result.current.selectedIds).not.toContain('img-3');
    });
  });

  describe('🧹 Limpieza de selección', () => {
    it('debe limpiar toda la selección', () => {
      const { result } = renderHook(() => useSelectionStore());

      // Seleccionar múltiples items
      act(() => {
        result.current.toggleItemSelection(mockFileItem1, true);
        result.current.toggleItemSelection(mockFileItem2, true);
      });

      expect(result.current.selectedItems).toHaveLength(2);

      // Limpiar selección
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedItems).toHaveLength(0);
      expect(result.current.selectedItem).toBe(null);
      expect(result.current.lastSelectedItem).toBe(null);
      expect(result.current.selectedIds).toEqual([]);
    });
  });

  describe('🔍 Utilidades de selección', () => {
    it('debe detectar si un item está seleccionado', () => {
      const { result } = renderHook(() => useSelectionStore());

      act(() => {
        result.current.selectItem(mockFileItem1);
      });

      expect(result.current.isItemSelected('img-1')).toBe(true);
      expect(result.current.isItemSelected('img-2')).toBe(false);
    });

    it('debe obtener la cantidad de items seleccionados', () => {
      const { result } = renderHook(() => useSelectionStore());

      expect(result.current.selectedCount).toBe(0);

      act(() => {
        result.current.toggleItemSelection(mockFileItem1, true);
        result.current.toggleItemSelection(mockFileItem2, true);
      });

      expect(result.current.selectedCount).toBe(2);
    });

    it('debe detectar si hay algún item seleccionado', () => {
      const { result } = renderHook(() => useSelectionStore());

      expect(result.current.hasSelection).toBe(false);

      act(() => {
        result.current.selectItem(mockFileItem1);
      });

      expect(result.current.hasSelection).toBe(true);
    });

    it('debe detectar selección múltiple', () => {
      const { result } = renderHook(() => useSelectionStore());

      expect(result.current.hasMultipleSelection).toBe(false);

      act(() => {
        result.current.selectItem(mockFileItem1);
      });

      expect(result.current.hasMultipleSelection).toBe(false);

      act(() => {
        result.current.toggleItemSelection(mockFileItem2, true);
      });

      expect(result.current.hasMultipleSelection).toBe(true);
    });
  });

  describe('⚡ Rendimiento y optimización', () => {
    it('no debe duplicar items en la selección', () => {
      const { result } = renderHook(() => useSelectionStore());

      // Intentar agregar el mismo item múltiples veces
      act(() => {
        result.current.selectItem(mockFileItem1);
        result.current.toggleItemSelection(mockFileItem1, true);
        result.current.toggleItemSelection(mockFileItem1, true);
      });

      // Debería alternar: seleccionar -> deseleccionar -> seleccionar
      expect(result.current.selectedItems).toHaveLength(1);
      expect(result.current.selectedIds.filter(id => id === 'img-1')).toHaveLength(1);
    });

    it('debe manejar selección con items grandes sin problemas de performance', () => {
      const { result } = renderHook(() => useSelectionStore());
      const manyItems = Array.from({ length: 100 }, (_, i) => ({
        ...mockFileItem1,
        id: `img-${i}`,
        name: `image-${i}.jpg`
      }));

      const startTime = performance.now();

      act(() => {
        result.current.selectAll(manyItems);
      });

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      expect(result.current.selectedItems).toHaveLength(100);
      expect(operationTime).toBeLessThan(100); // Menos de 100ms para 100 items
    });
  });
});
