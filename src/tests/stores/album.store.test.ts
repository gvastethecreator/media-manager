/**
 * @file Tests unitarios para el store de Album
 * @module tests/stores/album.store
 */

import { useAlbumStore } from '@/store/entities/album';
import type { AlbumBase, CreateAlbumData, UpdateAlbumData } from '@/types/entities/album';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

// 🧪 Mock de datos de prueba
const mockAlbumBase: AlbumBase = {
  id: 'album-test-1',
  name: 'Test Album',
  description: 'Album de prueba',
  emoji: '📸',
  color: '#3b82f6',
  type: 'standard',
  isPublic: false,
  isFavorite: false,
  tags: '["test", "album"]',
  parentId: null,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02')
};

const mockCreateData: CreateAlbumData = {
  name: 'Nuevo Album',
  description: 'Album creado en test',
  emoji: '🆕',
  color: '#10b981',
  type: 'standard'
};

const mockUpdateData: UpdateAlbumData = {
  name: 'Album Actualizado',
  description: 'Descripción actualizada'
};

describe('🧪 Album Store - Core Operations', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    const { result } = renderHook(() => useAlbumStore());
    act(() => {
      // Limpiar estado
      result.current.core.albums = {};
      result.current.core.albumItems = {};
      result.current.core.isLoading = false;
      result.current.core.error = null;
    });
  });

  describe('📦 Estado inicial', () => {
    it('debe tener un estado inicial válido', () => {
      const { result } = renderHook(() => useAlbumStore());

      expect(result.current.core.albums).toEqual({});
      expect(result.current.core.albumItems).toEqual({});
      expect(result.current.core.isLoading).toBe(false);
      expect(result.current.core.error).toBe(null);
      expect(result.current.core.lastUpdated).toBe(null);
    });

    it('debe tener configuración UI correcta', () => {
      const { result } = renderHook(() => useAlbumStore());

      expect(result.current.ui.selectedIds).toEqual([]);
      expect(result.current.ui.viewMode).toBe('grid');
      expect(result.current.ui.isViewerOpen).toBe(false);
      expect(result.current.ui.currentAlbumId).toBe(null);
    });

    it('debe tener filtros iniciales correctos', () => {
      const { result } = renderHook(() => useAlbumStore());

      expect(result.current.filters.sortBy).toBe('date_created_desc');
      expect(result.current.filters.searchQuery).toBe('');
      expect(result.current.filters.filterByType).toBe(null);
      expect(result.current.filters.filterFavorites).toBe(false);
    });
  });

  describe('🔧 Operaciones CRUD', () => {
    it('debe agregar un album correctamente', () => {
      const { result } = renderHook(() => useAlbumStore());

      act(() => {
        result.current.addAlbum(mockAlbumBase);
      });

      expect(result.current.core.albums[mockAlbumBase.id]).toBeDefined();
      expect(result.current.core.albums[mockAlbumBase.id].name).toBe(mockAlbumBase.name);
      expect(result.current.core.lastUpdated).toBeGreaterThan(0);
    });

    it('debe agregar múltiples albums', () => {
      const { result } = renderHook(() => useAlbumStore());
      const albums = [
        mockAlbumBase,
        { ...mockAlbumBase, id: 'album-test-2', name: 'Album 2' }
      ];

      act(() => {
        result.current.addAlbums(albums);
      });

      expect(Object.keys(result.current.core.albums)).toHaveLength(2);
      expect(result.current.core.albums['album-test-1']).toBeDefined();
      expect(result.current.core.albums['album-test-2']).toBeDefined();
    });

    it('debe actualizar un album existente', () => {
      const { result } = renderHook(() => useAlbumStore());

      // Primero agregar el album
      act(() => {
        result.current.addAlbum(mockAlbumBase);
      });

      // Luego actualizarlo
      act(() => {
        result.current.updateAlbum(mockAlbumBase.id, mockUpdateData);
      });

      const updatedAlbum = result.current.core.albums[mockAlbumBase.id];
      expect(updatedAlbum.name).toBe(mockUpdateData.name);
      expect(updatedAlbum.description).toBe(mockUpdateData.description);
    });

    it('debe eliminar un album correctamente', () => {
      const { result } = renderHook(() => useAlbumStore());

      // Primero agregar el album
      act(() => {
        result.current.addAlbum(mockAlbumBase);
      });

      expect(result.current.core.albums[mockAlbumBase.id]).toBeDefined();

      // Luego eliminarlo
      act(() => {
        result.current.deleteAlbum(mockAlbumBase.id);
      });

      expect(result.current.core.albums[mockAlbumBase.id]).toBeUndefined();
    });
  });

  describe('📸 Gestión de elementos del album', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAlbumStore());
      act(() => {
        result.current.addAlbum(mockAlbumBase);
      });
    });

    it('debe agregar un elemento al album', () => {
      const { result } = renderHook(() => useAlbumStore());

      act(() => {
        result.current.addItemToAlbum(mockAlbumBase.id, 'image-1', 'image');
      });

      const albumItems = result.current.core.albumItems[mockAlbumBase.id];
      expect(albumItems).toHaveLength(1);
      expect(albumItems[0]).toEqual({ id: 'image-1', type: 'image' });
    });

    it('debe prevenir duplicados en el album', () => {
      const { result } = renderHook(() => useAlbumStore());

      act(() => {
        result.current.addItemToAlbum(mockAlbumBase.id, 'image-1', 'image');
        result.current.addItemToAlbum(mockAlbumBase.id, 'image-1', 'image');
      });

      const albumItems = result.current.core.albumItems[mockAlbumBase.id];
      expect(albumItems).toHaveLength(1);
    });

    it('debe remover un elemento del album', () => {
      const { result } = renderHook(() => useAlbumStore());

      // Agregar elemento
      act(() => {
        result.current.addItemToAlbum(mockAlbumBase.id, 'image-1', 'image');
        result.current.addItemToAlbum(mockAlbumBase.id, 'image-2', 'image');
      });

      expect(result.current.core.albumItems[mockAlbumBase.id]).toHaveLength(2);

      // Remover elemento
      act(() => {
        result.current.removeItemFromAlbum(mockAlbumBase.id, 'image-1');
      });

      const albumItems = result.current.core.albumItems[mockAlbumBase.id];
      expect(albumItems).toHaveLength(1);
      expect(albumItems[0].id).toBe('image-2');
    });
  });

  describe('🔍 Selectores y getters', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAlbumStore());
      act(() => {
        result.current.addAlbum(mockAlbumBase);
        result.current.addAlbum({ ...mockAlbumBase, id: 'child-album', parentId: mockAlbumBase.id });
      });
    });

    it('debe obtener album por ID', () => {
      const { result } = renderHook(() => useAlbumStore());

      const album = result.current.getAlbum(mockAlbumBase.id);
      expect(album).toBeDefined();
      expect(album?.id).toBe(mockAlbumBase.id);
    });

    it('debe obtener todos los albums', () => {
      const { result } = renderHook(() => useAlbumStore());

      const albums = result.current.getAlbums();
      expect(albums).toHaveLength(2);
    });

    it('debe obtener albums hijos por parent ID', () => {
      const { result } = renderHook(() => useAlbumStore());

      const childAlbums = result.current.getChildAlbums(mockAlbumBase.id);
      expect(childAlbums).toHaveLength(1);
      expect(childAlbums[0].id).toBe('child-album');
    });

    it('debe obtener albums raíz', () => {
      const { result } = renderHook(() => useAlbumStore());

      const rootAlbums = result.current.getRootAlbums();
      expect(rootAlbums).toHaveLength(1);
      expect(rootAlbums[0].id).toBe(mockAlbumBase.id);
    });

    it('debe obtener elementos del album', () => {
      const { result } = renderHook(() => useAlbumStore());

      act(() => {
        result.current.addItemToAlbum(mockAlbumBase.id, 'image-1', 'image');
      });

      const albumItems = result.current.getAlbumItems(mockAlbumBase.id);
      expect(albumItems).toHaveLength(1);
      expect(albumItems[0]).toEqual({ id: 'image-1', type: 'image' });
    });
  });

  describe('⚡ Estado de carga y errores', () => {
    it('debe manejar estado de carga', () => {
      const { result } = renderHook(() => useAlbumStore());

      expect(result.current.core.isLoading).toBe(false);

      // Simular operación de carga
      act(() => {
        result.current.core.isLoading = true;
      });

      expect(result.current.core.isLoading).toBe(true);
    });

    it('debe manejar errores', () => {
      const { result } = renderHook(() => useAlbumStore());
      const errorMessage = 'Error de prueba';

      expect(result.current.core.error).toBe(null);

      act(() => {
        result.current.core.error = errorMessage;
      });

      expect(result.current.core.error).toBe(errorMessage);
    });
  });
});

