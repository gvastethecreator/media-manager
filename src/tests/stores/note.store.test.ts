/**
 * @file Tests completos para NoteStore
 * @module tests/stores/note.store.test
 * @description Pruebas unitarias comprehensivas para el store de Note
 */

import { useNoteStore } from '@/store/entities/note/store';
import type { EntityType } from '@/types/entities/entities';
import type { NoteBase, NoteCreateInput, NoteFilters, NoteUpdateInput, NoteWithStats } from '@/types/entities/note';
import { NoteSortOption, NoteViewMode } from '@/types/entities/note/enums';

// 🧪 Mock del logger para evitar logs durante las pruebas
jest.mock('@/lib/logger/client-logger', () => ({
	clientLogger: {
		withContext: jest.fn(() => ({
			info: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
		})),
	},
}));

// 🎭 Mock del transformer para datos consistentes
jest.mock('@/transformers/note/transformer', () => ({
	transformNoteToWithStats: jest.fn((note: NoteBase): NoteWithStats => ({
		...note,
		lastUpdated: new Date(),
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		tagCount: 0,
		characterCount: 0,
		conceptCount: 0,
		importanceLevel: 1,
		contentLength: note.content?.length || 0,
		relatedItemsCount: 0,
		distribution: [],
	})),
}));

// 🎯 Mock de los API calls para simulación controlada
const mockApiCalls = {
	getNotes: jest.fn(),
	createNote: jest.fn(),
	updateNote: jest.fn(),
	deleteNote: jest.fn(),
	addNoteToEntity: jest.fn(),
	removeNoteFromEntity: jest.fn(),
};

