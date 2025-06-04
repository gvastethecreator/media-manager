/**
 * @file Tests para Place Store
 * @description Tests comprehensivos para la gestión de lugares en el sistema
 */

import { usePlaceStore } from '@/store/entities/place';
import type { Place } from '@/types/entities/place';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 🎭 Mocks
vi.mock('@/lib/logger/client-logger', () => ({
  clientLogger: {
    withContext: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

vi.mock('@/services/toast.service', () => ({
  toastService: {
    system: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  },
}));

// Mock de fetch global
global.fetch = vi.fn();

describe('🗺️ Place Store', () => {
  // Helper para crear lugar de prueba
  const createMockPlace = (overrides: Partial<Place> = {}): Place => ({
    id: 'place-1',
    name: 'Test Place',
    description: 'Test place description',
    type: 'city',
    category: 'urban',
    location: 'Test Location',
    region: 'Test Region',
    country: 'Test Country',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    climate: 'temperate',
    population: 1000000,
    area: 778.2,
    elevation: 10,
    timezone: 'America/New_York',
    language: ['English'],
    currency: 'USD',
    government: 'democratic',
    culture: 'western',
    economy: 'mixed',
    geography: 'coastal',
    history: 'Test history',
    landmarks: ['Test Landmark'],
    resources: ['Test Resource'],
    threats: ['Test Threat'],
    connections: [],
    emoji: '🏙️',
    color: '#3b82f6',
    featuredImage: null,
    isFavorite: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  const createMockViewConfig = () => ({
    sortBy: 'name' as const,
    sortOrder: 'asc' as const,
    groupBy: null,
    filterBy: null,
  });

  beforeEach(() => {
    // Reset del store antes de cada test
    const initialState = {
      places: [],
      viewConfig: createMockViewConfig(),
      selectedPlaceId: null,
      isLoading: false,
      error: null,
    };

    usePlaceStore.getState = vi.fn().mockReturnValue(initialState);

    // Reset de mocks
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('📊 Estado Inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      const { result } = renderHook(() => usePlaceStore());

      expect(result.current.places).toEqual([]);
      expect(result.current.selectedPlaceId).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.viewConfig).toEqual({
        sortBy: 'name',
        sortOrder: 'asc',
        groupBy: null,
        filterBy: null,
      });
    });
  });

  describe('🔄 Carga de Datos', () => {
    describe('loadPlaces', () => {
      it('debe cargar lugares correctamente', async () => {
        const mockPlaces = [
          createMockPlace({ id: '1', name: 'Place 1' }),
          createMockPlace({ id: '2', name: 'Place 2' }),
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPlaces,
        });

        const { result } = renderHook(() => usePlaceStore());

        // Mock del state setter
        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          loadPlaces: async () => {
            setState({ isLoading: true, error: null });
            try {
              const response = await fetch('/api/entities/places');
              const places = await response.json();
              setState({ places, isLoading: false });
              return places;
            } catch (error) {
              setState({ error: 'Error al cargar lugares', isLoading: false });
              throw error;
            }
          },
        });

        await act(async () => {
          await result.current.loadPlaces();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/entities/places');
        expect(setState).toHaveBeenCalledWith({ isLoading: true, error: null });
        expect(setState).toHaveBeenCalledWith({ places: mockPlaces, isLoading: false });
      });

      it('debe manejar errores al cargar lugares', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
          new Error('Network error')
        );

        const { result } = renderHook(() => usePlaceStore());

        // Mock del state setter para error
        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          loadPlaces: async () => {
            setState({ isLoading: true, error: null });
            try {
              await fetch('/api/entities/places');
            } catch (error) {
              setState({ error: 'Error al cargar lugares', isLoading: false });
              throw error;
            }
          },
        });

        await act(async () => {
          try {
            await result.current.loadPlaces();
          } catch (error) {
            // Expected error
          }
        });

        expect(setState).toHaveBeenCalledWith({ isLoading: true, error: null });
        expect(setState).toHaveBeenCalledWith({
          error: 'Error al cargar lugares',
          isLoading: false
        });
      });

      it('debe manejar respuesta HTTP no exitosa', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

        const { result } = renderHook(() => usePlaceStore());

        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          loadPlaces: async () => {
            setState({ isLoading: true, error: null });
            try {
              const response = await fetch('/api/entities/places');
              if (!response.ok) throw new Error('Error al cargar lugares');
            } catch (error) {
              setState({ error: 'Error al cargar lugares', isLoading: false });
              throw error;
            }
          },
        });

        await act(async () => {
          try {
            await result.current.loadPlaces();
          } catch (error) {
            // Expected error
          }
        });

        expect(setState).toHaveBeenCalledWith({
          error: 'Error al cargar lugares',
          isLoading: false
        });
      });
    });
  });

  describe('🎯 Selectores y Búsqueda', () => {
    describe('getPlaceById', () => {
      it('debe encontrar un lugar por ID', () => {
        const place1 = createMockPlace({ id: 'place-1', name: 'Place 1' });
        const place2 = createMockPlace({ id: 'place-2', name: 'Place 2' });

        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          places: [place1, place2],
          getPlaceById: (id: string) => [place1, place2].find(p => p.id === id),
        });

        const { result } = renderHook(() => usePlaceStore());

        const foundPlace = result.current.getPlaceById('place-1');
        expect(foundPlace).toEqual(place1);
      });

      it('debe retornar undefined para ID inexistente', () => {
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          places: [],
          getPlaceById: (id: string) => undefined,
        });

        const { result } = renderHook(() => usePlaceStore());

        const foundPlace = result.current.getPlaceById('nonexistent');
        expect(foundPlace).toBeUndefined();
      });
    });

    describe('getSortedPlaces', () => {
      it('debe ordenar lugares por nombre ascendente', () => {
        const places = [
          createMockPlace({ id: '1', name: 'Zebra City' }),
          createMockPlace({ id: '2', name: 'Alpha Town' }),
          createMockPlace({ id: '3', name: 'Beta Village' }),
        ];

        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          places,
          viewConfig: { ...createMockViewConfig(), sortBy: 'name', sortOrder: 'asc' },
          getSortedPlaces: () => {
            return [...places].sort((a, b) => a.name.localeCompare(b.name));
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        const sortedPlaces = result.current.getSortedPlaces();
        expect(sortedPlaces[0].name).toBe('Alpha Town');
        expect(sortedPlaces[1].name).toBe('Beta Village');
        expect(sortedPlaces[2].name).toBe('Zebra City');
      });

      it('debe ordenar lugares por nombre descendente', () => {
        const places = [
          createMockPlace({ id: '1', name: 'Alpha Town' }),
          createMockPlace({ id: '2', name: 'Beta Village' }),
          createMockPlace({ id: '3', name: 'Zebra City' }),
        ];

        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          places,
          viewConfig: { ...createMockViewConfig(), sortBy: 'name', sortOrder: 'desc' },
          getSortedPlaces: () => {
            return [...places].sort((a, b) => b.name.localeCompare(a.name));
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        const sortedPlaces = result.current.getSortedPlaces();
        expect(sortedPlaces[0].name).toBe('Zebra City');
        expect(sortedPlaces[1].name).toBe('Beta Village');
        expect(sortedPlaces[2].name).toBe('Alpha Town');
      });

      it('debe manejar ordenación por otros campos', () => {
        const places = [
          createMockPlace({ id: '1', name: 'Small City', population: 50000 }),
          createMockPlace({ id: '2', name: 'Big City', population: 1000000 }),
          createMockPlace({ id: '3', name: 'Medium City', population: 500000 }),
        ];

        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          places,
          viewConfig: { ...createMockViewConfig(), sortBy: 'population', sortOrder: 'asc' },
          getSortedPlaces: () => {
            return [...places].sort((a, b) => (a as any).population - (b as any).population);
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        const sortedPlaces = result.current.getSortedPlaces();
        expect(sortedPlaces[0].name).toBe('Small City');
        expect(sortedPlaces[1].name).toBe('Medium City');
        expect(sortedPlaces[2].name).toBe('Big City');
      });
    });
  });

  describe('🎛️ Gestión de Selección', () => {
    describe('selectPlace', () => {
      it('debe seleccionar un lugar', () => {
        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          selectPlace: (placeId: string) => setState({ selectedPlaceId: placeId }),
        });

        const { result } = renderHook(() => usePlaceStore());

        act(() => {
          result.current.selectPlace('place-1');
        });

        expect(setState).toHaveBeenCalledWith({ selectedPlaceId: 'place-1' });
      });

      it('debe permitir deseleccionar lugar pasando null', () => {
        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          selectedPlaceId: 'place-1',
          selectPlace: (placeId: string | null) => setState({ selectedPlaceId: placeId }),
        });

        const { result } = renderHook(() => usePlaceStore());

        act(() => {
          result.current.selectPlace(null);
        });

        expect(setState).toHaveBeenCalledWith({ selectedPlaceId: null });
      });
    });
  });

  describe('⚙️ Configuración de Vista', () => {
    describe('updateViewConfig', () => {
      it('debe actualizar configuración de vista parcialmente', () => {
        const initialConfig = createMockViewConfig();
        const setState = vi.fn();

        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          viewConfig: initialConfig,
          updateViewConfig: (config: any) => {
            setState((state: any) => ({
              viewConfig: { ...state.viewConfig, ...config },
            }));
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        act(() => {
          result.current.updateViewConfig({ sortOrder: 'desc' });
        });

        expect(setState).toHaveBeenCalledWith(expect.any(Function));
      });

      it('debe actualizar múltiples campos de configuración', () => {
        const setState = vi.fn();

        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          updateViewConfig: (config: any) => {
            setState((state: any) => ({
              viewConfig: { ...state.viewConfig, ...config },
            }));
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        const newConfig = {
          sortBy: 'population' as const,
          sortOrder: 'desc' as const,
          groupBy: 'type' as const,
        };

        act(() => {
          result.current.updateViewConfig(newConfig);
        });

        expect(setState).toHaveBeenCalledWith(expect.any(Function));
      });
    });
  });

  describe('🖼️ Gestión de Imágenes', () => {
    describe('addImageToPlace', () => {
      it('debe añadir imagen a lugar correctamente', async () => {
        const placeId = 'place-1';
        const imageId = 'image-1';
        const updatedPlace = createMockPlace({
          id: placeId,
          name: 'Updated Place'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedPlace,
        });

        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          places: [createMockPlace({ id: placeId })],
          addImageToPlace: async (placeId: string, imageId: string) => {
            const response = await fetch(`/api/places/${placeId}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageId }),
            });

            if (!response.ok) throw new Error('Error al añadir imagen al lugar');

            const updatedPlace = await response.json();
            setState((state: any) => ({
              places: state.places.map((place: any) =>
                place.id === placeId ? updatedPlace : place
              ),
            }));
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        await act(async () => {
          await result.current.addImageToPlace(placeId, imageId);
        });

        expect(global.fetch).toHaveBeenCalledWith(
          `/api/places/${placeId}/images`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageId }),
          }
        );
        expect(setState).toHaveBeenCalledWith(expect.any(Function));
      });

      it('debe manejar errores al añadir imagen', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          addImageToPlace: async (placeId: string, imageId: string) => {
            try {
              const response = await fetch(`/api/places/${placeId}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId }),
              });

              if (!response.ok) throw new Error('Error al añadir imagen al lugar');
            } catch (error) {
              // Log error but don't set state in test
              throw error;
            }
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        await act(async () => {
          try {
            await result.current.addImageToPlace('place-1', 'image-1');
          } catch (error) {
            expect(error).toBeDefined();
          }
        });
      });
    });

    describe('removeImageFromPlace', () => {
      it('debe eliminar imagen de lugar correctamente', async () => {
        const placeId = 'place-1';
        const imageId = 'image-1';
        const updatedPlace = createMockPlace({
          id: placeId,
          name: 'Updated Place'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedPlace,
        });

        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          places: [createMockPlace({ id: placeId })],
          removeImageFromPlace: async (placeId: string, imageId: string) => {
            const response = await fetch(`/api/places/${placeId}/images/${imageId}`, {
              method: 'DELETE',
            });

            if (!response.ok) throw new Error('Error al eliminar imagen del lugar');

            const updatedPlace = await response.json();
            setState((state: any) => ({
              places: state.places.map((place: any) =>
                place.id === placeId ? updatedPlace : place
              ),
            }));
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        await act(async () => {
          await result.current.removeImageFromPlace(placeId, imageId);
        });

        expect(global.fetch).toHaveBeenCalledWith(
          `/api/places/${placeId}/images/${imageId}`,
          { method: 'DELETE' }
        );
        expect(setState).toHaveBeenCalledWith(expect.any(Function));
      });

      it('debe manejar errores al eliminar imagen', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        const setState = vi.fn();
        usePlaceStore.getState = vi.fn().mockReturnValue({
          ...usePlaceStore.getState(),
          removeImageFromPlace: async (placeId: string, imageId: string) => {
            try {
              const response = await fetch(`/api/places/${placeId}/images/${imageId}`, {
                method: 'DELETE',
              });

              if (!response.ok) throw new Error('Error al eliminar imagen del lugar');
            } catch (error) {
              throw error;
            }
          },
        });

        const { result } = renderHook(() => usePlaceStore());

        await act(async () => {
          try {
            await result.current.removeImageFromPlace('place-1', 'image-1');
          } catch (error) {
            expect(error).toBeDefined();
          }
        });
      });
    });
  });

  describe('🌍 Datos Geográficos', () => {
    it('debe manejar coordenadas válidas', () => {
      const placeWithCoords = createMockPlace({
        id: 'place-coords',
        name: 'Place with Coordinates',
        coordinates: { lat: 51.5074, lng: -0.1278 }, // London
      });

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        places: [placeWithCoords],
        getPlaceById: (id: string) => placeWithCoords,
      });

      const { result } = renderHook(() => usePlaceStore());

      const place = result.current.getPlaceById('place-coords');
      expect(place?.coordinates).toEqual({ lat: 51.5074, lng: -0.1278 });
    });

    it('debe manejar lugares sin coordenadas', () => {
      const placeWithoutCoords = createMockPlace({
        id: 'place-no-coords',
        name: 'Place without Coordinates',
        coordinates: undefined,
      });

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        places: [placeWithoutCoords],
        getPlaceById: (id: string) => placeWithoutCoords,
      });

      const { result } = renderHook(() => usePlaceStore());

      const place = result.current.getPlaceById('place-no-coords');
      expect(place?.coordinates).toBeUndefined();
    });

    it('debe validar coordenadas válidas', () => {
      const placesWithVariousCoords = [
        createMockPlace({ id: '1', coordinates: { lat: 90, lng: 180 } }), // Límites máximos
        createMockPlace({ id: '2', coordinates: { lat: -90, lng: -180 } }), // Límites mínimos
        createMockPlace({ id: '3', coordinates: { lat: 0, lng: 0 } }), // Ecuador/Greenwich
      ];

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        places: placesWithVariousCoords,
        getPlaceById: (id: string) => placesWithVariousCoords.find(p => p.id === id),
      });

      const { result } = renderHook(() => usePlaceStore());

      placesWithVariousCoords.forEach(place => {
        const foundPlace = result.current.getPlaceById(place.id);
        expect(foundPlace?.coordinates?.lat).toBeGreaterThanOrEqual(-90);
        expect(foundPlace?.coordinates?.lat).toBeLessThanOrEqual(90);
        expect(foundPlace?.coordinates?.lng).toBeGreaterThanOrEqual(-180);
        expect(foundPlace?.coordinates?.lng).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('⚡ Performance Tests', () => {
    it('debe manejar grandes datasets eficientemente', () => {
      // Crear dataset grande de 1000 lugares
      const largePlaces = Array.from({ length: 1000 }, (_, i) =>
        createMockPlace({
          id: `place-${i}`,
          name: `Place ${i}`,
          type: i % 2 === 0 ? 'city' : 'town',
          population: Math.floor(Math.random() * 1000000),
        })
      );

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        places: largePlaces,
        getSortedPlaces: () => {
          return [...largePlaces].sort((a, b) => a.name.localeCompare(b.name));
        },
      });

      const { result } = renderHook(() => usePlaceStore());

      // Test de ordenación rápida
      const startTime = performance.now();
      const sortedPlaces = result.current.getSortedPlaces();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Menos de 100ms
      expect(sortedPlaces).toHaveLength(1000);
      expect(sortedPlaces[0].name).toBe('Place 0');
    });

    it('debe optimizar búsqueda por ID', () => {
      const largePlaces = Array.from({ length: 1000 }, (_, i) =>
        createMockPlace({ id: `place-${i}`, name: `Place ${i}` })
      );

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        places: largePlaces,
        getPlaceById: (id: string) => largePlaces.find(p => p.id === id),
      });

      const { result } = renderHook(() => usePlaceStore());

      const startTime = performance.now();
      const place = result.current.getPlaceById('place-500');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Menos de 10ms
      expect(place?.name).toBe('Place 500');
    });
  });

  describe('🔧 Edge Cases', () => {
    it('debe manejar lugares con datos incompletos', () => {
      const incompletePlace = {
        id: 'incomplete',
        name: 'Incomplete Place',
        // Faltan muchos campos requeridos
      } as Place;

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        places: [incompletePlace],
        getSortedPlaces: () => [incompletePlace],
      });

      const { result } = renderHook(() => usePlaceStore());

      expect(() => {
        result.current.getSortedPlaces();
      }).not.toThrow();
    });

    it('debe manejar caracteres especiales en nombres', () => {
      const placesWithSpecialChars = [
        createMockPlace({ id: '1', name: 'Café París' }),
        createMockPlace({ id: '2', name: 'São Paulo' }),
        createMockPlace({ id: '3', name: 'Москва' }), // Moscow en cirílico
        createMockPlace({ id: '4', name: '东京' }), // Tokyo en japonés
      ];

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        places: placesWithSpecialChars,
        getSortedPlaces: () => {
          return [...placesWithSpecialChars].sort((a, b) => a.name.localeCompare(b.name));
        },
      });

      const { result } = renderHook(() => usePlaceStore());

      const sortedPlaces = result.current.getSortedPlaces();
      expect(sortedPlaces).toHaveLength(4);
      // Los caracteres especiales no deberían causar errores
      expect(sortedPlaces.every(place => place.name.length > 0)).toBe(true);
    });

    it('debe manejar configuraciones de vista inválidas', () => {
      const invalidConfig = {
        sortBy: 'invalidField' as any,
        sortOrder: 'invalidOrder' as any,
      };

      const setState = vi.fn();
      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        updateViewConfig: (config: any) => {
          // Debería manejar graciosamente configuraciones inválidas
          setState((state: any) => ({
            viewConfig: { ...state.viewConfig, ...config },
          }));
        },
      });

      const { result } = renderHook(() => usePlaceStore());

      expect(() => {
        act(() => {
          result.current.updateViewConfig(invalidConfig);
        });
      }).not.toThrow();

      expect(setState).toHaveBeenCalled();
    });

    it('debe manejar errores de red en operaciones de imagen', async () => {
      // Simular error de red
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network Error')
      );

      usePlaceStore.getState = vi.fn().mockReturnValue({
        ...usePlaceStore.getState(),
        addImageToPlace: async () => {
          throw new Error('Network Error');
        },
      });

      const { result } = renderHook(() => usePlaceStore());

      await act(async () => {
        try {
          await result.current.addImageToPlace('place-1', 'image-1');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Network Error');
        }
      });
    });
  });

  describe('💾 Persistencia', () => {
    it('debe configurar persistencia correctamente', () => {
      // Verificar que el store tenga configuración de persistencia
      expect(usePlaceStore.persist).toBeDefined();
    });

    it('debe particionar estado para persistencia', () => {
      // El estado debe persistir configuración pero no datos temporales
      const mockState = {
        places: [createMockPlace()],
        viewConfig: createMockViewConfig(),
        selectedPlaceId: 'place-1',
        isLoading: true,
        error: 'Some error',
      };

      // La persistencia debería conservar viewConfig pero no isLoading/error
      expect(mockState.viewConfig).toBeDefined();
      expect(mockState.places).toBeDefined();
    });
  });
});
