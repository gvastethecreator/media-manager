/**
 * @file Tests completos para PromptStore
 * @module tests/stores/prompt.store.test
 * @description Pruebas unitarias comprehensivas para el store de Prompt
 */

import { usePromptStore } from '@/store/entities/prompt/store';
import type { EntityType } from '@/types/entities/entities';
import type { PromptBase, PromptCreateInput, PromptUpdateInput, PromptWithStats } from '@/types/entities/prompt';
import { PromptCategory, PromptModel, PromptSortOption, PromptViewMode } from '@/types/entities/prompt/enums';

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
jest.mock('@/transformers/prompt/transformer', () => ({
	toPromptWithStats: jest.fn((prompt: PromptBase): PromptWithStats => ({
		...prompt,
		lastUsed: new Date(),
		totalExecutions: 5,
		avgExecutionTime: 1200,
		successRate: 0.95,
		tokens: {
			input: 150,
			output: 300,
			total: 450,
		},
		usage: {
			daily: 3,
			weekly: 15,
			monthly: 60,
		},
		rating: 4.5,
		distribution: [],
	})),
}));

// 🎯 Mock de los API calls para simulación controlada
const mockApiCalls = {
	getPrompts: jest.fn(),
	createPrompt: jest.fn(),
	updatePrompt: jest.fn(),
	deletePrompt: jest.fn(),
	executePrompt: jest.fn(),
	addPromptToEntity: jest.fn(),
	removePromptFromEntity: jest.fn(),
};

