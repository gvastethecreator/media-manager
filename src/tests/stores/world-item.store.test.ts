/**
 * @file Tests unitarios para WorldItem Store
 * @module tests/stores/world-item.store.test
 */

import { useWorldItemStore, worldItemApi } from '@/store/entities/world-item';
import type { WorldItem } from '@/types/entities/world-item';
import { WorldItemSortCriteria, WorldItemViewMode } from '@/types/entities/world-item/enums';
import { beforeEach, describe, expect, it, jest, vi } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

// 🧪 Mock de dependencias externas
vi.mock('@/lib/logger/client-logger', () => ({
  clientLogger: {
    withContext: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

vi.mock('@/services/toast.service', () => ({
  toastService: {
    system: {
      success: vi.fn(),
      error: vi.fn(),
    },
  },
}));

// 🎯 Mock de fetch API
global.fetch = vi.fn();

// 📊 Datos de prueba
const mockWorldItem: WorldItem = {
  id: 'wi_test_001',
  name: 'Excalibur',
  description: 'Legendary sword',
  emoji: '⚔️',
  color: '#FFD700',
  category: 'weapon',
  type: 'sword',
  rarity: 'legendary',
  size: 'medium',
  origin: 'mythical',
  attributes: '{"power": 100, "durability": 90}',
  effects: '{"blessing": {"name": "Divine Power", "value": 50}}',
  requirements: '{"level": {"name": "Level", "value": 50}}',
  stats: '{"power": 100, "weight": 5}',
  properties: '{"material": "Divine Steel", "enchanted": true}',
  filters: '{"category": ["weapon"], "rarity": ["legendary"]}',
  featuredImage: null,
  isFavorite: false,
  shortcut: 'EXC',
  sortBy: 'name_asc',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockWorldItems: WorldItem[] = [
  mockWorldItem,
  {
    ...mockWorldItem,
    id: 'wi_test_002',
    name: 'Health Potion',
    emoji: '🧪',
    category: 'consumable',
    type: 'potion',
    rarity: 'common',
    isFavorite: true,
  },
  {
    ...mockWorldItem,
    id: 'wi_test_003',
    name: 'Dragon Scale Armor',
    emoji: '🛡️',
    category: 'armor',
    type: 'chestplate',
    rarity: 'epic',
    isFavorite: false,
  },
];

describe('WorldItem Store', () => {
  beforeEach(() => {
    // 🔄 Reset store antes de cada test
    useWorldItemStore.setState({
      worldItems: [],
      ui: {
        selectedId: null,
        editingId: null,
        highlightedId: null,
        viewMode: WorldItemViewMode.LIST,
      },
      filters: {
        sortBy: WorldItemSortCriteria.NAME_ASC,
        searchTerm: '',
        category: null,
        rarity: null,
        type: null,
      },
      isLoading: false,
      error: null,
      viewMode: WorldItemViewMode.GRID,
      sortBy: 'name_asc',
      expandedIds: [],
      selectedIds: [],
      currentItemId: null,
      isCreatingItem: false,
      isEditingItem: false,
      isProcessingAction: false,
      searchQuery: '',
    });

    // 🔄 Reset fetch mock
    vi.clearAllMocks();
  });

  describe('📊 Estado Inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      const { result } = renderHook(() => useWorldItemStore());

      expect(result.current.worldItems).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.ui.selectedId).toBeNull();
      expect(result.current.ui.editingId).toBeNull();
      expect(result.current.ui.highlightedId).toBeNull();
      expect(result.current.ui.viewMode).toBe(WorldItemViewMode.LIST);
      expect(result.current.filters.sortBy).toBe(WorldItemSortCriteria.NAME_ASC);
      expect(result.current.filters.searchTerm).toBe('');
      expect(result.current.filters.category).toBeNull();
      expect(result.current.filters.rarity).toBeNull();
      expect(result.current.filters.type).toBeNull();
      expect(result.current.viewMode).toBe(WorldItemViewMode.GRID);
      expect(result.current.expandedIds).toEqual([]);
      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.currentItemId).toBeNull();
      expect(result.current.isCreatingItem).toBe(false);
      expect(result.current.isEditingItem).toBe(false);
      expect(result.current.isProcessingAction).toBe(false);
      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('🔄 Operaciones CRUD', () => {
    describe('📥 Carga de WorldItems', () => {
      it('debe cargar world items exitosamente', async () => {
        const { result } = renderHook(() => useWorldItemStore());

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockWorldItems,
        });

        await act(async () => {
          await result.current.loadWorldItems();
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/entities/world-items');
        expect(result.current.worldItems).toEqual(mockWorldItems);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      it('debe manejar errores en la carga', async () => {
        const { result } = renderHook(() => useWorldItemStore());

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await act(async () => {
          await result.current.loadWorldItems();
        });

        expect(result.current.worldItems).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Error al cargar objetos del mundo');
      });

      it('debe manejar respuesta HTTP no exitosa', async () => {
        const { result } = renderHook(() => useWorldItemStore());

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await act(async () => {
          await result.current.loadWorldItems();
        });

        expect(result.current.error).toBe('Error al cargar objetos del mundo');
      });
    });

    describe('➕ Creación de WorldItems', () => {
      it('debe crear un nuevo world item exitosamente', async () => {
        const { result } = renderHook(() => useWorldItemStore());
        const newItem = { name: 'New Item', category: 'misc' };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockWorldItem,
        });

        await act(async () => {
          await result.current.createWorldItem(newItem);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/entities/world-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        expect(result.current.worldItems).toContain(mockWorldItem);
      });

      it('debe manejar errores en la creación', async () => {
        const { result } = renderHook(() => useWorldItemStore());
        const newItem = { name: 'New Item' };

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Creation error'));

        await act(async () => {
          await result.current.createWorldItem(newItem);
        });

        expect(result.current.worldItems).toEqual([]);
      });
    });

    describe('✏️ Actualización de WorldItems', () => {
      it('debe actualizar un world item exitosamente', async () => {
        const { result } = renderHook(() => useWorldItemStore());

        // Configurar estado inicial
        act(() => {
          result.current.setWorldItems([mockWorldItem]);
        });

        const updateData = { name: 'Updated Excalibur' };
        const updatedItem = { ...mockWorldItem, ...updateData };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedItem,
        });

        await act(async () => {
          await result.current.updateWorldItem(mockWorldItem.id, updateData);
        });

        expect(global.fetch).toHaveBeenCalledWith(`/api/world-items/${mockWorldItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        const updated = result.current.worldItems.find(item => item.id === mockWorldItem.id);
        expect(updated?.name).toBe('Updated Excalibur');
      });

      it('debe manejar errores en la actualización', async () => {
        const { result } = renderHook(() => useWorldItemStore());

        act(() => {
          result.current.setWorldItems([mockWorldItem]);
        });

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Update error'));

        await act(async () => {
          await result.current.updateWorldItem(mockWorldItem.id, { name: 'Failed Update' });
        });

        // Verificar que el estado no cambió
        expect(result.current.worldItems[0].name).toBe('Excalibur');
      });
    });

    describe('🗑️ Eliminación de WorldItems', () => {
      it('debe eliminar un world item exitosamente', async () => {
        const { result } = renderHook(() => useWorldItemStore());

        act(() => {
          result.current.setWorldItems([mockWorldItem]);
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
        });

        await act(async () => {
          await result.current.deleteWorldItem(mockWorldItem.id);
        });

        expect(global.fetch).toHaveBeenCalledWith(`/api/world-items/${mockWorldItem.id}`, {
          method: 'DELETE',
        });

        expect(result.current.worldItems).toEqual([]);
      });

      it('debe manejar errores en la eliminación', async () => {
        const { result } = renderHook(() => useWorldItemStore());

        act(() => {
          result.current.setWorldItems([mockWorldItem]);
        });

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Delete error'));

        await act(async () => {
          await result.current.deleteWorldItem(mockWorldItem.id);
        });

        // Verificar que el item no fue eliminado
        expect(result.current.worldItems).toContain(mockWorldItem);
      });
    });
  });

  describe('🎯 Gestión de Estado UI', () => {
    it('debe gestionar selección de world items', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.selectWorldItem(mockWorldItem.id);
      });

      expect(result.current.ui.selectedId).toBe(mockWorldItem.id);

      act(() => {
        result.current.selectWorldItem(null);
      });

      expect(result.current.ui.selectedId).toBeNull();
    });

    it('debe gestionar edición de world items', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.startEditing(mockWorldItem.id);
      });

      expect(result.current.ui.editingId).toBe(mockWorldItem.id);

      act(() => {
        result.current.startEditing(null);
      });

      expect(result.current.ui.editingId).toBeNull();
    });

    it('debe gestionar highlighting de world items', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.highlightWorldItem(mockWorldItem.id);
      });

      expect(result.current.ui.highlightedId).toBe(mockWorldItem.id);
    });

    it('debe cambiar el modo de vista', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.setViewMode(WorldItemViewMode.GRID);
      });

      expect(result.current.ui.viewMode).toBe(WorldItemViewMode.GRID);

      act(() => {
        result.current.setViewMode(WorldItemViewMode.TABLE);
      });

      expect(result.current.ui.viewMode).toBe(WorldItemViewMode.TABLE);
    });

    it('debe gestionar estados de acción', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.setIsCreatingItem(true);
      });

      expect(result.current.isCreatingItem).toBe(true);

      act(() => {
        result.current.setIsEditingItem(true);
      });

      expect(result.current.isEditingItem).toBe(true);

      act(() => {
        result.current.setIsProcessingAction(true);
      });

      expect(result.current.isProcessingAction).toBe(true);
    });
  });

  describe('🔍 Sistema de Filtros', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useWorldItemStore());
      act(() => {
        result.current.setWorldItems(mockWorldItems);
      });
    });

    it('debe actualizar filtros correctamente', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({
          category: 'weapon',
          rarity: 'legendary',
          type: 'sword',
        });
      });

      expect(result.current.filters.category).toBe('weapon');
      expect(result.current.filters.rarity).toBe('legendary');
      expect(result.current.filters.type).toBe('sword');
    });

    it('debe limpiar filtros', () => {
      const { result } = renderHook(() => useWorldItemStore());

      // Primero configurar algunos filtros
      act(() => {
        result.current.updateFilters({
          category: 'weapon',
          rarity: 'legendary',
          searchTerm: 'excalibur',
        });
      });

      // Luego limpiarlos
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.category).toBeNull();
      expect(result.current.filters.rarity).toBeNull();
      expect(result.current.filters.type).toBeNull();
      expect(result.current.filters.searchTerm).toBe('');
      expect(result.current.filters.sortBy).toBe(WorldItemSortCriteria.NAME_ASC);
    });

    it('debe filtrar world items por búsqueda', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({ searchTerm: 'excalibur' });
      });

      const filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Excalibur');
    });

    it('debe filtrar world items por categoría', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({ category: 'weapon' });
      });

      const filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('weapon');
    });

    it('debe filtrar world items por rareza', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({ rarity: 'legendary' });
      });

      const filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].rarity).toBe('legendary');
    });

    it('debe filtrar world items por tipo', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({ type: 'potion' });
      });

      const filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('potion');
    });

    it('debe aplicar múltiples filtros simultáneamente', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({
          category: 'armor',
          rarity: 'epic',
          type: 'chestplate',
        });
      });

      const filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Dragon Scale Armor');
    });
  });

  describe('📋 Sistema de Ordenación', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useWorldItemStore());
      act(() => {
        result.current.setWorldItems(mockWorldItems);
      });
    });

    it('debe ordenar por nombre ascendente', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({ sortBy: WorldItemSortCriteria.NAME_ASC });
      });

      const sorted = result.current.getSortedWorldItems();
      expect(sorted[0].name).toBe('Dragon Scale Armor');
      expect(sorted[1].name).toBe('Excalibur');
      expect(sorted[2].name).toBe('Health Potion');
    });

    it('debe ordenar por nombre descendente', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({ sortBy: WorldItemSortCriteria.NAME_DESC });
      });

      const sorted = result.current.getSortedWorldItems();
      expect(sorted[0].name).toBe('Health Potion');
      expect(sorted[1].name).toBe('Excalibur');
      expect(sorted[2].name).toBe('Dragon Scale Armor');
    });

    it('debe ordenar por fecha de creación', () => {
      const { result } = renderHook(() => useWorldItemStore());

      const itemsWithDates = mockWorldItems.map((item, index) => ({
        ...item,
        createdAt: new Date(Date.now() + index * 1000 * 60 * 60 * 24), // Diferentes días
      }));

      act(() => {
        result.current.setWorldItems(itemsWithDates);
        result.current.updateFilters({ sortBy: WorldItemSortCriteria.CREATED_AT_ASC });
      });

      const sorted = result.current.getSortedWorldItems();
      expect(new Date(sorted[0].createdAt).getTime()).toBeLessThan(
        new Date(sorted[1].createdAt).getTime()
      );
    });

    it('debe ordenar por rareza', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.updateFilters({ sortBy: WorldItemSortCriteria.RARITY_ASC });
      });

      const sorted = result.current.getSortedWorldItems();
      // Orden alfabético: common, epic, legendary
      expect(sorted[0].rarity).toBe('common');
      expect(sorted[1].rarity).toBe('epic');
      expect(sorted[2].rarity).toBe('legendary');
    });
  });

  describe('🎯 Selectores', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useWorldItemStore());
      act(() => {
        result.current.setWorldItems(mockWorldItems);
      });
    });

    it('debe obtener world item por ID', () => {
      const { result } = renderHook(() => useWorldItemStore());

      const found = result.current.getWorldItemById(mockWorldItem.id);
      expect(found).toEqual(mockWorldItem);

      const notFound = result.current.getWorldItemById('non-existent');
      expect(notFound).toBeUndefined();
    });

    it('debe obtener world items filtrados', () => {
      const { result } = renderHook(() => useWorldItemStore());

      // Sin filtros, debe devolver todos
      let filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(3);

      // Con filtro de búsqueda
      act(() => {
        result.current.updateFilters({ searchTerm: 'potion' });
      });

      filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Health Potion');
    });

    it('debe obtener world items ordenados', () => {
      const { result } = renderHook(() => useWorldItemStore());

      const sorted = result.current.getSortedWorldItems();
      expect(sorted).toHaveLength(3);

      // Por defecto ordenado por nombre ascendente
      expect(sorted[0].name).toBe('Dragon Scale Armor');
      expect(sorted[1].name).toBe('Excalibur');
      expect(sorted[2].name).toBe('Health Potion');
    });
  });

  describe('🔄 Gestión de Selección', () => {
    it('debe gestionar selección múltiple', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.toggleSelected(mockWorldItem.id);
      });

      expect(result.current.selectedIds).toContain(mockWorldItem.id);

      act(() => {
        result.current.toggleSelected('wi_test_002');
      });

      expect(result.current.selectedIds).toContain('wi_test_002');
      expect(result.current.selectedIds).toHaveLength(2);

      // Deseleccionar
      act(() => {
        result.current.toggleSelected(mockWorldItem.id);
      });

      expect(result.current.selectedIds).not.toContain(mockWorldItem.id);
      expect(result.current.selectedIds).toHaveLength(1);
    });

    it('debe seleccionar múltiples items a la vez', () => {
      const { result } = renderHook(() => useWorldItemStore());

      const ids = ['wi_test_001', 'wi_test_002'];

      act(() => {
        result.current.selectItems(ids);
      });

      expect(result.current.selectedIds).toEqual(ids);
    });

    it('debe limpiar la selección', () => {
      const { result } = renderHook(() => useWorldItemStore());

      // Primero seleccionar algunos items
      act(() => {
        result.current.selectItems(['wi_test_001', 'wi_test_002']);
      });

      expect(result.current.selectedIds).toHaveLength(2);

      // Luego limpiar
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIds).toEqual([]);
    });
  });

  describe('🔧 Funcionalidades de Expansión', () => {
    it('debe gestionar items expandidos', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.toggleExpanded(mockWorldItem.id);
      });

      expect(result.current.expandedIds).toContain(mockWorldItem.id);

      act(() => {
        result.current.toggleExpanded(mockWorldItem.id);
      });

      expect(result.current.expandedIds).not.toContain(mockWorldItem.id);
    });
  });

  describe('🔍 Búsqueda', () => {
    it('debe actualizar query de búsqueda', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.setSearchQuery('dragon');
      });

      expect(result.current.searchQuery).toBe('dragon');
      expect(result.current.filters.searchQuery).toBe('dragon');
    });
  });

  describe('🧪 WorldItem API', () => {
    it('debe permitir operaciones a través del API', () => {
      // Configurar datos
      act(() => {
        worldItemApi.setWorldItems(mockWorldItems);
      });

      expect(useWorldItemStore.getState().worldItems).toEqual(mockWorldItems);

      // Agregar item
      const newItem = { ...mockWorldItem, id: 'wi_new', name: 'New Item' };
      act(() => {
        worldItemApi.addWorldItem(newItem);
      });

      expect(useWorldItemStore.getState().worldItems).toContain(newItem);

      // Obtener por ID
      const found = worldItemApi.getWorldItemById(mockWorldItem.id);
      expect(found).toEqual(mockWorldItem);

      // Configurar filtros
      act(() => {
        worldItemApi.setFilters({ category: 'weapon' });
      });

      expect(useWorldItemStore.getState().filters.category).toBe('weapon');

      // Limpiar selección
      act(() => {
        worldItemApi.clearSelection();
      });

      expect(useWorldItemStore.getState().selectedIds).toEqual([]);
    });
  });

  describe('⚡ Tests de Performance', () => {
    it('debe manejar grandes cantidades de world items', () => {
      const { result } = renderHook(() => useWorldItemStore());

      // Generar 1000 items
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        ...mockWorldItem,
        id: `wi_perf_${index}`,
        name: `Item ${index}`,
        category: index % 2 === 0 ? 'weapon' : 'consumable',
        rarity: index % 3 === 0 ? 'legendary' : index % 2 === 0 ? 'epic' : 'common',
      }));

      const startTime = Date.now();

      act(() => {
        result.current.setWorldItems(largeDataset);
      });

      const setTime = Date.now() - startTime;

      // Test de filtrado
      const filterStart = Date.now();

      act(() => {
        result.current.updateFilters({ category: 'weapon' });
      });

      const filtered = result.current.getFilteredWorldItems();
      const filterTime = Date.now() - filterStart;

      // Test de ordenación
      const sortStart = Date.now();
      const sorted = result.current.getSortedWorldItems();
      const sortTime = Date.now() - sortStart;

      // Verificaciones de performance (deben completarse en tiempo razonable)
      expect(setTime).toBeLessThan(100); // < 100ms para configurar 1000 items
      expect(filterTime).toBeLessThan(50); // < 50ms para filtrar
      expect(sortTime).toBeLessThan(100); // < 100ms para ordenar

      // Verificar correctitud
      expect(result.current.worldItems).toHaveLength(1000);
      expect(filtered.length).toBe(500); // La mitad son weapons
      expect(sorted).toHaveLength(1000);
    });

    it('debe optimizar múltiples operaciones de filtrado', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.setWorldItems(mockWorldItems);
      });

      const startTime = Date.now();

      // Múltiples operaciones de filtrado
      act(() => {
        result.current.updateFilters({ category: 'weapon' });
        result.current.updateFilters({ rarity: 'legendary' });
        result.current.updateFilters({ type: 'sword' });
        result.current.updateFilters({ searchTerm: 'excalibur' });
      });

      const endTime = Date.now() - startTime;

      expect(endTime).toBeLessThan(50); // Debe ser rápido

      const filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Excalibur');
    });
  });

  describe('🚨 Casos Edge', () => {
    it('debe manejar world items con datos malformados', () => {
      const { result } = renderHook(() => useWorldItemStore());

      const malformedItem = {
        ...mockWorldItem,
        id: 'wi_malformed',
        name: '', // Nombre vacío
        category: null, // Categoría nula
        rarity: undefined, // Rareza indefinida
        attributes: 'invalid-json', // JSON inválido
      } as any;

      act(() => {
        result.current.setWorldItems([malformedItem]);
      });

      expect(result.current.worldItems).toHaveLength(1);

      // Debe manejar filtros con datos malformados
      act(() => {
        result.current.updateFilters({ searchTerm: 'malformed' });
      });

      const filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(0); // No debe hacer match con nombre vacío
    });

    it('debe manejar operaciones con IDs inexistentes', () => {
      const { result } = renderHook(() => useWorldItemStore());

      // Intentar obtener item inexistente
      const notFound = result.current.getWorldItemById('non-existent-id');
      expect(notFound).toBeUndefined();

      // Intentar seleccionar item inexistente
      act(() => {
        result.current.selectWorldItem('non-existent-id');
      });

      expect(result.current.ui.selectedId).toBe('non-existent-id'); // Debería permitirlo

      // Intentar expandir item inexistente
      act(() => {
        result.current.toggleExpanded('non-existent-id');
      });

      expect(result.current.expandedIds).toContain('non-existent-id');
    });

    it('debe manejar filtros con valores especiales', () => {
      const { result } = renderHook(() => useWorldItemStore());

      act(() => {
        result.current.setWorldItems(mockWorldItems);
      });

      // Filtro con string vacío
      act(() => {
        result.current.updateFilters({ searchTerm: '' });
      });

      let filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(3); // Todos los items

      // Filtro con caracteres especiales
      act(() => {
        result.current.updateFilters({ searchTerm: '⚔️' });
      });

      filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(0); // Los emojis no están en el nombre

      // Filtro case-insensitive
      act(() => {
        result.current.updateFilters({ searchTerm: 'EXCALIBUR' });
      });

      filtered = result.current.getFilteredWorldItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Excalibur');
    });

    it('debe resetear store correctamente', () => {
      const { result } = renderHook(() => useWorldItemStore());

      // Configurar estado con datos
      act(() => {
        result.current.setWorldItems(mockWorldItems);
        result.current.selectWorldItem(mockWorldItem.id);
        result.current.updateFilters({ category: 'weapon' });
        result.current.setIsCreatingItem(true);
      });

      // Verificar que tiene datos
      expect(result.current.worldItems).toHaveLength(3);
      expect(result.current.ui.selectedId).toBe(mockWorldItem.id);
      expect(result.current.filters.category).toBe('weapon');

      // Reset usando API
      act(() => {
        worldItemApi.resetStore();
      });

      // Verificar reset (solo datos core, no UI)
      expect(result.current.worldItems).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      // UI state se mantiene en este store
      expect(result.current.isCreatingItem).toBe(true);
    });
  });
});
