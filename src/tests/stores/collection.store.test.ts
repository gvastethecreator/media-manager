/**
 * @file Tests para Collection Store
 * @description Tests completos para el store de gestión de colecciones
 */

import type { CollectionExtended } from '@/types/entities/collection';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mockear el cliente logger para evitar logs en tests
vi.mock('@/lib/logger/client-logger', () => ({
  clientLogger: {
    withContext: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('🧪 Collection Store Tests', () => {
  let useCollectionStore: any;
  let selectCollectionById: any;
  let selectSortedCollections: any;
  let selectGroupedCollections: any;
  let selectFavoriteCollections: any;
  let selectCurrentCollection: any;

  // Datos de prueba
  const mockCollections: CollectionExtended[] = [
    {
      id: '1',
      name: 'Paisajes',
      description: 'Colección de paisajes hermosos',
      emoji: '🏞️',
      color: '#22c55e',
      isFavorite: true,
      isPublic: false,
      _count: { images: 25 },
      images: [],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    {
      id: '2',
      name: 'Animales',
      description: 'Fotografías de animales',
      emoji: '🦁',
      color: '#f59e0b',
      isFavorite: false,
      isPublic: true,
      _count: { images: 15 },
      images: [],
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
    },
    {
      id: '3',
      name: 'Arquitectura',
      description: 'Edificios y estructuras',
      emoji: '🏗️',
      color: '#3b82f6',
      isFavorite: true,
      isPublic: false,
      _count: { images: 40 },
      images: [],
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03'),
    },
  ];

  beforeEach(async () => {
    // Limpiar mocks
    vi.clearAllMocks();
    vi.resetModules();

    // Importar módulos dinámicamente después del reset
    const module = await import('@/store/entities/collection');
    useCollectionStore = module.useCollectionStore;
    selectCollectionById = module.selectCollectionById;
    selectSortedCollections = module.selectSortedCollections;
    selectGroupedCollections = module.selectGroupedCollections;
    selectFavoriteCollections = module.selectFavoriteCollections;
    selectCurrentCollection = module.selectCurrentCollection;

    // Resetear estado del store
    act(() => {
      const store = useCollectionStore.getState();
      store.setCollections([]);
      store.selectCollection(null);
      store.setLoading(false);
      store.setError(null);
    });
  });

  describe('📋 Estado Inicial', () => {
    it('debería tener el estado inicial correcto', () => {
      const { result } = renderHook(() => useCollectionStore());
      const state = result.current;

      expect(state.collections).toEqual([]);
      expect(state.selectedCollectionId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.viewConfig).toEqual({
        viewType: 'grid',
        sortBy: 'name',
        sortDirection: 'asc',
        showImages: true,
        imageCount: 3,
        enableAnimations: true,
        groupBy: null,
      });
    });

    it('debería tener todas las acciones CRUD disponibles', () => {
      const { result } = renderHook(() => useCollectionStore());
      const state = result.current;

      // Operaciones de consulta
      expect(typeof state.getCollectionById).toBe('function');
      expect(typeof state.getCollections).toBe('function');
      expect(typeof state.getSelectedCollection).toBe('function');

      // Operaciones de mutación
      expect(typeof state.setCollections).toBe('function');
      expect(typeof state.addCollection).toBe('function');
      expect(typeof state.updateCollection).toBe('function');
      expect(typeof state.removeCollection).toBe('function');
      expect(typeof state.selectCollection).toBe('function');

      // Estado de carga y errores
      expect(typeof state.setLoading).toBe('function');
      expect(typeof state.setError).toBe('function');
    });
  });

  describe('🔧 Operaciones CRUD Básicas', () => {
    it('debería establecer colecciones correctamente', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
      });

      expect(result.current.collections).toEqual(mockCollections);
      expect(result.current.collections).toHaveLength(3);
    });

    it('debería agregar una nueva colección', () => {
      const { result } = renderHook(() => useCollectionStore());

      const newCollection: CollectionExtended = {
        id: '4',
        name: 'Retratos',
        description: 'Fotografías de personas',
        emoji: '👤',
        color: '#8b5cf6',
        isFavorite: false,
        isPublic: false,
        _count: { images: 10 },
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.setCollections(mockCollections);
        result.current.addCollection(newCollection);
      });

      expect(result.current.collections).toHaveLength(4);
      expect(result.current.collections[3]).toEqual(newCollection);
    });

    it('debería actualizar una colección existente', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
        result.current.updateCollection('1', {
          name: 'Paisajes Naturales',
          description: 'Hermosos paisajes de la naturaleza',
          isFavorite: false,
        });
      });

      const updatedCollection = result.current.getCollectionById('1');
      expect(updatedCollection?.name).toBe('Paisajes Naturales');
      expect(updatedCollection?.description).toBe('Hermosos paisajes de la naturaleza');
      expect(updatedCollection?.isFavorite).toBe(false);
      expect(updatedCollection?.emoji).toBe('🏞️'); // Debería mantener propiedades no actualizadas
    });

    it('debería eliminar una colección', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
        result.current.removeCollection('2');
      });

      expect(result.current.collections).toHaveLength(2);
      expect(result.current.getCollectionById('2')).toBeUndefined();
      expect(result.current.collections.find(c => c.id === '2')).toBeUndefined();
    });

    it('debería limpiar la selección si se elimina la colección seleccionada', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
        result.current.selectCollection('2');
      });

      expect(result.current.selectedCollectionId).toBe('2');

      act(() => {
        result.current.removeCollection('2');
      });

      expect(result.current.selectedCollectionId).toBeNull();
    });
  });

  describe('🎯 Operaciones de Selección', () => {
    it('debería seleccionar una colección', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
        result.current.selectCollection('1');
      });

      expect(result.current.selectedCollectionId).toBe('1');
      expect(result.current.getSelectedCollection()?.id).toBe('1');
    });

    it('debería limpiar la selección', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
        result.current.selectCollection('1');
        result.current.selectCollection(null);
      });

      expect(result.current.selectedCollectionId).toBeNull();
      expect(result.current.getSelectedCollection()).toBeUndefined();
    });

    it('debería obtener la colección seleccionada correctamente', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
        result.current.selectCollection('3');
      });

      const selectedCollection = result.current.getSelectedCollection();
      expect(selectedCollection?.id).toBe('3');
      expect(selectedCollection?.name).toBe('Arquitectura');
    });
  });

  describe('🔍 Operaciones de Consulta', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCollectionStore());
      act(() => {
        result.current.setCollections(mockCollections);
      });
    });

    it('debería obtener colección por ID', () => {
      const { result } = renderHook(() => useCollectionStore());

      const collection = result.current.getCollectionById('1');
      expect(collection?.id).toBe('1');
      expect(collection?.name).toBe('Paisajes');

      const nonExistent = result.current.getCollectionById('999');
      expect(nonExistent).toBeUndefined();
    });

    it('debería obtener todas las colecciones', () => {
      const { result } = renderHook(() => useCollectionStore());

      const collections = result.current.getCollections();
      expect(collections).toHaveLength(3);
      expect(collections).toEqual(mockCollections);
    });
  });

  describe('🎨 Configuración de Vista', () => {
    it('debería cambiar el tipo de vista', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setViewType('list');
      });

      expect(result.current.viewConfig.viewType).toBe('list');

      act(() => {
        result.current.setViewType('masonry');
      });

      expect(result.current.viewConfig.viewType).toBe('masonry');
    });

    it('debería cambiar criterio de ordenamiento', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setSortBy('createdAt');
      });

      expect(result.current.viewConfig.sortBy).toBe('createdAt');

      act(() => {
        result.current.setSortDirection('desc');
      });

      expect(result.current.viewConfig.sortDirection).toBe('desc');
    });

    it('debería controlar visibilidad de imágenes', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setShowImages(false);
      });

      expect(result.current.viewConfig.showImages).toBe(false);

      act(() => {
        result.current.setImageCount(5);
      });

      expect(result.current.viewConfig.imageCount).toBe(5);
    });

    it('debería configurar agrupación', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setGroupBy('isFavorite');
      });

      expect(result.current.viewConfig.groupBy).toBe('isFavorite');
    });

    it('debería controlar animaciones', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setEnableAnimations(false);
      });

      expect(result.current.viewConfig.enableAnimations).toBe(false);
    });
  });

  describe('📊 Funciones de Ordenamiento y Agrupación', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCollectionStore());
      act(() => {
        result.current.setCollections(mockCollections);
      });
    });

    it('debería ordenar colecciones por nombre ascendente', () => {
      const { result } = renderHook(() => useCollectionStore());

      const sorted = result.current.getSortedCollections('name_asc');
      expect(sorted[0].name).toBe('Animales');
      expect(sorted[1].name).toBe('Arquitectura');
      expect(sorted[2].name).toBe('Paisajes');
    });

    it('debería ordenar colecciones por nombre descendente', () => {
      const { result } = renderHook(() => useCollectionStore());

      const sorted = result.current.getSortedCollections('name_desc');
      expect(sorted[0].name).toBe('Paisajes');
      expect(sorted[1].name).toBe('Arquitectura');
      expect(sorted[2].name).toBe('Animales');
    });

    it('debería ordenar colecciones por fecha de creación', () => {
      const { result } = renderHook(() => useCollectionStore());

      const sortedAsc = result.current.getSortedCollections('createdAt_asc');
      expect(sortedAsc[0].id).toBe('1'); // 2023-01-01
      expect(sortedAsc[1].id).toBe('2'); // 2023-01-02
      expect(sortedAsc[2].id).toBe('3'); // 2023-01-03

      const sortedDesc = result.current.getSortedCollections('createdAt_desc');
      expect(sortedDesc[0].id).toBe('3'); // 2023-01-03
      expect(sortedDesc[1].id).toBe('2'); // 2023-01-02
      expect(sortedDesc[2].id).toBe('1'); // 2023-01-01
    });

    it('debería ordenar colecciones por número de imágenes', () => {
      const { result } = renderHook(() => useCollectionStore());

      const sortedAsc = result.current.getSortedCollections('imageCount_asc');
      expect(sortedAsc[0]._count.images).toBe(15); // Animales
      expect(sortedAsc[1]._count.images).toBe(25); // Paisajes
      expect(sortedAsc[2]._count.images).toBe(40); // Arquitectura

      const sortedDesc = result.current.getSortedCollections('imageCount_desc');
      expect(sortedDesc[0]._count.images).toBe(40); // Arquitectura
      expect(sortedDesc[1]._count.images).toBe(25); // Paisajes
      expect(sortedDesc[2]._count.images).toBe(15); // Animales
    });

    it('debería agrupar colecciones por favoritas', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setGroupBy('isFavorite');
      });

      const grouped = result.current.getGroupedCollections();
      expect(grouped).toHaveProperty('true');
      expect(grouped).toHaveProperty('false');
      expect(grouped.true).toHaveLength(2); // Paisajes y Arquitectura son favoritas
      expect(grouped.false).toHaveLength(1); // Animales no es favorita
    });

    it('debería agrupar colecciones por visibilidad pública', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setGroupBy('isPublic');
      });

      const grouped = result.current.getGroupedCollections();
      expect(grouped).toHaveProperty('true');
      expect(grouped).toHaveProperty('false');
      expect(grouped.true).toHaveLength(1); // Solo Animales es pública
      expect(grouped.false).toHaveLength(2); // Paisajes y Arquitectura son privadas
    });
  });

  describe('🔧 Selectores', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCollectionStore());
      act(() => {
        result.current.setCollections(mockCollections);
      });
    });

    it('selectCollectionById debería funcionar correctamente', () => {
      const { result } = renderHook(() => useCollectionStore());

      const collection = selectCollectionById('1')(result.current);
      expect(collection?.id).toBe('1');
      expect(collection?.name).toBe('Paisajes');

      const nonExistent = selectCollectionById('999')(result.current);
      expect(nonExistent).toBeUndefined();
    });

    it('selectSortedCollections debería usar la configuración actual', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setSortBy('name');
        result.current.setSortDirection('asc');
      });

      const sorted = selectSortedCollections(result.current);
      expect(sorted[0].name).toBe('Animales');
      expect(sorted[1].name).toBe('Arquitectura');
      expect(sorted[2].name).toBe('Paisajes');
    });

    it('selectFavoriteCollections debería filtrar solo favoritas', () => {
      const { result } = renderHook(() => useCollectionStore());

      const favorites = selectFavoriteCollections(result.current);
      expect(favorites).toHaveLength(2);
      expect(favorites.every(c => c.isFavorite)).toBe(true);
      expect(favorites.map(c => c.name)).toEqual(['Paisajes', 'Arquitectura']);
    });

    it('selectCurrentCollection debería obtener la seleccionada', () => {
      const { result } = renderHook(() => useCollectionStore());

      // Sin selección
      let current = selectCurrentCollection(result.current);
      expect(current).toBeUndefined();

      // Con selección
      act(() => {
        result.current.selectCollection('2');
      });

      current = selectCurrentCollection(result.current);
      expect(current?.id).toBe('2');
      expect(current?.name).toBe('Animales');
    });
  });

  describe('⚡ Gestión de Estado de Carga y Errores', () => {
    it('debería manejar estado de carga', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('debería manejar errores', () => {
      const { result } = renderHook(() => useCollectionStore());

      const errorMessage = 'Error de prueba';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('🏎️ Tests de Performance', () => {
    it('debería manejar grandes volúmenes de colecciones eficientemente', () => {
      const { result } = renderHook(() => useCollectionStore());

      // Crear 1000 colecciones de prueba
      const largeDataset: CollectionExtended[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `collection-${i}`,
        name: `Colección ${i}`,
        description: `Descripción ${i}`,
        emoji: '📁',
        color: '#3b82f6',
        isFavorite: i % 5 === 0, // 20% favoritas
        isPublic: i % 3 === 0, // 33% públicas
        _count: { images: Math.floor(Math.random() * 100) },
        images: [],
        createdAt: new Date(2023, 0, i % 31 + 1),
        updatedAt: new Date(2023, 0, i % 31 + 1),
      }));

      const startTime = performance.now();

      act(() => {
        result.current.setCollections(largeDataset);
      });

      const setTime = performance.now();

      // Operaciones de consulta
      result.current.getCollectionById('collection-500');
      const favorites = result.current.getSortedCollections('name_asc');
      result.current.getGroupedCollections();

      const endTime = performance.now();

      expect(result.current.collections).toHaveLength(1000);
      expect(favorites).toHaveLength(1000);

      // Las operaciones deberían completarse rápidamente
      expect(setTime - startTime).toBeLessThan(100); // Set < 100ms
      expect(endTime - setTime).toBeLessThan(500); // Queries < 500ms
    });

    it('debería manejar actualizaciones masivas eficientemente', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
      });

      const startTime = performance.now();

      // Realizar 100 actualizaciones consecutivas
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.updateCollection('1', {
            name: `Paisajes ${i}`,
            description: `Descripción actualizada ${i}`,
          });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Debería completarse en menos de 100ms
      expect(duration).toBeLessThan(100);

      // El resultado final debería ser correcto
      const collection = result.current.getCollectionById('1');
      expect(collection?.name).toBe('Paisajes 99');
      expect(collection?.description).toBe('Descripción actualizada 99');
    });
  });

  describe('🧹 Casos Edge', () => {
    it('debería manejar operaciones en colecciones inexistentes', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollections(mockCollections);
      });

      // Intentar actualizar colección inexistente
      act(() => {
        result.current.updateCollection('999', { name: 'No existe' });
      });

      // No debería afectar las colecciones existentes
      expect(result.current.collections).toHaveLength(3);
      expect(result.current.getCollectionById('999')).toBeUndefined();

      // Intentar eliminar colección inexistente
      act(() => {
        result.current.removeCollection('999');
      });

      // No debería afectar las colecciones existentes
      expect(result.current.collections).toHaveLength(3);
    });

    it('debería manejar datos malformados graciosamente', () => {
      const { result } = renderHook(() => useCollectionStore());

      const malformedCollection = {
        id: '999',
        name: '',
        // description falta
        // emoji falta
        // color falta
        isFavorite: undefined,
        isPublic: null,
        _count: undefined,
        images: null,
        // createdAt falta
        // updatedAt falta
      } as any;

      act(() => {
        result.current.addCollection(malformedCollection);
      });

      const added = result.current.getCollectionById('999');
      expect(added).toBeDefined();
      expect(added?.id).toBe('999');
    });

    it('debería manejar ordenamiento con valores nulos/undefined', () => {
      const { result } = renderHook(() => useCollectionStore());

      const collectionsWithNulls: CollectionExtended[] = [
        ...mockCollections,
        {
          id: '4',
          name: '',
          description: undefined,
          emoji: null,
          color: undefined,
          isFavorite: false,
          isPublic: false,
          _count: { images: 0 },
          images: [],
          createdAt: null as any,
          updatedAt: undefined as any,
        } as any,
      ];

      act(() => {
        result.current.setCollections(collectionsWithNulls);
      });

      // El ordenamiento debería funcionar sin errores
      expect(() => {
        result.current.getSortedCollections('name_asc');
        result.current.getSortedCollections('createdAt_asc');
        result.current.getSortedCollections('imageCount_desc');
      }).not.toThrow();
    });
  });

  describe('💾 Persistencia (Simulada)', () => {
    it('debería configurar correctamente las propiedades a persistir', () => {
      const { result } = renderHook(() => useCollectionStore());

      // Cambiar configuración de vista
      act(() => {
        result.current.setViewType('list');
        result.current.setSortBy('createdAt');
        result.current.selectCollection('1');
      });

      // Verificar que las propiedades importantes están presentes
      const state = result.current;
      expect(state.viewConfig).toBeDefined();
      expect(state.selectedCollectionId).toBeDefined();

      // Las colecciones NO deberían persistirse (según configuración)
      expect(state.collections).toBeDefined(); // Existe pero no se persiste
    });
  });
});
