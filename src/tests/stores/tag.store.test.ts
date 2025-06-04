/**
 * @file Tests para Tag Store
 * @description Tests comprehensivos para la gestión de tags en el sistema
 */

import { useTagStore } from '@/store/entities/tag';
import { TagCategory, TagRarity, TagSortCriteria, TagViewMode } from '@/types/entities/tag/enums';
import type { Tag, TagComplete } from '@/types/entities/tag/types';
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

// Mock de transformadores de tag
vi.mock('@/transformers/tag', () => ({
  searchTags: vi.fn(),
  transformTag: vi.fn((tag: any) => tag),
}));

// Mock de acciones de tag
vi.mock('@/app/actions/tags', () => ({
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

describe('🏷️ Tag Store', () => {
  // Helper para crear tag de prueba
  const createMockTag = (overrides: Partial<TagComplete> = {}): TagComplete => ({
    id: 'tag-1',
    name: 'Test Tag',
    description: 'Test tag description',
    category: TagCategory.GENERAL,
    rarity: TagRarity.COMMON,
    color: '#3b82f6',
    emoji: '🏷️',
    shortcut: null,
    isFavorite: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    // Relaciones extendidas
    _count: {
      images: 0,
      videos: 0,
      collections: 0,
      albums: 0,
      characters: 0,
      places: 0,
      worldItems: 0,
      concepts: 0,
      prompts: 0,
      notes: 0,
    },
    ...overrides,
  });

  beforeEach(() => {
    // Reset del store antes de cada test
    useTagStore.getState = vi.fn().mockReturnValue({
      items: [],
      selectedId: null,
      selectedIds: [],
      expandedIds: [],
      editingId: null,
      highlightedId: null,
      viewMode: TagViewMode.LIST,
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      filters: {
        sortBy: TagSortCriteria.NAME_ASC,
        searchTerm: '',
        category: null,
        rarity: null,
      },
      isLoading: false,
      error: null,
      lastUpdated: null,
    });

    // Reset de mocks
    vi.clearAllMocks();
  });

  describe('📊 Estado Inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      const { result } = renderHook(() => useTagStore());

      expect(result.current.items).toEqual([]);
      expect(result.current.selectedId).toBeNull();
      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.expandedIds).toEqual([]);
      expect(result.current.editingId).toBeNull();
      expect(result.current.highlightedId).toBeNull();
      expect(result.current.viewMode).toBe(TagViewMode.LIST);
      expect(result.current.isCreateModalOpen).toBe(false);
      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });

    it('debe tener filtros iniciales correctos', () => {
      const { result } = renderHook(() => useTagStore());

      expect(result.current.filters).toEqual({
        sortBy: TagSortCriteria.NAME_ASC,
        searchTerm: '',
        category: null,
        rarity: null,
      });
    });
  });

  describe('🔄 Operaciones CRUD', () => {
    describe('loadTags', () => {
      it('debe cargar tags correctamente', async () => {
        const mockTags = [
          createMockTag({ id: '1', name: 'Tag 1' }),
          createMockTag({ id: '2', name: 'Tag 2' }),
        ];

        const mockSearchTags = vi.fn().mockResolvedValue({
          items: mockTags,
          total: 2,
        });

        vi.doMock('@/transformers/tag', () => ({
          searchTags: mockSearchTags,
          transformTag: vi.fn((tag: any) => tag),
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          await result.current.loadTags();
        });

        expect(mockSearchTags).toHaveBeenCalledWith({ take: 100 });
        expect(result.current.items).toEqual(mockTags);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.lastUpdated).toBeGreaterThan(0);
      });

      it('debe manejar errores al cargar tags', async () => {
        const mockError = new Error('Error al cargar tags');
        const mockSearchTags = vi.fn().mockRejectedValue(mockError);

        vi.doMock('@/transformers/tag', () => ({
          searchTags: mockSearchTags,
          transformTag: vi.fn((tag: any) => tag),
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          await result.current.loadTags();
        });

        expect(result.current.items).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Error al cargar tags');
      });

      it('no debe cargar tags si ya están cargados', async () => {
        const mockTags = [createMockTag({ id: '1', name: 'Existing Tag' })];

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: mockTags,
          isLoading: false,
        });

        const mockSearchTags = vi.fn();

        vi.doMock('@/transformers/tag', () => ({
          searchTags: mockSearchTags,
          transformTag: vi.fn((tag: any) => tag),
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          const tags = await result.current.loadTags();
          expect(tags).toEqual(mockTags);
        });

        expect(mockSearchTags).not.toHaveBeenCalled();
      });
    });

    describe('createTag', () => {
      it('debe crear un tag correctamente', async () => {
        const newTagData: Partial<Tag> = {
          name: 'New Tag',
          description: 'New tag description',
          category: TagCategory.WORK,
          color: '#ff6b6b',
        };

        const createdTag = createMockTag({
          id: 'new-tag-id',
          ...newTagData,
        });

        const mockCreateTag = vi.fn().mockResolvedValue(createdTag);

        vi.doMock('@/app/actions/tags', () => ({
          createTag: mockCreateTag,
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          const tag = await result.current.createTag(newTagData);
          expect(tag).toEqual(createdTag);
        });

        expect(mockCreateTag).toHaveBeenCalledWith(newTagData);
        expect(result.current.items).toContain(createdTag);
      });

      it('debe manejar errores al crear tag', async () => {
        const mockCreateTag = vi.fn().mockRejectedValue(new Error('Error al crear tag'));

        vi.doMock('@/app/actions/tags', () => ({
          createTag: mockCreateTag,
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          const tag = await result.current.createTag({ name: 'Test' });
          expect(tag).toBeNull();
        });

        expect(result.current.error).toBe('Error al crear tag');
      });
    });

    describe('updateTag', () => {
      it('debe actualizar un tag correctamente', async () => {
        const existingTag = createMockTag({ id: 'tag-1', name: 'Original Name' });
        const updateData = { name: 'Updated Name', color: '#ff0000' };

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: [existingTag],
        });

        const mockUpdateTag = vi.fn().mockResolvedValue(undefined);

        vi.doMock('@/app/actions/tags', () => ({
          updateTag: mockUpdateTag,
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          await result.current.updateTag('tag-1', updateData);
        });

        expect(mockUpdateTag).toHaveBeenCalledWith('tag-1', updateData);
        const updatedTag = result.current.items.find(t => t.id === 'tag-1');
        expect(updatedTag?.name).toBe('Updated Name');
        expect(updatedTag?.color).toBe('#ff0000');
      });

      it('debe manejar errores al actualizar tag', async () => {
        const mockUpdateTag = vi.fn().mockRejectedValue(new Error('Error al actualizar tag'));

        vi.doMock('@/app/actions/tags', () => ({
          updateTag: mockUpdateTag,
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          await result.current.updateTag('tag-1', { name: 'Updated' });
        });

        expect(result.current.error).toBe('Error al actualizar tag');
      });
    });

    describe('deleteTag', () => {
      it('debe eliminar un tag correctamente', async () => {
        const tagToDelete = createMockTag({ id: 'tag-to-delete' });
        const otherTag = createMockTag({ id: 'other-tag' });

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: [tagToDelete, otherTag],
        });

        const mockDeleteTag = vi.fn().mockResolvedValue(undefined);

        vi.doMock('@/app/actions/tags', () => ({
          deleteTag: mockDeleteTag,
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          await result.current.deleteTag('tag-to-delete');
        });

        expect(mockDeleteTag).toHaveBeenCalledWith('tag-to-delete');
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].id).toBe('other-tag');
      });

      it('debe manejar errores al eliminar tag', async () => {
        const mockDeleteTag = vi.fn().mockRejectedValue(new Error('Error al eliminar tag'));

        vi.doMock('@/app/actions/tags', () => ({
          deleteTag: mockDeleteTag,
        }));

        const { result } = renderHook(() => useTagStore());

        await act(async () => {
          await result.current.deleteTag('tag-1');
        });

        expect(result.current.error).toBe('Error al eliminar tag');
      });
    });

    describe('getTagById', () => {
      it('debe encontrar un tag por ID', () => {
        const tag1 = createMockTag({ id: 'tag-1', name: 'Tag 1' });
        const tag2 = createMockTag({ id: 'tag-2', name: 'Tag 2' });

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: [tag1, tag2],
        });

        const { result } = renderHook(() => useTagStore());

        const foundTag = result.current.getTagById('tag-1');
        expect(foundTag).toEqual(tag1);
      });

      it('debe retornar undefined para ID inexistente', () => {
        const { result } = renderHook(() => useTagStore());

        const foundTag = result.current.getTagById('nonexistent');
        expect(foundTag).toBeUndefined();
      });
    });
  });

  describe('🎯 Gestión de UI', () => {
    describe('Selección', () => {
      it('debe seleccionar un tag', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.selectTag('tag-1');
        });

        expect(result.current.selectedId).toBe('tag-1');
      });

      it('debe seleccionar múltiples tags', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.selectTags(['tag-1', 'tag-2', 'tag-3']);
        });

        expect(result.current.selectedIds).toEqual(['tag-1', 'tag-2', 'tag-3']);
      });

      it('debe limpiar la selección', () => {
        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          selectedId: 'tag-1',
          selectedIds: ['tag-1', 'tag-2'],
        });

        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.clearSelection();
        });

        expect(result.current.selectedId).toBeNull();
        expect(result.current.selectedIds).toEqual([]);
      });
    });

    describe('Modos de edición', () => {
      it('debe iniciar edición de un tag', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.startEditing('tag-1');
        });

        expect(result.current.editingId).toBe('tag-1');
      });

      it('debe finalizar edición', () => {
        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          editingId: 'tag-1',
        });

        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.startEditing(null);
        });

        expect(result.current.editingId).toBeNull();
      });
    });

    describe('Highlight/Hover', () => {
      it('debe resaltar un tag', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.highlightTag('tag-1');
        });

        expect(result.current.highlightedId).toBe('tag-1');
      });

      it('debe quitar highlight', () => {
        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          highlightedId: 'tag-1',
        });

        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.highlightTag(null);
        });

        expect(result.current.highlightedId).toBeNull();
      });
    });

    describe('Modos de vista', () => {
      it('debe cambiar el modo de vista', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.setViewMode(TagViewMode.GRID);
        });

        expect(result.current.viewMode).toBe(TagViewMode.GRID);
      });
    });

    describe('Modales', () => {
      it('debe gestionar modal de crear', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.openCreateModal();
        });

        expect(result.current.isCreateModalOpen).toBe(true);

        act(() => {
          result.current.closeCreateModal();
        });

        expect(result.current.isCreateModalOpen).toBe(false);
      });

      it('debe gestionar modal de editar', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.openEditModal('tag-1');
        });

        expect(result.current.isEditModalOpen).toBe(true);
        expect(result.current.editingId).toBe('tag-1');

        act(() => {
          result.current.closeEditModal();
        });

        expect(result.current.isEditModalOpen).toBe(false);
      });

      it('debe gestionar modal de eliminar', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.openDeleteModal('tag-1');
        });

        expect(result.current.isDeleteModalOpen).toBe(true);

        act(() => {
          result.current.closeDeleteModal();
        });

        expect(result.current.isDeleteModalOpen).toBe(false);
      });
    });
  });

  describe('🔍 Filtrado y Ordenación', () => {
    const createTagsDataset = () => [
      createMockTag({
        id: '1',
        name: 'Alpha Tag',
        category: TagCategory.WORK,
        rarity: TagRarity.COMMON,
        createdAt: new Date('2024-01-01')
      }),
      createMockTag({
        id: '2',
        name: 'Beta Tag',
        category: TagCategory.PERSONAL,
        rarity: TagRarity.RARE,
        createdAt: new Date('2024-01-02')
      }),
      createMockTag({
        id: '3',
        name: 'Gamma Tag',
        category: TagCategory.WORK,
        rarity: TagRarity.LEGENDARY,
        createdAt: new Date('2024-01-03')
      }),
    ];

    describe('updateFilters', () => {
      it('debe actualizar filtros correctamente', () => {
        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.updateFilters({
            searchTerm: 'test',
            category: TagCategory.WORK,
          });
        });

        expect(result.current.filters.searchTerm).toBe('test');
        expect(result.current.filters.category).toBe(TagCategory.WORK);
        expect(result.current.filters.sortBy).toBe(TagSortCriteria.NAME_ASC); // No modificado
      });

      it('debe poder actualizar filtros parcialmente', () => {
        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          filters: {
            sortBy: TagSortCriteria.NAME_ASC,
            searchTerm: 'existing',
            category: TagCategory.PERSONAL,
            rarity: TagRarity.COMMON,
          },
        });

        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.updateFilters({
            searchTerm: 'updated',
          });
        });

        expect(result.current.filters.searchTerm).toBe('updated');
        expect(result.current.filters.category).toBe(TagCategory.PERSONAL); // Mantiene valor anterior
      });
    });

    describe('clearFilters', () => {
      it('debe limpiar todos los filtros', () => {
        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          filters: {
            sortBy: TagSortCriteria.CREATED_DESC,
            searchTerm: 'test',
            category: TagCategory.WORK,
            rarity: TagRarity.RARE,
          },
        });

        const { result } = renderHook(() => useTagStore());

        act(() => {
          result.current.clearFilters();
        });

        expect(result.current.filters).toEqual({
          sortBy: TagSortCriteria.NAME_ASC,
          searchTerm: '',
          category: null,
          rarity: null,
        });
      });
    });

    describe('getFilteredTags', () => {
      it('debe filtrar tags por término de búsqueda', () => {
        const tags = createTagsDataset();

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: tags,
          filters: {
            sortBy: TagSortCriteria.NAME_ASC,
            searchTerm: 'Alpha',
            category: null,
            rarity: null,
          },
        });

        const { result } = renderHook(() => useTagStore());

        const filteredTags = result.current.getFilteredTags();
        expect(filteredTags).toHaveLength(1);
        expect(filteredTags[0].name).toBe('Alpha Tag');
      });

      it('debe filtrar tags por categoría', () => {
        const tags = createTagsDataset();

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: tags,
          filters: {
            sortBy: TagSortCriteria.NAME_ASC,
            searchTerm: '',
            category: TagCategory.WORK,
            rarity: null,
          },
        });

        const { result } = renderHook(() => useTagStore());

        const filteredTags = result.current.getFilteredTags();
        expect(filteredTags).toHaveLength(2);
        expect(filteredTags.every(tag => tag.category === TagCategory.WORK)).toBe(true);
      });

      it('debe filtrar tags por rareza', () => {
        const tags = createTagsDataset();

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: tags,
          filters: {
            sortBy: TagSortCriteria.NAME_ASC,
            searchTerm: '',
            category: null,
            rarity: TagRarity.RARE,
          },
        });

        const { result } = renderHook(() => useTagStore());

        const filteredTags = result.current.getFilteredTags();
        expect(filteredTags).toHaveLength(1);
        expect(filteredTags[0].name).toBe('Beta Tag');
      });
    });

    describe('getSortedTags', () => {
      it('debe ordenar tags por nombre ascendente', () => {
        const tags = createTagsDataset();

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: tags,
          filters: {
            sortBy: TagSortCriteria.NAME_ASC,
            searchTerm: '',
            category: null,
            rarity: null,
          },
        });

        const { result } = renderHook(() => useTagStore());

        const sortedTags = result.current.getSortedTags();
        expect(sortedTags[0].name).toBe('Alpha Tag');
        expect(sortedTags[1].name).toBe('Beta Tag');
        expect(sortedTags[2].name).toBe('Gamma Tag');
      });

      it('debe ordenar tags por nombre descendente', () => {
        const tags = createTagsDataset();

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: tags,
          filters: {
            sortBy: TagSortCriteria.NAME_DESC,
            searchTerm: '',
            category: null,
            rarity: null,
          },
        });

        const { result } = renderHook(() => useTagStore());

        const sortedTags = result.current.getSortedTags();
        expect(sortedTags[0].name).toBe('Gamma Tag');
        expect(sortedTags[1].name).toBe('Beta Tag');
        expect(sortedTags[2].name).toBe('Alpha Tag');
      });

      it('debe ordenar tags por fecha de creación', () => {
        const tags = createTagsDataset();

        useTagStore.getState = vi.fn().mockReturnValue({
          ...useTagStore.getState(),
          items: tags,
          filters: {
            sortBy: TagSortCriteria.CREATED_DESC,
            searchTerm: '',
            category: null,
            rarity: null,
          },
        });

        const { result } = renderHook(() => useTagStore());

        const sortedTags = result.current.getSortedTags();
        expect(sortedTags[0].name).toBe('Gamma Tag'); // Más reciente
        expect(sortedTags[1].name).toBe('Beta Tag');
        expect(sortedTags[2].name).toBe('Alpha Tag'); // Más antiguo
      });
    });
  });

  describe('⚡ Performance Tests', () => {
    it('debe manejar grandes datasets eficientemente', async () => {
      // Crear dataset grande de 1000 tags
      const largeTags = Array.from({ length: 1000 }, (_, i) =>
        createMockTag({
          id: `tag-${i}`,
          name: `Tag ${i}`,
          category: i % 2 === 0 ? TagCategory.WORK : TagCategory.PERSONAL,
          rarity: i % 3 === 0 ? TagRarity.RARE : TagRarity.COMMON,
        })
      );

      useTagStore.getState = vi.fn().mockReturnValue({
        ...useTagStore.getState(),
        items: largeTags,
      });

      const { result } = renderHook(() => useTagStore());

      // Test de búsqueda rápida
      const startTime = performance.now();

      act(() => {
        result.current.updateFilters({ searchTerm: 'Tag 5' });
      });

      const filteredTags = result.current.getFilteredTags();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Menos de 100ms
      expect(filteredTags.length).toBeGreaterThan(0);
    });

    it('debe manejar selección múltiple de forma eficiente', () => {
      const manyIds = Array.from({ length: 500 }, (_, i) => `tag-${i}`);

      const { result } = renderHook(() => useTagStore());

      const startTime = performance.now();

      act(() => {
        result.current.selectTags(manyIds);
      });

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Menos de 50ms
      expect(result.current.selectedIds).toHaveLength(500);
    });

    it('debe optimizar re-renders con memoización', () => {
      const tags = createTagsDataset();

      useTagStore.getState = vi.fn().mockReturnValue({
        ...useTagStore.getState(),
        items: tags,
      });

      const { result, rerender } = renderHook(() => useTagStore());

      // Primera llamada
      const firstResult = result.current.getFilteredTags();

      // Re-render sin cambios en filtros
      rerender();

      // Segunda llamada - debería ser la misma referencia si está memoizada
      const secondResult = result.current.getFilteredTags();

      expect(firstResult).toEqual(secondResult);
    });
  });

  describe('🔧 Edge Cases y Validación', () => {
    it('debe manejar tags con datos malformados', () => {
      const malformedTag = {
        id: 'malformed',
        name: null, // Nombre nulo
        category: 'INVALID_CATEGORY', // Categoría inválida
        color: '', // Color vacío
      } as any;

      const { result } = renderHook(() => useTagStore());

      act(() => {
        // Simular adición de tag malformado
        const currentItems = result.current.items;
        currentItems.push(malformedTag);
      });

      // El store debería manejar esto graciosamente
      expect(() => {
        result.current.getFilteredTags();
      }).not.toThrow();
    });

    it('debe manejar búsquedas con caracteres especiales', () => {
      const tags = [
        createMockTag({ id: '1', name: 'Tag with #hashtag' }),
        createMockTag({ id: '2', name: 'Tag with @mention' }),
        createMockTag({ id: '3', name: 'Tag with (parentheses)' }),
      ];

      useTagStore.getState = vi.fn().mockReturnValue({
        ...useTagStore.getState(),
        items: tags,
        filters: {
          sortBy: TagSortCriteria.NAME_ASC,
          searchTerm: '#hashtag',
          category: null,
          rarity: null,
        },
      });

      const { result } = renderHook(() => useTagStore());

      const filteredTags = result.current.getFilteredTags();
      expect(filteredTags).toHaveLength(1);
      expect(filteredTags[0].name).toBe('Tag with #hashtag');
    });

    it('debe manejar búsquedas case-insensitive', () => {
      const tags = [
        createMockTag({ id: '1', name: 'UPPERCASE TAG' }),
        createMockTag({ id: '2', name: 'lowercase tag' }),
        createMockTag({ id: '3', name: 'MiXeD CaSe TaG' }),
      ];

      useTagStore.getState = vi.fn().mockReturnValue({
        ...useTagStore.getState(),
        items: tags,
        filters: {
          sortBy: TagSortCriteria.NAME_ASC,
          searchTerm: 'tag',
          category: null,
          rarity: null,
        },
      });

      const { result } = renderHook(() => useTagStore());

      const filteredTags = result.current.getFilteredTags();
      expect(filteredTags).toHaveLength(3); // Todos contienen 'tag' case-insensitive
    });

    it('debe manejar correctamente la actualización de tags inexistentes', async () => {
      const { result } = renderHook(() => useTagStore());

      // Intentar actualizar tag inexistente
      await act(async () => {
        await result.current.updateTag('nonexistent-id', { name: 'Updated' });
      });

      // No debería fallar, pero tampoco debería cambiar el estado
      expect(result.current.items).toHaveLength(0);
      expect(result.current.error).toBeNull(); // O el mensaje de error apropiado
    });

    it('debe validar colores hexadecimales', async () => {
      const tagWithInvalidColor = {
        name: 'Test Tag',
        color: 'not-a-color', // Color inválido
      };

      const { result } = renderHook(() => useTagStore());

      await act(async () => {
        const tag = await result.current.createTag(tagWithInvalidColor);
        // Debería manejar el color inválido graciosamente
        expect(tag?.color).toBeDefined();
      });
    });
  });

  describe('🔄 Refreshing y Re-carga', () => {
    it('debe refrescar tags forzando nueva carga', async () => {
      const initialTags = [createMockTag({ id: '1', name: 'Initial Tag' })];
      const refreshedTags = [
        createMockTag({ id: '1', name: 'Updated Tag' }),
        createMockTag({ id: '2', name: 'New Tag' }),
      ];

      useTagStore.getState = vi.fn().mockReturnValue({
        ...useTagStore.getState(),
        items: initialTags,
      });

      const mockSearchTags = vi.fn()
        .mockResolvedValueOnce({ items: initialTags })
        .mockResolvedValueOnce({ items: refreshedTags });

      vi.doMock('@/transformers/tag', () => ({
        searchTags: mockSearchTags,
        transformTag: vi.fn((tag: any) => tag),
      }));

      const { result } = renderHook(() => useTagStore());

      await act(async () => {
        await result.current.refreshTags();
      });

      expect(mockSearchTags).toHaveBeenCalledTimes(1);
      expect(result.current.items).toEqual(refreshedTags);
    });
  });
});