describe('🎨 Album Store - UI Operations', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAlbumStore());
    act(() => {
      // Reset UI state
      result.current.ui.selectedIds = [];
      result.current.ui.viewMode = 'grid';
      result.current.ui.currentAlbumId = null;
    });
  });

  it('debe manejar selección de albums', () => {
    const { result } = renderHook(() => useAlbumStore());

    act(() => {
      result.current.ui.selectedIds = ['album-1', 'album-2'];
    });

    expect(result.current.ui.selectedIds).toEqual(['album-1', 'album-2']);
  });

  it('debe cambiar modo de vista', () => {
    const { result } = renderHook(() => useAlbumStore());

    expect(result.current.ui.viewMode).toBe('grid');

    act(() => {
      result.current.ui.viewMode = 'list';
    });

    expect(result.current.ui.viewMode).toBe('list');
  });

  it('debe gestionar album actual', () => {
    const { result } = renderHook(() => useAlbumStore());

    expect(result.current.ui.currentAlbumId).toBe(null);

    act(() => {
      result.current.ui.currentAlbumId = 'album-1';
    });

    expect(result.current.ui.currentAlbumId).toBe('album-1');
  });
});

describe('🔍 Album Store - Filters', () => {
  it('debe aplicar filtros de búsqueda', () => {
    const { result } = renderHook(() => useAlbumStore());

    expect(result.current.filters.searchQuery).toBe('');

    act(() => {
      result.current.filters.searchQuery = 'test album';
    });

    expect(result.current.filters.searchQuery).toBe('test album');
  });

  it('debe aplicar ordenamiento', () => {
    const { result } = renderHook(() => useAlbumStore());

    expect(result.current.filters.sortBy).toBe('date_created_desc');

    act(() => {
      result.current.filters.sortBy = 'name_asc';
    });

    expect(result.current.filters.sortBy).toBe('name_asc');
  });

  it('debe filtrar por favoritos', () => {
    const { result } = renderHook(() => useAlbumStore());

    expect(result.current.filters.filterFavorites).toBe(false);

    act(() => {
      result.current.filters.filterFavorites = true;
    });

    expect(result.current.filters.filterFavorites).toBe(true);
  });
});