jest.mock('@/store/entities/note/slices/core', () => ({
	createCoreSlice: jest.fn((...args) => {
		const [set, get] = args;
		return {
			// Estado inicial
			notes: [],
			selectedNote: null,
			isLoading: false,
			error: null,

			// Acciones mock
			loadNotes: jest.fn(async () => {
				try {
					set({ isLoading: true, error: null });
					const notes = await mockApiCalls.getNotes();
					const transformedNotes = notes.map((n: NoteBase) => ({
						...n,
						lastUpdated: new Date(),
						imageCount: 0,
						videoCount: 0,
						albumCount: 0,
						tagCount: 0,
						characterCount: 0,
						conceptCount: 0,
						importanceLevel: 1,
						contentLength: n.content?.length || 0,
						relatedItemsCount: 0,
						distribution: [],
					}));
					set({ notes: transformedNotes, isLoading: false });
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al cargar notas';
					set({ error: message, isLoading: false });
				}
			}),

			setNotes: jest.fn((notes: NoteWithStats[]) => {
				set({ notes, isLoading: false });
			}),

			createNote: jest.fn(async (note: NoteCreateInput) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.createNote(note);
					const current = get();
					await current.loadNotes();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al crear nota';
					set({ error: message, isLoading: false });
				}
			}),

			updateNote: jest.fn(async (id: string, note: NoteUpdateInput) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.updateNote(id, note);
					const current = get();
					await current.loadNotes();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al actualizar nota';
					set({ error: message, isLoading: false });
				}
			}),

			deleteNote: jest.fn(async (id: string) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.deleteNote(id);
					const current = get();
					await current.loadNotes();
					// Si la nota seleccionada es la que se eliminó, deseleccionarla
					if (current.selectedNote?.id === id) {
						set({ selectedNote: null });
					}
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al eliminar nota';
					set({ error: message, isLoading: false });
				}
			}),

			selectNote: jest.fn((note: NoteBase | null) => {
				set({ selectedNote: note });
			}),

			reset: jest.fn(() => {
				set({
					notes: [],
					selectedNote: null,
					isLoading: false,
					error: null,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/note/slices/filters', () => ({
	createFiltersSlice: jest.fn((...args) => {
		const [set] = args;
		return {
			// Estado inicial
			filters: {
				search: '',
				category: undefined,
				status: undefined,
				priority: undefined,
				tags: [],
				onlyFavorites: false,
			},
			sortBy: 'updated_desc' as NoteSortOption,
			page: 1,
			pageSize: 20,

			// Acciones mock
			setFilters: jest.fn((newFilters: Partial<NoteFilters>) => {
				set((state: any) => ({
					filters: { ...state.filters, ...newFilters },
					page: 1, // Reset página al cambiar filtros
				}));
			}),

			setSortBy: jest.fn((sortBy: NoteSortOption) => {
				set({ sortBy, page: 1 });
			}),

			setPage: jest.fn((page: number) => {
				set({ page });
			}),

			setPageSize: jest.fn((pageSize: number) => {
				set({ pageSize, page: 1 });
			}),

			setCategoryFilter: jest.fn((category: string | null) => {
				set((state: any) => ({
					filters: { ...state.filters, category },
					page: 1,
				}));
			}),

			setStatusFilter: jest.fn((status: string | null) => {
				set((state: any) => ({
					filters: { ...state.filters, status },
					page: 1,
				}));
			}),

			setPriorityFilter: jest.fn((priority: number | null) => {
				set((state: any) => ({
					filters: { ...state.filters, priority },
					page: 1,
				}));
			}),

			setSearchFilter: jest.fn((search: string) => {
				set((state: any) => ({
					filters: { ...state.filters, search },
					page: 1,
				}));
			}),

			setTagsFilter: jest.fn((tags: string[]) => {
				set((state: any) => ({
					filters: { ...state.filters, tags },
					page: 1,
				}));
			}),

			setOnlyFavoritesFilter: jest.fn((onlyFavorites: boolean) => {
				set((state: any) => ({
					filters: { ...state.filters, onlyFavorites },
					page: 1,
				}));
			}),

			clearFilters: jest.fn(() => {
				set({
					filters: {
						search: '',
						category: undefined,
						status: undefined,
						priority: undefined,
						tags: [],
						onlyFavorites: false,
					},
					sortBy: 'updated_desc' as NoteSortOption,
					page: 1,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/note/slices/ui', () => ({
	createUISlice: jest.fn((...args) => {
		const [set] = args;
		return {
			// Estado inicial
			isCreateModalOpen: false,
			isEditModalOpen: false,
			isDeleteDialogOpen: false,
			isDetailsDrawerOpen: false,
			viewMode: NoteViewMode.GRID,

			// Acciones mock
			openCreateModal: jest.fn(() => set({ isCreateModalOpen: true })),
			closeCreateModal: jest.fn(() => set({ isCreateModalOpen: false })),
			openEditModal: jest.fn(() => set({ isEditModalOpen: true })),
			closeEditModal: jest.fn(() => set({ isEditModalOpen: false })),
			openDeleteDialog: jest.fn(() => set({ isDeleteDialogOpen: true })),
			closeDeleteDialog: jest.fn(() => set({ isDeleteDialogOpen: false })),
			openDetailsDrawer: jest.fn(() => set({ isDetailsDrawerOpen: true })),
			closeDetailsDrawer: jest.fn(() => set({ isDetailsDrawerOpen: false })),
			setViewMode: jest.fn((mode: NoteViewMode) => set({ viewMode: mode })),
			resetUI: jest.fn(() => {
				set({
					isCreateModalOpen: false,
					isEditModalOpen: false,
					isDeleteDialogOpen: false,
					isDetailsDrawerOpen: false,
					viewMode: NoteViewMode.GRID,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/note/slices/selection', () => ({
	createSelectionSlice: jest.fn((...args) => {
		const [set, get] = args;
		return {
			// Estado inicial
			selectedNoteId: null,
			selectedNoteIds: [],
			isMultiSelectMode: false,

			// Acciones mock
			selectNote: jest.fn((id: string) => {
				set({ selectedNoteId: id });
			}),

			unselectNote: jest.fn(() => {
				set({ selectedNoteId: null });
			}),

			toggleMultiSelectMode: jest.fn(() => {
				set((state: any) => ({
					isMultiSelectMode: !state.isMultiSelectMode,
					selectedNoteIds: state.isMultiSelectMode ? [] : state.selectedNoteIds,
				}));
			}),

			toggleNoteSelection: jest.fn((id: string) => {
				set((state: any) => {
					const isSelected = state.selectedNoteIds.includes(id);
					return {
						selectedNoteIds: isSelected
							? state.selectedNoteIds.filter((noteId: string) => noteId !== id)
							: [...state.selectedNoteIds, id],
					};
				});
			}),

			selectAllNotes: jest.fn(() => {
				const current = get();
				const allIds = current.notes.map((note: NoteWithStats) => note.id);
				set({ selectedNoteIds: allIds, isMultiSelectMode: true });
			}),

			clearSelection: jest.fn(() => {
				set({ selectedNoteIds: [], selectedNoteId: null });
			}),

			resetSelection: jest.fn(() => {
				set({
					selectedNoteId: null,
					selectedNoteIds: [],
					isMultiSelectMode: false,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/note/slices/relations', () => ({
	createRelationsSlice: jest.fn((...args) => {
		const [set, get] = args;
		return {
			// Acciones mock para relaciones
			addNoteToEntity: jest.fn(async (noteId: string, entityId: string, entityType: EntityType) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.addNoteToEntity(noteId, entityId, entityType);
					const current = get();
					await current.loadNotes();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al añadir nota a entidad';
					set({ error: message, isLoading: false });
				}
			}),

			removeNoteFromEntity: jest.fn(async (noteId: string, entityId: string, entityType: EntityType) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.removeNoteFromEntity(noteId, entityId, entityType);
					const current = get();
					await current.loadNotes();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al eliminar nota de entidad';
					set({ error: message, isLoading: false });
				}
			}),
		};
	}),
}));

// 📝 Datos de prueba
const createMockNote = (id = 'note_1'): NoteWithStats => ({
	id,
	title: `Test Note ${id}`,
	content: 'Test content for note',
	category: 'general',
	priority: 1,
	status: 'draft',
	tags: '{"items": ["tag1", "tag2"]}',
	featuredImage: null,
	isFavorite: false,
	presetId: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	lastUpdated: new Date(),
	imageCount: 0,
	videoCount: 0,
	albumCount: 0,
	tagCount: 2,
	characterCount: 0,
	conceptCount: 0,
	importanceLevel: 1,
	contentLength: 21,
	relatedItemsCount: 0,
	distribution: [],
});

const createMockNotes = (count: number): NoteWithStats[] => {
	return Array.from({ length: count }, (_, i) => createMockNote(`note_${i + 1}`));
};

describe('NoteStore Tests', () => {
	let store: ReturnType<typeof useNoteStore>;

	beforeEach(() => {
		// 🧹 Limpiar todos los mocks antes de cada prueba
		jest.clearAllMocks();

		// 🔄 Obtener una nueva instancia del store
		store = useNoteStore.getState();

		// 🎯 Configurar respuestas por defecto de los mocks
		mockApiCalls.getNotes.mockResolvedValue([]);
		mockApiCalls.createNote.mockResolvedValue(createMockNote());
		mockApiCalls.updateNote.mockResolvedValue(createMockNote());
		mockApiCalls.deleteNote.mockResolvedValue(undefined);
		mockApiCalls.addNoteToEntity.mockResolvedValue(undefined);
		mockApiCalls.removeNoteFromEntity.mockResolvedValue(undefined);
	});

	describe('🏗️ Estado Inicial', () => {
		it('debe tener el estado inicial correcto', () => {
			expect(store.notes).toEqual([]);
			expect(store.selectedNote).toBeNull();
			expect(store.isLoading).toBe(false);
			expect(store.error).toBeNull();

			// Filters
			expect(store.filters).toEqual({
				search: '',
				category: undefined,
				status: undefined,
				priority: undefined,
				tags: [],
				onlyFavorites: false,
			});
			expect(store.sortBy).toBe('updated_desc');
			expect(store.page).toBe(1);
			expect(store.pageSize).toBe(20);

			// UI
			expect(store.isCreateModalOpen).toBe(false);
			expect(store.isEditModalOpen).toBe(false);
			expect(store.isDeleteDialogOpen).toBe(false);
			expect(store.isDetailsDrawerOpen).toBe(false);
			expect(store.viewMode).toBe(NoteViewMode.GRID);

			// Selection
			expect(store.selectedNoteId).toBeNull();
			expect(store.selectedNoteIds).toEqual([]);
			expect(store.isMultiSelectMode).toBe(false);
		});
	});

	describe('🔄 Core Operations - CRUD', () => {
		describe('loadNotes', () => {
			it('debe cargar notas exitosamente', async () => {
				const mockNotes = createMockNotes(3);
				mockApiCalls.getNotes.mockResolvedValue(mockNotes);

				await store.loadNotes();

				expect(mockApiCalls.getNotes).toHaveBeenCalledTimes(1);
				expect(store.notes).toHaveLength(3);
				expect(store.isLoading).toBe(false);
				expect(store.error).toBeNull();
			});

			it('debe manejar errores al cargar notas', async () => {
				const errorMessage = 'Error de red';
				mockApiCalls.getNotes.mockRejectedValue(new Error(errorMessage));

				await store.loadNotes();

				expect(store.error).toBe(errorMessage);
				expect(store.isLoading).toBe(false);
				expect(store.notes).toEqual([]);
			});
		});

		describe('createNote', () => {
			it('debe crear una nota exitosamente', async () => {
				const noteData: NoteCreateInput = {
					title: 'Nueva Nota',
					content: 'Contenido de la nueva nota',
					category: 'personal',
					priority: 2,
				};

				await store.createNote(noteData);

				expect(mockApiCalls.createNote).toHaveBeenCalledWith(noteData);
				expect(mockApiCalls.createNote).toHaveBeenCalledTimes(1);
				// Verifica que se llame loadNotes después de crear
				expect(mockApiCalls.getNotes).toHaveBeenCalledTimes(1);
			});

			it('debe manejar errores al crear nota', async () => {
				const errorMessage = 'Error al crear nota';
				mockApiCalls.createNote.mockRejectedValue(new Error(errorMessage));

				const noteData: NoteCreateInput = {
					title: 'Nueva Nota',
					content: 'Contenido de la nueva nota',
				};

				await store.createNote(noteData);

				expect(store.error).toBe(errorMessage);
				expect(store.isLoading).toBe(false);
			});
		});

		describe('updateNote', () => {
			it('debe actualizar una nota exitosamente', async () => {
				const noteId = 'note_1';
				const updateData: NoteUpdateInput = {
					title: 'Título Actualizado',
					content: 'Contenido actualizado',
					priority: 3,
				};

				await store.updateNote(noteId, updateData);

				expect(mockApiCalls.updateNote).toHaveBeenCalledWith(noteId, updateData);
				expect(mockApiCalls.updateNote).toHaveBeenCalledTimes(1);
				// Verifica que se llame loadNotes después de actualizar
				expect(mockApiCalls.getNotes).toHaveBeenCalledTimes(1);
			});

			it('debe manejar errores al actualizar nota', async () => {
				const errorMessage = 'Error al actualizar nota';
				mockApiCalls.updateNote.mockRejectedValue(new Error(errorMessage));

				await store.updateNote('note_1', { title: 'Nuevo título' });

				expect(store.error).toBe(errorMessage);
				expect(store.isLoading).toBe(false);
			});
		});

		describe('deleteNote', () => {
			it('debe eliminar una nota exitosamente', async () => {
				const noteId = 'note_1';

				await store.deleteNote(noteId);

				expect(mockApiCalls.deleteNote).toHaveBeenCalledWith(noteId);
				expect(mockApiCalls.deleteNote).toHaveBeenCalledTimes(1);
				// Verifica que se llame loadNotes después de eliminar
				expect(mockApiCalls.getNotes).toHaveBeenCalledTimes(1);
			});

			it('debe deseleccionar la nota si es la que se elimina', async () => {
				const noteId = 'note_1';
				const mockNote = createMockNote(noteId);

				// Configurar estado con nota seleccionada
				store.selectNote(mockNote);
				expect(store.selectedNote).toBe(mockNote);

				await store.deleteNote(noteId);

				expect(store.selectedNote).toBeNull();
			});

			it('debe manejar errores al eliminar nota', async () => {
				const errorMessage = 'Error al eliminar nota';
				mockApiCalls.deleteNote.mockRejectedValue(new Error(errorMessage));

				await store.deleteNote('note_1');

				expect(store.error).toBe(errorMessage);
				expect(store.isLoading).toBe(false);
			});
		});

		describe('selectNote', () => {
			it('debe seleccionar una nota', () => {
				const mockNote = createMockNote();

				store.selectNote(mockNote);

				expect(store.selectedNote).toBe(mockNote);
			});

			it('debe deseleccionar una nota', () => {
				const mockNote = createMockNote();
				store.selectNote(mockNote);

				store.selectNote(null);

				expect(store.selectedNote).toBeNull();
			});
		});

		describe('setNotes', () => {
			it('debe establecer notas manualmente', () => {
				const mockNotes = createMockNotes(2);

				store.setNotes(mockNotes);

				expect(store.notes).toEqual(mockNotes);
				expect(store.isLoading).toBe(false);
			});
		});

		describe('reset', () => {
			it('debe resetear el estado core', () => {
				// Configurar estado con datos
				const mockNotes = createMockNotes(2);
				store.setNotes(mockNotes);
				store.selectNote(mockNotes[0]);

				store.reset();

				expect(store.notes).toEqual([]);
				expect(store.selectedNote).toBeNull();
				expect(store.isLoading).toBe(false);
				expect(store.error).toBeNull();
			});
		});
	});

	describe('🔍 Filters Operations', () => {
		describe('setFilters', () => {
			it('debe actualizar filtros', () => {
				const newFilters = {
					search: 'test search',
					category: 'personal',
					priority: 2,
				};

				store.setFilters(newFilters);

				expect(store.filters.search).toBe('test search');
				expect(store.filters.category).toBe('personal');
				expect(store.filters.priority).toBe(2);
				expect(store.page).toBe(1); // Se debe resetear la página
			});

			it('debe mantener filtros existentes al actualizar parcialmente', () => {
				// Configurar filtros iniciales
				store.setFilters({ search: 'búsqueda inicial', category: 'trabajo' });

				// Actualizar solo algunos filtros
				store.setFilters({ priority: 3 });

				expect(store.filters.search).toBe('búsqueda inicial');
				expect(store.filters.category).toBe('trabajo');
				expect(store.filters.priority).toBe(3);
			});
		});

		describe('setSortBy', () => {
			it('debe cambiar la opción de ordenamiento', () => {
				store.setSortBy('title_asc');

				expect(store.sortBy).toBe('title_asc');
				expect(store.page).toBe(1); // Se debe resetear la página
			});
		});

		describe('setPage', () => {
			it('debe cambiar la página', () => {
				store.setPage(3);

				expect(store.page).toBe(3);
			});
		});

		describe('setPageSize', () => {
			it('debe cambiar el tamaño de página', () => {
				store.setPageSize(50);

				expect(store.pageSize).toBe(50);
				expect(store.page).toBe(1); // Se debe resetear la página
			});
		});

		describe('Filtros específicos', () => {
			it('debe filtrar por categoría', () => {
				store.setCategoryFilter('personal');

				expect(store.filters.category).toBe('personal');
				expect(store.page).toBe(1);
			});

			it('debe filtrar por estado', () => {
				store.setStatusFilter('published');

				expect(store.filters.status).toBe('published');
				expect(store.page).toBe(1);
			});

			it('debe filtrar por prioridad', () => {
				store.setPriorityFilter(5);

				expect(store.filters.priority).toBe(5);
				expect(store.page).toBe(1);
			});

			it('debe filtrar por búsqueda', () => {
				store.setSearchFilter('nota importante');

				expect(store.filters.search).toBe('nota importante');
				expect(store.page).toBe(1);
			});

			it('debe filtrar por tags', () => {
				const tags = ['tag1', 'tag2'];
				store.setTagsFilter(tags);

				expect(store.filters.tags).toEqual(tags);
				expect(store.page).toBe(1);
			});

			it('debe filtrar solo favoritos', () => {
				store.setOnlyFavoritesFilter(true);

				expect(store.filters.onlyFavorites).toBe(true);
				expect(store.page).toBe(1);
			});
		});

		describe('clearFilters', () => {
			it('debe limpiar todos los filtros', () => {
				// Configurar filtros
				store.setFilters({
					search: 'test',
					category: 'personal',
					priority: 3,
					tags: ['tag1'],
					onlyFavorites: true,
				});
				store.setSortBy('title_asc');
				store.setPage(3);

				store.clearFilters();

				expect(store.filters).toEqual({
					search: '',
					category: undefined,
					status: undefined,
					priority: undefined,
					tags: [],
					onlyFavorites: false,
				});
				expect(store.sortBy).toBe('updated_desc');
				expect(store.page).toBe(1);
			});
		});
	});

	describe('👁️ UI Operations', () => {
		describe('Modal de creación', () => {
			it('debe abrir el modal de creación', () => {
				store.openCreateModal();

				expect(store.isCreateModalOpen).toBe(true);
			});

			it('debe cerrar el modal de creación', () => {
				store.openCreateModal();
				store.closeCreateModal();

				expect(store.isCreateModalOpen).toBe(false);
			});
		});

		describe('Modal de edición', () => {
			it('debe abrir el modal de edición', () => {
				store.openEditModal();

				expect(store.isEditModalOpen).toBe(true);
			});

			it('debe cerrar el modal de edición', () => {
				store.openEditModal();
				store.closeEditModal();

				expect(store.isEditModalOpen).toBe(false);
			});
		});

		describe('Diálogo de eliminación', () => {
			it('debe abrir el diálogo de eliminación', () => {
				store.openDeleteDialog();

				expect(store.isDeleteDialogOpen).toBe(true);
			});

			it('debe cerrar el diálogo de eliminación', () => {
				store.openDeleteDialog();
				store.closeDeleteDialog();

				expect(store.isDeleteDialogOpen).toBe(false);
			});
		});

		describe('Drawer de detalles', () => {
			it('debe abrir el drawer de detalles', () => {
				store.openDetailsDrawer();

				expect(store.isDetailsDrawerOpen).toBe(true);
			});

			it('debe cerrar el drawer de detalles', () => {
				store.openDetailsDrawer();
				store.closeDetailsDrawer();

				expect(store.isDetailsDrawerOpen).toBe(false);
			});
		});

		describe('setViewMode', () => {
			it('debe cambiar el modo de vista', () => {
				store.setViewMode(NoteViewMode.LIST);

				expect(store.viewMode).toBe(NoteViewMode.LIST);
			});

			it('debe cambiar entre diferentes modos de vista', () => {
				// Grid por defecto
				expect(store.viewMode).toBe(NoteViewMode.GRID);

				// Cambiar a lista
				store.setViewMode(NoteViewMode.LIST);
				expect(store.viewMode).toBe(NoteViewMode.LIST);

				// Cambiar a tarjetas
				store.setViewMode(NoteViewMode.CARD);
				expect(store.viewMode).toBe(NoteViewMode.CARD);
			});
		});

		describe('resetUI', () => {
			it('debe resetear todo el estado de UI', () => {
				// Configurar estado de UI
				store.openCreateModal();
				store.openEditModal();
				store.openDeleteDialog();
				store.openDetailsDrawer();
				store.setViewMode(NoteViewMode.LIST);

				store.resetUI();

				expect(store.isCreateModalOpen).toBe(false);
				expect(store.isEditModalOpen).toBe(false);
				expect(store.isDeleteDialogOpen).toBe(false);
				expect(store.isDetailsDrawerOpen).toBe(false);
				expect(store.viewMode).toBe(NoteViewMode.GRID);
			});
		});
	});

	describe('✅ Selection Operations', () => {
		describe('Selección individual', () => {
			it('debe seleccionar una nota por ID', () => {
				store.selectNote('note_1');

				expect(store.selectedNoteId).toBe('note_1');
			});

			it('debe deseleccionar nota', () => {
				store.selectNote('note_1');
				store.unselectNote();

				expect(store.selectedNoteId).toBeNull();
			});
		});

		describe('Modo multi-selección', () => {
			it('debe activar/desactivar modo multi-selección', () => {
				store.toggleMultiSelectMode();

				expect(store.isMultiSelectMode).toBe(true);

				store.toggleMultiSelectMode();

				expect(store.isMultiSelectMode).toBe(false);
			});

			it('debe limpiar selecciones al desactivar modo multi-selección', () => {
				// Activar modo y seleccionar notas
				store.toggleMultiSelectMode();
				store.toggleNoteSelection('note_1');
				store.toggleNoteSelection('note_2');

				// Desactivar modo
				store.toggleMultiSelectMode();

				expect(store.isMultiSelectMode).toBe(false);
				expect(store.selectedNoteIds).toEqual([]);
			});
		});

		describe('toggleNoteSelection', () => {
			it('debe añadir nota a selección si no está seleccionada', () => {
				store.toggleNoteSelection('note_1');

				expect(store.selectedNoteIds).toContain('note_1');
			});

			it('debe quitar nota de selección si ya está seleccionada', () => {
				store.toggleNoteSelection('note_1');
				store.toggleNoteSelection('note_1');

				expect(store.selectedNoteIds).not.toContain('note_1');
			});

			it('debe manejar múltiples selecciones', () => {
				store.toggleNoteSelection('note_1');
				store.toggleNoteSelection('note_2');
				store.toggleNoteSelection('note_3');

				expect(store.selectedNoteIds).toEqual(['note_1', 'note_2', 'note_3']);

				// Deseleccionar una
				store.toggleNoteSelection('note_2');

				expect(store.selectedNoteIds).toEqual(['note_1', 'note_3']);
			});
		});

		describe('selectAllNotes', () => {
			it('debe seleccionar todas las notas disponibles', () => {
				const mockNotes = createMockNotes(5);
				store.setNotes(mockNotes);

				store.selectAllNotes();

				expect(store.selectedNoteIds).toHaveLength(5);
				expect(store.selectedNoteIds).toEqual(['note_1', 'note_2', 'note_3', 'note_4', 'note_5']);
				expect(store.isMultiSelectMode).toBe(true);
			});

			it('debe manejar lista vacía de notas', () => {
				store.selectAllNotes();

				expect(store.selectedNoteIds).toEqual([]);
				expect(store.isMultiSelectMode).toBe(true);
			});
		});

		describe('clearSelection', () => {
			it('debe limpiar todas las selecciones', () => {
				// Configurar selecciones
				store.selectNote('note_1');
				store.toggleNoteSelection('note_2');
				store.toggleNoteSelection('note_3');

				store.clearSelection();

				expect(store.selectedNoteId).toBeNull();
				expect(store.selectedNoteIds).toEqual([]);
			});
		});

		describe('resetSelection', () => {
			it('debe resetear todo el estado de selección', () => {
				// Configurar estado de selección
				store.selectNote('note_1');
				store.toggleMultiSelectMode();
				store.toggleNoteSelection('note_2');
				store.toggleNoteSelection('note_3');

				store.resetSelection();

				expect(store.selectedNoteId).toBeNull();
				expect(store.selectedNoteIds).toEqual([]);
				expect(store.isMultiSelectMode).toBe(false);
			});
		});
	});

	describe('🔗 Relations Operations', () => {
		describe('addNoteToEntity', () => {
			it('debe añadir nota a entidad exitosamente', async () => {
				const noteId = 'note_1';
				const entityId = 'character_1';
				const entityType: EntityType = 'character';

				await store.addNoteToEntity(noteId, entityId, entityType);

				expect(mockApiCalls.addNoteToEntity).toHaveBeenCalledWith(noteId, entityId, entityType);
				expect(mockApiCalls.addNoteToEntity).toHaveBeenCalledTimes(1);
				// Verifica que se recarguen las notas
				expect(mockApiCalls.getNotes).toHaveBeenCalledTimes(1);
			});

			it('debe manejar errores al añadir nota a entidad', async () => {
				const errorMessage = 'Error al añadir relación';
				mockApiCalls.addNoteToEntity.mockRejectedValue(new Error(errorMessage));

				await store.addNoteToEntity('note_1', 'character_1', 'character');

				expect(store.error).toBe(errorMessage);
				expect(store.isLoading).toBe(false);
			});
		});

		describe('removeNoteFromEntity', () => {
			it('debe eliminar nota de entidad exitosamente', async () => {
				const noteId = 'note_1';
				const entityId = 'character_1';
				const entityType: EntityType = 'character';

				await store.removeNoteFromEntity(noteId, entityId, entityType);

				expect(mockApiCalls.removeNoteFromEntity).toHaveBeenCalledWith(noteId, entityId, entityType);
				expect(mockApiCalls.removeNoteFromEntity).toHaveBeenCalledTimes(1);
				// Verifica que se recarguen las notas
				expect(mockApiCalls.getNotes).toHaveBeenCalledTimes(1);
			});

			it('debe manejar errores al eliminar nota de entidad', async () => {
				const errorMessage = 'Error al eliminar relación';
				mockApiCalls.removeNoteFromEntity.mockRejectedValue(new Error(errorMessage));

				await store.removeNoteFromEntity('note_1', 'character_1', 'character');

				expect(store.error).toBe(errorMessage);
				expect(store.isLoading).toBe(false);
			});
		});

		it('debe manejar múltiples tipos de entidades', async () => {
			const noteId = 'note_1';
			const entityTypes: EntityType[] = ['character', 'place', 'concept', 'image'];

			for (const entityType of entityTypes) {
				await store.addNoteToEntity(noteId, `${entityType}_1`, entityType);
				expect(mockApiCalls.addNoteToEntity).toHaveBeenCalledWith(noteId, `${entityType}_1`, entityType);
			}

			expect(mockApiCalls.addNoteToEntity).toHaveBeenCalledTimes(4);
		});
	});

	describe('🚀 Performance Tests', () => {
		it('debe manejar gran cantidad de notas eficientemente', async () => {
			const startTime = performance.now();
			const largeNoteSet = createMockNotes(1000);
			mockApiCalls.getNotes.mockResolvedValue(largeNoteSet);

			await store.loadNotes();

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(store.notes).toHaveLength(1000);
			expect(duration).toBeLessThan(1000); // Debería tomar menos de 1 segundo
		});

		it('debe manejar selección múltiple con muchas notas', () => {
			const startTime = performance.now();
			const largeNoteSet = createMockNotes(1000);
			store.setNotes(largeNoteSet);

			store.selectAllNotes();

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(store.selectedNoteIds).toHaveLength(1000);
			expect(duration).toBeLessThan(100); // Debería ser muy rápido
		});

		it('debe manejar filtros complejos eficientemente', () => {
			const startTime = performance.now();
			const largeNoteSet = createMockNotes(500);
			store.setNotes(largeNoteSet);

			// Aplicar múltiples filtros
			store.setFilters({
				search: 'test',
				category: 'personal',
				priority: 3,
				tags: ['tag1', 'tag2'],
				onlyFavorites: true,
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(duration).toBeLessThan(50); // Filtrado debería ser muy rápido
		});
	});

	describe('🧪 Edge Cases', () => {
		it('debe manejar datos de nota malformados', async () => {
			const malformedData = [
				{ id: null, title: undefined, content: '' },
				{ id: '', title: '', content: null },
				{}, // Objeto vacío
			] as any;

			mockApiCalls.getNotes.mockResolvedValue(malformedData);

			await store.loadNotes();

			// No debería fallar, debería manejar datos malformados graciosamente
			expect(store.error).toBeNull();
		});

		it('debe manejar IDs duplicados en selección', () => {
			store.toggleNoteSelection('note_1');
			store.toggleNoteSelection('note_1');
			store.toggleNoteSelection('note_1');

			// No debería tener duplicados
			expect(store.selectedNoteIds.filter(id => id === 'note_1')).toHaveLength(0);
		});

		it('debe manejar filtros con valores nulos/undefined', () => {
			store.setFilters({
				search: null as any,
				category: undefined,
				priority: Number.NaN,
				tags: null as any,
			});

			// No debería fallar
			expect(store.filters.search).toBe(null);
		});

		it('debe manejar operaciones con notas inexistentes', async () => {
			await store.deleteNote('nota_inexistente');
			store.selectNote('nota_inexistente');

			// No debería fallar
			expect(store.error).toBeTruthy(); // Debería tener error por nota inexistente
		});

		it('debe manejar cambios rápidos de página', () => {
			// Simular cambios rápidos de página
			for (let i = 1; i <= 10; i++) {
				store.setPage(i);
			}

			expect(store.page).toBe(10);
		});

		it('debe manejar caracteres especiales en búsqueda', () => {
			const specialCharacters = '!@#$%^&*()[]{}|;:,.<>?~`';
			store.setSearchFilter(specialCharacters);

			expect(store.filters.search).toBe(specialCharacters);
		});

		it('debe manejar ordenamiento con valores nulos', () => {
			store.setSortBy(null as any);
			store.setSortBy(undefined as any);

			// Debería manejar valores inválidos graciosamente
			expect(store.sortBy).toBeDefined();
		});
	});

	describe('🔄 Reset Operations', () => {
		it('debe resetear completamente el store', () => {
			// Configurar estado complejo
			const mockNotes = createMockNotes(3);
			store.setNotes(mockNotes);
			store.selectNote(mockNotes[0]);
			store.setFilters({ search: 'test', category: 'personal' });
			store.openCreateModal();
			store.toggleMultiSelectMode();
			store.toggleNoteSelection('note_1');

			// Resetear cada slice
			store.reset();
			store.clearFilters();
			store.resetUI();
			store.resetSelection();

			// Verificar estado inicial
			expect(store.notes).toEqual([]);
			expect(store.selectedNote).toBeNull();
			expect(store.filters.search).toBe('');
			expect(store.isCreateModalOpen).toBe(false);
			expect(store.isMultiSelectMode).toBe(false);
			expect(store.selectedNoteIds).toEqual([]);
		});
	});
});