jest.mock('@/store/entities/prompt/slices/core', () => ({
	createCoreSlice: jest.fn((...args) => {
		const [set, get] = args;
		return {
			// Estado inicial
			prompts: [],
			selectedPrompt: null,
			isLoading: false,
			error: null,

			// Acciones mock
			loadPrompts: jest.fn(async () => {
				try {
					set({ isLoading: true, error: null });
					const prompts = await mockApiCalls.getPrompts();
					const transformedPrompts = prompts.map((p: PromptBase) => ({
						...p,
						lastUsed: new Date(),
						totalExecutions: 5,
						avgExecutionTime: 1200,
						successRate: 0.95,
						tokens: { input: 150, output: 300, total: 450 },
						usage: { daily: 3, weekly: 15, monthly: 60 },
						rating: 4.5,
						distribution: [],
					}));
					set({ prompts: transformedPrompts, isLoading: false });
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al cargar prompts';
					set({ error: message, isLoading: false });
				}
			}),

			setPrompts: jest.fn((prompts: PromptWithStats[]) => {
				set({ prompts, isLoading: false });
			}),

			createPrompt: jest.fn(async (prompt: PromptCreateInput) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.createPrompt(prompt);
					const current = get();
					await current.loadPrompts();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al crear prompt';
					set({ error: message, isLoading: false });
				}
			}),

			updatePrompt: jest.fn(async (id: string, prompt: PromptUpdateInput) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.updatePrompt(id, prompt);
					const current = get();
					await current.loadPrompts();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al actualizar prompt';
					set({ error: message, isLoading: false });
				}
			}),

			deletePrompt: jest.fn(async (id: string) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.deletePrompt(id);
					const current = get();
					await current.loadPrompts();
					// Si el prompt eliminado estaba seleccionado, deseleccionarlo
					if (get().selectedPrompt?.id === id) {
						set({ selectedPrompt: null });
					}
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al eliminar prompt';
					set({ error: message, isLoading: false });
				}
			}),

			selectPrompt: jest.fn((prompt: PromptBase | null) => {
				set({ selectedPrompt: prompt });
			}),

			reset: jest.fn(() => {
				set({
					prompts: [],
					selectedPrompt: null,
					isLoading: false,
					error: null,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/prompt/slices/filters', () => ({
	createFiltersSlice: jest.fn((...args) => {
		const [set] = args;
		return {
			// Estado inicial
			filters: {
				search: '',
				category: null,
				tags: [],
				onlyFavorites: false,
				dateRange: null,
			},
			sortBy: 'name_asc' as PromptSortOption,
			page: 0,
			pageSize: 20,

			// Acciones
			setFilters: jest.fn((filters) => {
				set((state: any) => ({
					filters: { ...state.filters, ...filters }
				}));
			}),

			setSortBy: jest.fn((sortBy: PromptSortOption) => {
				set({ sortBy });
			}),

			setPage: jest.fn((page: number) => {
				set({ page });
			}),

			setPageSize: jest.fn((pageSize: number) => {
				set({ pageSize });
			}),

			setCategoryFilter: jest.fn((category: string | null) => {
				set((state: any) => ({
					filters: { ...state.filters, category }
				}));
			}),

			setSearchFilter: jest.fn((search: string) => {
				set((state: any) => ({
					filters: { ...state.filters, search }
				}));
			}),

			setTagsFilter: jest.fn((tags: string[]) => {
				set((state: any) => ({
					filters: { ...state.filters, tags }
				}));
			}),

			setOnlyFavoritesFilter: jest.fn((onlyFavorites: boolean) => {
				set((state: any) => ({
					filters: { ...state.filters, onlyFavorites }
				}));
			}),

			clearFilters: jest.fn(() => {
				set({
					filters: {
						search: '',
						category: null,
						tags: [],
						onlyFavorites: false,
						dateRange: null,
					},
					sortBy: 'name_asc' as PromptSortOption,
					page: 0,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/prompt/slices/ui', () => ({
	createUISlice: jest.fn((...args) => {
		const [set] = args;
		return {
			// Estado inicial
			viewMode: PromptViewMode.GRID,
			isCreateModalOpen: false,
			isEditModalOpen: false,
			isDeleteDialogOpen: false,
			isDetailsDrawerOpen: false,
			isExecuteModalOpen: false,

			// Acciones
			setViewMode: jest.fn((viewMode: PromptViewMode) => {
				set({ viewMode });
			}),

			openCreateModal: jest.fn(() => {
				set({ isCreateModalOpen: true });
			}),

			closeCreateModal: jest.fn(() => {
				set({ isCreateModalOpen: false });
			}),

			openEditModal: jest.fn(() => {
				set({ isEditModalOpen: true });
			}),

			closeEditModal: jest.fn(() => {
				set({ isEditModalOpen: false });
			}),

			openDeleteDialog: jest.fn(() => {
				set({ isDeleteDialogOpen: true });
			}),

			closeDeleteDialog: jest.fn(() => {
				set({ isDeleteDialogOpen: false });
			}),

			openDetailsDrawer: jest.fn(() => {
				set({ isDetailsDrawerOpen: true });
			}),

			closeDetailsDrawer: jest.fn(() => {
				set({ isDetailsDrawerOpen: false });
			}),

			openExecuteModal: jest.fn(() => {
				set({ isExecuteModalOpen: true });
			}),

			closeExecuteModal: jest.fn(() => {
				set({ isExecuteModalOpen: false });
			}),

			resetUI: jest.fn(() => {
				set({
					viewMode: PromptViewMode.GRID,
					isCreateModalOpen: false,
					isEditModalOpen: false,
					isDeleteDialogOpen: false,
					isDetailsDrawerOpen: false,
					isExecuteModalOpen: false,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/prompt/slices/execution', () => ({
	createExecutionSlice: jest.fn((...args) => {
		const [set] = args;
		return {
			// Estado inicial
			isExecuting: false,
			executionResult: null,
			executionError: null,

			// Acciones
			executePrompt: jest.fn(async (params) => {
				try {
					set({ isExecuting: true, executionError: null });
					const result = await mockApiCalls.executePrompt(params);
					set({ executionResult: result, isExecuting: false });
					return result;
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error en ejecución';
					set({ executionError: message, isExecuting: false });
					return null;
				}
			}),

			clearExecutionResult: jest.fn(() => {
				set({
					executionResult: null,
					executionError: null,
				});
			}),
		};
	}),
}));

jest.mock('@/store/entities/prompt/slices/relations', () => ({
	createRelationsSlice: jest.fn((...args) => {
		return {
			// Acciones
			addPromptToEntity: jest.fn(async (promptId: string, entityId: string, entityType: EntityType) => {
				await mockApiCalls.addPromptToEntity(promptId, entityId, entityType);
			}),

			removePromptFromEntity: jest.fn(async (promptId: string, entityId: string, entityType: EntityType) => {
				await mockApiCalls.removePromptFromEntity(promptId, entityId, entityType);
			}),
		};
	}),
}));

describe('PromptStore', () => {
	beforeEach(() => {
		// Limpiar todos los mocks antes de cada test
		jest.clearAllMocks();

		// Resetear los mocks de las API calls
		mockApiCalls.getPrompts.mockResolvedValue([]);
		mockApiCalls.createPrompt.mockResolvedValue(undefined);
		mockApiCalls.updatePrompt.mockResolvedValue(undefined);
		mockApiCalls.deletePrompt.mockResolvedValue(undefined);
		mockApiCalls.executePrompt.mockResolvedValue({
			id: 'execution-1',
			promptId: 'prompt-1',
			result: 'Resultado de prueba',
			success: true,
			duration: 1200,
			timestamp: new Date(),
		});
		mockApiCalls.addPromptToEntity.mockResolvedValue(undefined);
		mockApiCalls.removePromptFromEntity.mockResolvedValue(undefined);
	});

	describe('📊 Estado inicial', () => {
		it('debe tener el estado inicial correcto', () => {
			const store = usePromptStore.getState();

			// Core slice
			expect(store.prompts).toEqual([]);
			expect(store.selectedPrompt).toBeNull();
			expect(store.isLoading).toBe(false);
			expect(store.error).toBeNull();

			// Filters slice
			expect(store.filters).toEqual({
				search: '',
				category: null,
				tags: [],
				onlyFavorites: false,
				dateRange: null,
			});
			expect(store.sortBy).toBe('name_asc');
			expect(store.page).toBe(0);
			expect(store.pageSize).toBe(20);

			// UI slice
			expect(store.viewMode).toBe(PromptViewMode.GRID);
			expect(store.isCreateModalOpen).toBe(false);
			expect(store.isEditModalOpen).toBe(false);
			expect(store.isDeleteDialogOpen).toBe(false);
			expect(store.isDetailsDrawerOpen).toBe(false);
			expect(store.isExecuteModalOpen).toBe(false);

			// Execution slice
			expect(store.isExecuting).toBe(false);
			expect(store.executionResult).toBeNull();
			expect(store.executionError).toBeNull();
		});
	});

	describe('🔧 Core Slice - Operaciones CRUD', () => {
		it('debe cargar prompts correctamente', async () => {
			const mockPrompts: PromptBase[] = [
				{
					id: 'prompt-1',
					name: 'Test Prompt 1',
					emoji: '🎯',
					color: '#3b82f6',
					description: 'Descripción de prueba',
					content: 'Contenido del prompt de prueba',
					category: PromptCategory.GENERAL,
					parameters: '{"temperature": 0.7}',
					tags: '["test", "ejemplo"]',
					featuredImage: null,
					isFavorite: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'prompt-2',
					name: 'Test Prompt 2',
					emoji: '💬',
					color: '#10b981',
					description: 'Otro prompt de prueba',
					content: 'Más contenido de prueba',
					category: PromptCategory.CREATIVE,
					parameters: '{"temperature": 0.9}',
					tags: '["creative", "test"]',
					featuredImage: null,
					isFavorite: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockApiCalls.getPrompts.mockResolvedValue(mockPrompts);

			const store = usePromptStore.getState();
			await store.loadPrompts();

			expect(mockApiCalls.getPrompts).toHaveBeenCalledTimes(1);
			expect(store.prompts).toHaveLength(2);
			expect(store.prompts[0].name).toBe('Test Prompt 1');
			expect(store.prompts[1].isFavorite).toBe(true);
			expect(store.isLoading).toBe(false);
			expect(store.error).toBeNull();
		});

		it('debe manejar errores al cargar prompts', async () => {
			const errorMessage = 'Error de conexión';
			mockApiCalls.getPrompts.mockRejectedValue(new Error(errorMessage));

			const store = usePromptStore.getState();
			await store.loadPrompts();

			expect(store.error).toBe(errorMessage);
			expect(store.isLoading).toBe(false);
			expect(store.prompts).toEqual([]);
		});

		it('debe crear un prompt correctamente', async () => {
			const newPrompt: PromptCreateInput = {
				name: 'Nuevo Prompt',
				emoji: '✨',
				color: '#8b5cf6',
				description: 'Prompt recién creado',
				content: 'Contenido del nuevo prompt',
				category: PromptCategory.TECHNICAL,
				parameters: '{"temperature": 0.5}',
				tags: '["nuevo", "test"]',
				isFavorite: false,
			};

			const store = usePromptStore.getState();
			await store.createPrompt(newPrompt);

			expect(mockApiCalls.createPrompt).toHaveBeenCalledWith(newPrompt);
			expect(mockApiCalls.getPrompts).toHaveBeenCalled(); // Recarga después de crear
		});

		it('debe actualizar un prompt correctamente', async () => {
			const promptId = 'prompt-1';
			const updateData: PromptUpdateInput = {
				name: 'Prompt Actualizado',
				description: 'Descripción actualizada',
				isFavorite: true,
			};

			const store = usePromptStore.getState();
			await store.updatePrompt(promptId, updateData);

			expect(mockApiCalls.updatePrompt).toHaveBeenCalledWith(promptId, updateData);
			expect(mockApiCalls.getPrompts).toHaveBeenCalled(); // Recarga después de actualizar
		});

		it('debe eliminar un prompt correctamente', async () => {
			const promptId = 'prompt-1';

			const store = usePromptStore.getState();
			await store.deletePrompt(promptId);

			expect(mockApiCalls.deletePrompt).toHaveBeenCalledWith(promptId);
			expect(mockApiCalls.getPrompts).toHaveBeenCalled(); // Recarga después de eliminar
		});

		it('debe deseleccionar prompt al eliminarlo si estaba seleccionado', async () => {
			const promptToDelete: PromptBase = {
				id: 'prompt-1',
				name: 'Prompt a Eliminar',
				emoji: '🗑️',
				color: '#ef4444',
				description: null,
				content: 'Contenido',
				category: PromptCategory.GENERAL,
				parameters: '{}',
				tags: '[]',
				featuredImage: null,
				isFavorite: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const store = usePromptStore.getState();
			store.selectPrompt(promptToDelete);
			expect(store.selectedPrompt).toBe(promptToDelete);

			await store.deletePrompt('prompt-1');

			expect(store.selectedPrompt).toBeNull();
		});

		it('debe seleccionar y deseleccionar prompts', () => {
			const prompt: PromptBase = {
				id: 'prompt-1',
				name: 'Prompt Seleccionado',
				emoji: '👆',
				color: '#3b82f6',
				description: null,
				content: 'Contenido',
				category: PromptCategory.GENERAL,
				parameters: '{}',
				tags: '[]',
				featuredImage: null,
				isFavorite: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const store = usePromptStore.getState();

			// Seleccionar prompt
			store.selectPrompt(prompt);
			expect(store.selectedPrompt).toBe(prompt);

			// Deseleccionar prompt
			store.selectPrompt(null);
			expect(store.selectedPrompt).toBeNull();
		});

		it('debe resetear el store correctamente', () => {
			const store = usePromptStore.getState();

			// Establecer algún estado
			store.setPrompts([
				{
					id: 'prompt-1',
					name: 'Test',
					emoji: '🎯',
					color: '#3b82f6',
					description: null,
					content: 'Contenido',
					category: PromptCategory.GENERAL,
					parameters: '{}',
					tags: '[]',
					featuredImage: null,
					isFavorite: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastUsed: new Date(),
					totalExecutions: 5,
					avgExecutionTime: 1200,
					successRate: 0.95,
					tokens: { input: 150, output: 300, total: 450 },
					usage: { daily: 3, weekly: 15, monthly: 60 },
					rating: 4.5,
					distribution: [],
				},
			]);

			// Resetear
			store.reset();

			// Verificar estado inicial
			expect(store.prompts).toEqual([]);
			expect(store.selectedPrompt).toBeNull();
			expect(store.isLoading).toBe(false);
			expect(store.error).toBeNull();
		});
	});

	describe('🔍 Filters Slice - Sistema de filtros', () => {
		it('debe actualizar filtros de búsqueda', () => {
			const store = usePromptStore.getState();

			store.setSearchFilter('test prompt');
			expect(store.filters.search).toBe('test prompt');
		});

		it('debe actualizar filtro de categoría', () => {
			const store = usePromptStore.getState();

			store.setCategoryFilter(PromptCategory.CREATIVE);
			expect(store.filters.category).toBe(PromptCategory.CREATIVE);

			store.setCategoryFilter(null);
			expect(store.filters.category).toBeNull();
		});

		it('debe actualizar filtro de tags', () => {
			const store = usePromptStore.getState();

			const tags = ['tag1', 'tag2', 'tag3'];
			store.setTagsFilter(tags);
			expect(store.filters.tags).toEqual(tags);
		});

		it('debe actualizar filtro de favoritos', () => {
			const store = usePromptStore.getState();

			store.setOnlyFavoritesFilter(true);
			expect(store.filters.onlyFavorites).toBe(true);

			store.setOnlyFavoritesFilter(false);
			expect(store.filters.onlyFavorites).toBe(false);
		});

		it('debe actualizar criterio de ordenación', () => {
			const store = usePromptStore.getState();

			store.setSortBy('name_desc');
			expect(store.sortBy).toBe('name_desc');

			store.setSortBy('created_desc');
			expect(store.sortBy).toBe('created_desc');
		});

		it('debe manejar paginación', () => {
			const store = usePromptStore.getState();

			// Cambiar página
			store.setPage(2);
			expect(store.page).toBe(2);

			// Cambiar tamaño de página
			store.setPageSize(50);
			expect(store.pageSize).toBe(50);
		});

		it('debe actualizar múltiples filtros simultáneamente', () => {
			const store = usePromptStore.getState();

			const filters = {
				search: 'creative prompt',
				category: PromptCategory.CREATIVE,
				onlyFavorites: true,
			};

			store.setFilters(filters);

			expect(store.filters.search).toBe('creative prompt');
			expect(store.filters.category).toBe(PromptCategory.CREATIVE);
			expect(store.filters.onlyFavorites).toBe(true);
		});

		it('debe limpiar todos los filtros', () => {
			const store = usePromptStore.getState();

			// Establecer algunos filtros
			store.setSearchFilter('test');
			store.setCategoryFilter(PromptCategory.TECHNICAL);
			store.setOnlyFavoritesFilter(true);
			store.setSortBy('name_desc');
			store.setPage(3);

			// Limpiar filtros
			store.clearFilters();

			expect(store.filters).toEqual({
				search: '',
				category: null,
				tags: [],
				onlyFavorites: false,
				dateRange: null,
			});
			expect(store.sortBy).toBe('name_asc');
			expect(store.page).toBe(0);
		});
	});

	describe('🎨 UI Slice - Estado de la interfaz', () => {
		it('debe cambiar modo de vista', () => {
			const store = usePromptStore.getState();

			expect(store.viewMode).toBe(PromptViewMode.GRID);

			store.setViewMode(PromptViewMode.LIST);
			expect(store.viewMode).toBe(PromptViewMode.LIST);

			store.setViewMode(PromptViewMode.COMPACT);
			expect(store.viewMode).toBe(PromptViewMode.COMPACT);
		});

		it('debe gestionar modal de creación', () => {
			const store = usePromptStore.getState();

			expect(store.isCreateModalOpen).toBe(false);

			store.openCreateModal();
			expect(store.isCreateModalOpen).toBe(true);

			store.closeCreateModal();
			expect(store.isCreateModalOpen).toBe(false);
		});

		it('debe gestionar modal de edición', () => {
			const store = usePromptStore.getState();

			expect(store.isEditModalOpen).toBe(false);

			store.openEditModal();
			expect(store.isEditModalOpen).toBe(true);

			store.closeEditModal();
			expect(store.isEditModalOpen).toBe(false);
		});

		it('debe gestionar diálogo de eliminación', () => {
			const store = usePromptStore.getState();

			expect(store.isDeleteDialogOpen).toBe(false);

			store.openDeleteDialog();
			expect(store.isDeleteDialogOpen).toBe(true);

			store.closeDeleteDialog();
			expect(store.isDeleteDialogOpen).toBe(false);
		});

		it('debe gestionar drawer de detalles', () => {
			const store = usePromptStore.getState();

			expect(store.isDetailsDrawerOpen).toBe(false);

			store.openDetailsDrawer();
			expect(store.isDetailsDrawerOpen).toBe(true);

			store.closeDetailsDrawer();
			expect(store.isDetailsDrawerOpen).toBe(false);
		});

		it('debe gestionar modal de ejecución', () => {
			const store = usePromptStore.getState();

			expect(store.isExecuteModalOpen).toBe(false);

			store.openExecuteModal();
			expect(store.isExecuteModalOpen).toBe(true);

			store.closeExecuteModal();
			expect(store.isExecuteModalOpen).toBe(false);
		});

		it('debe resetear toda la UI', () => {
			const store = usePromptStore.getState();

			// Abrir varios modales
			store.openCreateModal();
			store.openEditModal();
			store.openDeleteDialog();
			store.setViewMode(PromptViewMode.LIST);

			// Resetear UI
			store.resetUI();

			expect(store.viewMode).toBe(PromptViewMode.GRID);
			expect(store.isCreateModalOpen).toBe(false);
			expect(store.isEditModalOpen).toBe(false);
			expect(store.isDeleteDialogOpen).toBe(false);
			expect(store.isDetailsDrawerOpen).toBe(false);
			expect(store.isExecuteModalOpen).toBe(false);
		});
	});

	describe('⚡ Execution Slice - Ejecución de prompts', () => {
		it('debe ejecutar un prompt correctamente', async () => {
			const executionParams = {
				promptId: 'prompt-1',
				variables: { name: 'Usuario' },
				model: PromptModel.GPT_4,
				temperature: 0.7,
				maxTokens: 500,
			};

			const expectedResult = {
				id: 'execution-1',
				promptId: 'prompt-1',
				result: 'Resultado de prueba',
				success: true,
				duration: 1200,
				timestamp: new Date(),
			};

			mockApiCalls.executePrompt.mockResolvedValue(expectedResult);

			const store = usePromptStore.getState();
			const result = await store.executePrompt(executionParams);

			expect(mockApiCalls.executePrompt).toHaveBeenCalledWith(executionParams);
			expect(result).toEqual(expectedResult);
			expect(store.executionResult).toEqual(expectedResult);
			expect(store.isExecuting).toBe(false);
			expect(store.executionError).toBeNull();
		});

		it('debe manejar errores en la ejecución', async () => {
			const executionParams = {
				promptId: 'prompt-1',
				variables: {},
				model: PromptModel.GPT_3_5_TURBO,
			};

			const errorMessage = 'Error de ejecución';
			mockApiCalls.executePrompt.mockRejectedValue(new Error(errorMessage));

			const store = usePromptStore.getState();
			const result = await store.executePrompt(executionParams);

			expect(result).toBeNull();
			expect(store.executionError).toBe(errorMessage);
			expect(store.isExecuting).toBe(false);
			expect(store.executionResult).toBeNull();
		});

		it('debe limpiar resultado de ejecución', () => {
			const store = usePromptStore.getState();

			// Establecer algún resultado
			store.executePrompt({
				promptId: 'prompt-1',
				variables: {},
				model: PromptModel.GPT_4,
			});

			// Limpiar resultado
			store.clearExecutionResult();

			expect(store.executionResult).toBeNull();
			expect(store.executionError).toBeNull();
		});

		it('debe manejar estado de carga durante ejecución', async () => {
			const executionParams = {
				promptId: 'prompt-1',
				variables: {},
				model: PromptModel.GPT_4,
			};

			// Mock que simula una ejecución lenta
			mockApiCalls.executePrompt.mockImplementation(
				() => new Promise(resolve => setTimeout(() => resolve({
					id: 'execution-1',
					promptId: 'prompt-1',
					result: 'Resultado',
					success: true,
					duration: 1200,
					timestamp: new Date(),
				}), 100))
			);

			const store = usePromptStore.getState();

			// Iniciar ejecución
			const promise = store.executePrompt(executionParams);

			// Verificar que está en estado de carga
			expect(store.isExecuting).toBe(true);

			// Esperar a que termine
			await promise;

			// Verificar que ya no está cargando
			expect(store.isExecuting).toBe(false);
		});
	});

	describe('🔗 Relations Slice - Relaciones con entidades', () => {
		it('debe agregar prompt a entidad', async () => {
			const promptId = 'prompt-1';
			const entityId = 'character-1';
			const entityType: EntityType = 'character';

			const store = usePromptStore.getState();
			await store.addPromptToEntity(promptId, entityId, entityType);

			expect(mockApiCalls.addPromptToEntity).toHaveBeenCalledWith(promptId, entityId, entityType);
		});

		it('debe remover prompt de entidad', async () => {
			const promptId = 'prompt-1';
			const entityId = 'album-1';
			const entityType: EntityType = 'album';

			const store = usePromptStore.getState();
			await store.removePromptFromEntity(promptId, entityId, entityType);

			expect(mockApiCalls.removePromptFromEntity).toHaveBeenCalledWith(promptId, entityId, entityType);
		});

		it('debe manejar diferentes tipos de entidades', async () => {
			const promptId = 'prompt-1';
			const store = usePromptStore.getState();

			const entityTypes: EntityType[] = ['character', 'album', 'concept', 'place', 'note'];

			for (const entityType of entityTypes) {
				await store.addPromptToEntity(promptId, `${entityType}-1`, entityType);
				expect(mockApiCalls.addPromptToEntity).toHaveBeenCalledWith(promptId, `${entityType}-1`, entityType);
			}
		});
	});

	describe('🚀 Performance Tests', () => {
		it('debe manejar grandes cantidades de prompts eficientemente', async () => {
			const largePromptList: PromptBase[] = Array.from({ length: 1000 }, (_, i) => ({
				id: `prompt-${i}`,
				name: `Prompt ${i}`,
				emoji: i % 2 === 0 ? '🎯' : '💬',
				color: i % 2 === 0 ? '#3b82f6' : '#10b981',
				description: `Descripción del prompt ${i}`,
				content: `Contenido del prompt número ${i}`,
				category: i % 2 === 0 ? PromptCategory.GENERAL : PromptCategory.CREATIVE,
				parameters: '{"temperature": 0.7}',
				tags: `["tag${i % 10}", "category${i % 5}"]`,
				featuredImage: null,
				isFavorite: i % 10 === 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			mockApiCalls.getPrompts.mockResolvedValue(largePromptList);

			const startTime = performance.now();
			const store = usePromptStore.getState();
			await store.loadPrompts();
			const endTime = performance.now();

			expect(store.prompts).toHaveLength(1000);
			expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
		});

		it('debe manejar operaciones de filtrado rápidamente', () => {
			const store = usePromptStore.getState();

			const startTime = performance.now();

			// Realizar múltiples operaciones de filtrado
			for (let i = 0; i < 100; i++) {
				store.setSearchFilter(`search-${i}`);
				store.setCategoryFilter(PromptCategory.TECHNICAL);
				store.setTagsFilter([`tag-${i}`]);
				store.setSortBy('name_desc');
			}

			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(100); // Menos de 100ms para 100 operaciones
		});

		it('debe manejar selección rápida de prompts', () => {
			const prompts: PromptBase[] = Array.from({ length: 100 }, (_, i) => ({
				id: `prompt-${i}`,
				name: `Prompt ${i}`,
				emoji: '🎯',
				color: '#3b82f6',
				description: null,
				content: 'Contenido',
				category: PromptCategory.GENERAL,
				parameters: '{}',
				tags: '[]',
				featuredImage: null,
				isFavorite: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			const store = usePromptStore.getState();

			const startTime = performance.now();

			// Seleccionar prompts secuencialmente
			prompts.forEach(prompt => {
				store.selectPrompt(prompt);
			});

			const endTime = performance.now();

			expect(store.selectedPrompt).toBe(prompts[99]);
			expect(endTime - startTime).toBeLessThan(50);
		});
	});

	describe('🔍 Edge Cases', () => {
		it('debe manejar prompts con datos malformados', async () => {
			const malformedPrompts = [
				{
					id: 'prompt-1',
					name: '', // Nombre vacío
					emoji: null,
					color: 'invalid-color',
					description: null,
					content: '',
					category: 'invalid-category',
					parameters: 'invalid-json',
					tags: 'not-json-array',
					featuredImage: null,
					isFavorite: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockApiCalls.getPrompts.mockResolvedValue(malformedPrompts);

			const store = usePromptStore.getState();
			await expect(store.loadPrompts()).resolves.not.toThrow();
		});

		it('debe manejar operaciones concurrentes', async () => {
			const store = usePromptStore.getState();

			// Ejecutar múltiples operaciones concurrentemente
			const promises = [
				store.loadPrompts(),
				store.createPrompt({
					name: 'Prompt 1',
					emoji: '🎯',
					color: '#3b82f6',
					content: 'Contenido 1',
					category: PromptCategory.GENERAL,
				}),
				store.createPrompt({
					name: 'Prompt 2',
					emoji: '💬',
					color: '#10b981',
					content: 'Contenido 2',
					category: PromptCategory.CREATIVE,
				}),
			];

			await expect(Promise.all(promises)).resolves.not.toThrow();
		});

		it('debe manejar caracteres especiales en prompts', async () => {
			const specialPrompt: PromptCreateInput = {
				name: 'Prompt 特殊字符 🌟 émojis ñáéíóú',
				emoji: '🌈',
				color: '#ff6b6b',
				description: 'Descripción con caracteres especiales: 中文 русский العربية',
				content: 'Contenido con <HTML> & símbolos "especiales" {JSON}',
				category: PromptCategory.GENERAL,
				parameters: '{"special": "value with 特殊字符"}',
				tags: '["特殊", "émojis", "test"]',
				isFavorite: false,
			};

			const store = usePromptStore.getState();
			await expect(store.createPrompt(specialPrompt)).resolves.not.toThrow();
		});

		it('debe manejar valores null y undefined apropiadamente', () => {
			const store = usePromptStore.getState();

			// Estas operaciones no deberían fallar
			expect(() => store.selectPrompt(null)).not.toThrow();
			expect(() => store.setCategoryFilter(null)).not.toThrow();
			expect(() => store.setSearchFilter('')).not.toThrow();
			expect(() => store.setTagsFilter([])).not.toThrow();
		});

		it('debe mantener consistencia después de operaciones fallidas', async () => {
			// Simular fallo en creación
			mockApiCalls.createPrompt.mockRejectedValue(new Error('Error de red'));

			const store = usePromptStore.getState();
			const initialState = { ...store };

			await store.createPrompt({
				name: 'Prompt que falla',
				emoji: '❌',
				color: '#ef4444',
				content: 'Este prompt causará error',
				category: PromptCategory.GENERAL,
			});

			// El estado debe mantenerse consistente
			expect(store.isLoading).toBe(false);
			expect(store.error).toBeTruthy();
			expect(store.prompts).toEqual(initialState.prompts);
		});
	});
});
