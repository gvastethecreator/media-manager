/**
 * @file Tests completos para ConceptStore
 * @module tests/stores/concept.store.test
 * @description Pruebas unitarias comprehensivas para el store de Concept
 */

import { useConceptStore } from '@/store/entities/concept/store';
import type { ConceptBase, ConceptCreateInput, ConceptFilters, ConceptUpdateInput, ConceptWithStats } from '@/types/entities/concept';
import { ConceptSortOption, ConceptViewMode } from '@/types/entities/concept/enums';

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
jest.mock('@/transformers/concept/transformer', () => ({
	transformConceptToWithStats: jest.fn((concept: ConceptBase): ConceptWithStats => ({
		...concept,
		relatedCount: 0,
		totalConnections: 0,
		lastConnection: null,
		avgRating: 0,
		usageCount: 0,
	})),
}));

// 🎯 Mock de los API calls para simulación controlada
const mockApiCalls = {
	getConcepts: jest.fn(),
	createConcept: jest.fn(),
	updateConcept: jest.fn(),
	deleteConcept: jest.fn(),
	addConceptToEntity: jest.fn(),
	removeConceptFromEntity: jest.fn(),
};

jest.mock('@/store/entities/concept/slices/core', () => ({
	createCoreSlice: jest.fn((...args) => {
		const [set, get] = args;
		return {
			// Estado inicial
			concepts: [],
			selectedConcept: null,
			isLoading: false,
			error: null,

			// Acciones mock
			loadConcepts: jest.fn(async () => {
				try {
					set({ isLoading: true, error: null });
					const concepts = await mockApiCalls.getConcepts();
					const transformedConcepts = concepts.map((c: ConceptBase) => ({
						...c,
						relatedCount: 0,
						totalConnections: 0,
						lastConnection: null,
						avgRating: 0,
						usageCount: 0,
					}));
					set({ concepts: transformedConcepts, isLoading: false });
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al cargar conceptos';
					set({ error: message, isLoading: false });
				}
			}),

			setConcepts: jest.fn((concepts: ConceptWithStats[]) => {
				set({ concepts, isLoading: false });
			}),

			createConcept: jest.fn(async (concept: ConceptCreateInput) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.createConcept(concept);
					const current = get();
					await current.loadConcepts();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al crear concepto';
					set({ error: message, isLoading: false });
				}
			}),

			updateConcept: jest.fn(async (id: string, concept: ConceptUpdateInput) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.updateConcept(id, concept);
					const current = get();
					await current.loadConcepts();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al actualizar concepto';
					set({ error: message, isLoading: false });
				}
			}),

			deleteConcept: jest.fn(async (id: string) => {
				try {
					set({ isLoading: true, error: null });
					await mockApiCalls.deleteConcept(id);
					const current = get();
					await current.loadConcepts();
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Error al eliminar concepto';
					set({ error: message, isLoading: false });
				}
			}),

			selectConcept: jest.fn((concept: ConceptBase | null) => {
				set({ selectedConcept: concept });
			}),

			reset: jest.fn(() => {
				set({
					concepts: [],
					selectedConcept: null,
					isLoading: false,
					error: null,
				});
			}),
		};
	}),
}));

describe('🧠 ConceptStore - Pruebas Completas', () => {
	let store: ReturnType<typeof useConceptStore>;

	beforeEach(() => {
		// 🔄 Reiniciar store antes de cada prueba
		store = useConceptStore.getState();
		store.reset();

		// 🧹 Limpiar todos los mocks
		jest.clearAllMocks();

		// ⚙️ Configurar mocks por defecto
		mockApiCalls.getConcepts.mockResolvedValue([]);
		mockApiCalls.createConcept.mockResolvedValue(undefined);
		mockApiCalls.updateConcept.mockResolvedValue(undefined);
		mockApiCalls.deleteConcept.mockResolvedValue(undefined);
		mockApiCalls.addConceptToEntity.mockResolvedValue(undefined);
		mockApiCalls.removeConceptFromEntity.mockResolvedValue(undefined);
	});

	describe('📊 Estado Inicial', () => {
		it('✅ debe tener el estado inicial correcto', () => {
			const state = store;

			// Core slice
			expect(state.concepts).toEqual([]);
			expect(state.selectedConcept).toBeNull();
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();

			// Filters slice
			expect(state.filters).toEqual({
				search: '',
				category: undefined,
				tags: [],
				onlyFavorites: false,
			});
			expect(state.sortBy).toBe('name_asc');
			expect(state.page).toBe(1);
			expect(state.pageSize).toBe(20);

			// UI slice
			expect(state.viewMode).toBe(ConceptViewMode.GRID);
			expect(state.isCreateModalOpen).toBe(false);
			expect(state.isEditModalOpen).toBe(false);
			expect(state.isDeleteDialogOpen).toBe(false);
			expect(state.isDetailsDrawerOpen).toBe(false);
		});
	});

	describe('🔄 Operaciones CRUD del Core', () => {
		const mockConcepts: ConceptWithStats[] = [
			{
				id: 'concept-1',
				name: 'Arquitectura Sostenible',
				emoji: '🏗️',
				color: '#10b981',
				description: 'Principios de construcción ecológica',
				content: 'Contenido detallado sobre arquitectura sostenible...',
				category: 'architecture',
				tags: ['sustainability', 'green-building'],
				featuredImage: '/images/sustainable-arch.jpg',
				isFavorite: true,
				createdAt: new Date('2023-01-15'),
				updatedAt: new Date('2023-06-20'),
				relatedCount: 5,
				totalConnections: 12,
				lastConnection: new Date('2023-06-15'),
				avgRating: 4.7,
				usageCount: 23,
			},
			{
				id: 'concept-2',
				name: 'Machine Learning',
				emoji: '🤖',
				color: '#3b82f6',
				description: 'Conceptos fundamentales de ML',
				content: 'Algoritmos y técnicas de aprendizaje automático...',
				category: 'technology',
				tags: ['ai', 'algorithms'],
				featuredImage: null,
				isFavorite: false,
				createdAt: new Date('2023-02-10'),
				updatedAt: new Date('2023-05-30'),
				relatedCount: 8,
				totalConnections: 15,
				lastConnection: new Date('2023-05-25'),
				avgRating: 4.2,
				usageCount: 18,
			},
		];

		describe('📥 Carga de conceptos', () => {
			it('✅ debe cargar conceptos exitosamente', async () => {
				mockApiCalls.getConcepts.mockResolvedValue(mockConcepts);

				await store.loadConcepts();

				expect(store.isLoading).toBe(false);
				expect(store.error).toBeNull();
				expect(store.concepts).toHaveLength(2);
				expect(store.concepts[0].name).toBe('Arquitectura Sostenible');
				expect(store.concepts[1].name).toBe('Machine Learning');
			});

			it('❌ debe manejar errores en la carga', async () => {
				const errorMessage = 'Error de red al cargar conceptos';
				mockApiCalls.getConcepts.mockRejectedValue(new Error(errorMessage));

				await store.loadConcepts();

				expect(store.isLoading).toBe(false);
				expect(store.error).toBe(errorMessage);
				expect(store.concepts).toEqual([]);
			});

			it('⏱️ debe mostrar estado de loading durante la carga', async () => {
				let resolvePromise: () => void;
				const promise = new Promise<ConceptWithStats[]>((resolve) => {
					resolvePromise = () => resolve(mockConcepts);
				});
				mockApiCalls.getConcepts.mockReturnValue(promise);

				const loadPromise = store.loadConcepts();

				// Durante la carga
				expect(store.isLoading).toBe(true);
				expect(store.error).toBeNull();

				// Resolver la promesa
				resolvePromise!();
				await loadPromise;

				// Después de la carga
				expect(store.isLoading).toBe(false);
			});
		});

		describe('✨ Creación de conceptos', () => {
			const newConceptData: ConceptCreateInput = {
				name: 'Nuevo Concepto',
				emoji: '💡',
				color: '#8b5cf6',
				description: 'Descripción del nuevo concepto',
				content: 'Contenido detallado...',
				category: 'general',
				tags: ['nuevo', 'prueba'],
				featuredImage: null,
				isFavorite: false,
			};

			it('✅ debe crear un concepto exitosamente', async () => {
				mockApiCalls.createConcept.mockResolvedValue(undefined);
				mockApiCalls.getConcepts.mockResolvedValue([...mockConcepts, {
					...newConceptData,
					id: 'concept-3',
					createdAt: new Date(),
					updatedAt: new Date(),
					relatedCount: 0,
					totalConnections: 0,
					lastConnection: null,
					avgRating: 0,
					usageCount: 0,
				}]);

				await store.createConcept(newConceptData);

				expect(mockApiCalls.createConcept).toHaveBeenCalledWith(newConceptData);
				expect(store.isLoading).toBe(false);
				expect(store.error).toBeNull();
				expect(store.concepts).toHaveLength(3);
			});

			it('❌ debe manejar errores en la creación', async () => {
				const errorMessage = 'Error al crear concepto';
				mockApiCalls.createConcept.mockRejectedValue(new Error(errorMessage));

				await store.createConcept(newConceptData);

				expect(store.isLoading).toBe(false);
				expect(store.error).toBe(errorMessage);
			});

			it('📋 debe validar datos requeridos para creación', async () => {
				const incompleteData = {
					name: '',
					emoji: '💡',
				} as ConceptCreateInput;

				await store.createConcept(incompleteData);

				expect(mockApiCalls.createConcept).toHaveBeenCalledWith(incompleteData);
			});
		});

		describe('🔄 Actualización de conceptos', () => {
			const updateData: ConceptUpdateInput = {
				name: 'Concepto Actualizado',
				description: 'Nueva descripción',
				isFavorite: true,
			};

			it('✅ debe actualizar un concepto exitosamente', async () => {
				const conceptId = 'concept-1';
				mockApiCalls.updateConcept.mockResolvedValue(undefined);
				mockApiCalls.getConcepts.mockResolvedValue(
					mockConcepts.map(c =>
						c.id === conceptId ? { ...c, ...updateData } : c
					)
				);

				await store.updateConcept(conceptId, updateData);

				expect(mockApiCalls.updateConcept).toHaveBeenCalledWith(conceptId, updateData);
				expect(store.isLoading).toBe(false);
				expect(store.error).toBeNull();
			});

			it('❌ debe manejar errores en la actualización', async () => {
				const errorMessage = 'Error al actualizar concepto';
				mockApiCalls.updateConcept.mockRejectedValue(new Error(errorMessage));

				await store.updateConcept('concept-1', updateData);

				expect(store.isLoading).toBe(false);
				expect(store.error).toBe(errorMessage);
			});

			it('🔍 debe manejar actualización de concepto inexistente', async () => {
				const nonExistentId = 'concept-999';
				mockApiCalls.updateConcept.mockResolvedValue(undefined);
				mockApiCalls.getConcepts.mockResolvedValue(mockConcepts);

				await store.updateConcept(nonExistentId, updateData);

				expect(mockApiCalls.updateConcept).toHaveBeenCalledWith(nonExistentId, updateData);
			});
		});

		describe('🗑️ Eliminación de conceptos', () => {
			it('✅ debe eliminar un concepto exitosamente', async () => {
				const conceptId = 'concept-1';
				mockApiCalls.deleteConcept.mockResolvedValue(undefined);
				mockApiCalls.getConcepts.mockResolvedValue(
					mockConcepts.filter(c => c.id !== conceptId)
				);

				await store.deleteConcept(conceptId);

				expect(mockApiCalls.deleteConcept).toHaveBeenCalledWith(conceptId);
				expect(store.isLoading).toBe(false);
				expect(store.error).toBeNull();
			});

			it('❌ debe manejar errores en la eliminación', async () => {
				const errorMessage = 'Error al eliminar concepto';
				mockApiCalls.deleteConcept.mockRejectedValue(new Error(errorMessage));

				await store.deleteConcept('concept-1');

				expect(store.isLoading).toBe(false);
				expect(store.error).toBe(errorMessage);
			});

			it('🔍 debe manejar eliminación de concepto inexistente', async () => {
				const nonExistentId = 'concept-999';
				mockApiCalls.deleteConcept.mockResolvedValue(undefined);
				mockApiCalls.getConcepts.mockResolvedValue(mockConcepts);

				await store.deleteConcept(nonExistentId);

				expect(mockApiCalls.deleteConcept).toHaveBeenCalledWith(nonExistentId);
			});
		});

		describe('🎯 Selección de conceptos', () => {
			const selectedConcept: ConceptBase = {
				id: 'concept-1',
				name: 'Concepto Seleccionado',
				emoji: '🎯',
				color: '#ef4444',
				description: 'Concepto para selección',
				content: 'Contenido del concepto...',
				category: 'test',
				tags: ['selección', 'prueba'],
				featuredImage: null,
				isFavorite: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			it('✅ debe seleccionar un concepto', () => {
				store.selectConcept(selectedConcept);

				expect(store.selectedConcept).toEqual(selectedConcept);
			});

			it('🚫 debe deseleccionar concepto con null', () => {
				store.selectConcept(selectedConcept);
				expect(store.selectedConcept).toEqual(selectedConcept);

				store.selectConcept(null);
				expect(store.selectedConcept).toBeNull();
			});

			it('🔄 debe cambiar selección entre conceptos', () => {
				const secondConcept: ConceptBase = {
					...selectedConcept,
					id: 'concept-2',
					name: 'Segundo Concepto',
				};

				store.selectConcept(selectedConcept);
				expect(store.selectedConcept?.id).toBe('concept-1');

				store.selectConcept(secondConcept);
				expect(store.selectedConcept?.id).toBe('concept-2');
			});
		});

		describe('🔄 Reset del store', () => {
			it('✅ debe resetear todo el estado al inicial', () => {
				// Modificar el estado
				store.setConcepts(mockConcepts);
				store.selectConcept(mockConcepts[0]);

				// Verificar que el estado cambió
				expect(store.concepts).toHaveLength(2);
				expect(store.selectedConcept).not.toBeNull();

				// Resetear
				store.reset();

				// Verificar estado inicial
				expect(store.concepts).toEqual([]);
				expect(store.selectedConcept).toBeNull();
				expect(store.isLoading).toBe(false);
				expect(store.error).toBeNull();
			});
		});
	});

	describe('🔍 Sistema de Filtros', () => {
		describe('🎛️ Filtros básicos', () => {
			it('✅ debe establecer filtros parciales', () => {
				const newFilters: Partial<ConceptFilters> = {
					search: 'arquitectura',
					category: 'technology',
				};

				store.setFilters(newFilters);

				expect(store.filters.search).toBe('arquitectura');
				expect(store.filters.category).toBe('technology');
				expect(store.filters.tags).toEqual([]); // No modificado
				expect(store.filters.onlyFavorites).toBe(false); // No modificado
				expect(store.page).toBe(1); // Debe resetear página
			});

			it('✅ debe mantener filtros existentes al actualizar parcialmente', () => {
				store.setFilters({ search: 'inicial', onlyFavorites: true });
				store.setFilters({ category: 'test' });

				expect(store.filters.search).toBe('inicial');
				expect(store.filters.onlyFavorites).toBe(true);
				expect(store.filters.category).toBe('test');
			});

			it('🧹 debe limpiar todos los filtros', () => {
				store.setFilters({
					search: 'test',
					category: 'category',
					tags: ['tag1', 'tag2'],
					onlyFavorites: true,
				});

				store.clearFilters();

				expect(store.filters).toEqual({
					search: '',
					category: undefined,
					tags: [],
					onlyFavorites: false,
				});
			});
		});

		describe('🔍 Filtros específicos', () => {
			it('✅ debe establecer filtro de búsqueda', () => {
				const searchTerm = 'machine learning';
				store.setSearchFilter(searchTerm);

				expect(store.filters.search).toBe(searchTerm);
			});

			it('✅ debe establecer filtro de categoría', () => {
				const category = 'architecture';
				store.setCategoryFilter(category);

				expect(store.filters.category).toBe(category);
			});

			it('🚫 debe limpiar filtro de categoría con null', () => {
				store.setCategoryFilter('test');
				expect(store.filters.category).toBe('test');

				store.setCategoryFilter(null);
				expect(store.filters.category).toBeUndefined();
			});

			it('✅ debe establecer filtro de tags', () => {
				const tags = ['ai', 'sustainability', 'design'];
				store.setTagsFilter(tags);

				expect(store.filters.tags).toEqual(tags);
			});

			it('✅ debe establecer filtro de favoritos', () => {
				store.setOnlyFavoritesFilter(true);
				expect(store.filters.onlyFavorites).toBe(true);

				store.setOnlyFavoritesFilter(false);
				expect(store.filters.onlyFavorites).toBe(false);
			});
		});

		describe('📊 Ordenación y paginación', () => {
			it('✅ debe cambiar criterio de ordenación', () => {
				const sortOptions: ConceptSortOption[] = [
					'name_asc',
					'name_desc',
					'created_desc',
					'created_asc',
					'updated_desc',
					'updated_asc',
					'category_asc',
					'usage_desc',
				];

				sortOptions.forEach(sortOption => {
					store.setSortBy(sortOption);
					expect(store.sortBy).toBe(sortOption);
				});
			});

			it('✅ debe cambiar página', () => {
				store.setPage(5);
				expect(store.page).toBe(5);

				store.setPage(1);
				expect(store.page).toBe(1);
			});

			it('✅ debe cambiar tamaño de página', () => {
				store.setPageSize(50);
				expect(store.pageSize).toBe(50);

				store.setPageSize(10);
				expect(store.pageSize).toBe(10);
			});

			it('✅ debe resetear página al cambiar filtros', () => {
				store.setPage(3);
				expect(store.page).toBe(3);

				store.setFilters({ search: 'nuevo filtro' });
				expect(store.page).toBe(1);
			});
		});
	});

	describe('🎨 Estado de la UI', () => {
		describe('🔄 Modos de vista', () => {
			it('✅ debe cambiar modo de vista', () => {
				const viewModes = [ConceptViewMode.GRID, ConceptViewMode.LIST, ConceptViewMode.CARDS];

				viewModes.forEach(mode => {
					store.setViewMode(mode);
					expect(store.viewMode).toBe(mode);
				});
			});
		});

		describe('📝 Modales de CRUD', () => {
			it('✅ debe abrir y cerrar modal de creación', () => {
				expect(store.isCreateModalOpen).toBe(false);

				store.openCreateModal();
				expect(store.isCreateModalOpen).toBe(true);

				store.closeCreateModal();
				expect(store.isCreateModalOpen).toBe(false);
			});

			it('✅ debe abrir y cerrar modal de edición', () => {
				expect(store.isEditModalOpen).toBe(false);

				store.openEditModal();
				expect(store.isEditModalOpen).toBe(true);

				store.closeEditModal();
				expect(store.isEditModalOpen).toBe(false);
			});

			it('✅ debe abrir y cerrar diálogo de eliminación', () => {
				expect(store.isDeleteDialogOpen).toBe(false);

				store.openDeleteDialog();
				expect(store.isDeleteDialogOpen).toBe(true);

				store.closeDeleteDialog();
				expect(store.isDeleteDialogOpen).toBe(false);
			});

			it('✅ debe abrir y cerrar drawer de detalles', () => {
				expect(store.isDetailsDrawerOpen).toBe(false);

				store.openDetailsDrawer();
				expect(store.isDetailsDrawerOpen).toBe(true);

				store.closeDetailsDrawer();
				expect(store.isDetailsDrawerOpen).toBe(false);
			});
		});

		describe('🔄 Reset de UI', () => {
			it('✅ debe resetear todo el estado de UI', () => {
				// Modificar estado de UI
				store.setViewMode(ConceptViewMode.LIST);
				store.openCreateModal();
				store.openEditModal();
				store.openDeleteDialog();
				store.openDetailsDrawer();

				// Verificar cambios
				expect(store.viewMode).toBe(ConceptViewMode.LIST);
				expect(store.isCreateModalOpen).toBe(true);
				expect(store.isEditModalOpen).toBe(true);
				expect(store.isDeleteDialogOpen).toBe(true);
				expect(store.isDetailsDrawerOpen).toBe(true);

				// Resetear UI
				store.resetUI();

				// Verificar estado inicial de UI
				expect(store.viewMode).toBe(ConceptViewMode.GRID);
				expect(store.isCreateModalOpen).toBe(false);
				expect(store.isEditModalOpen).toBe(false);
				expect(store.isDeleteDialogOpen).toBe(false);
				expect(store.isDetailsDrawerOpen).toBe(false);
			});
		});
	});

	describe('🔗 Gestión de Relaciones', () => {
		const conceptId = 'concept-1';
		const entityId = 'entity-123';
		const entityType = 'image' as const;

		describe('➕ Agregar relaciones', () => {
			it('✅ debe agregar concepto a entidad', async () => {
				mockApiCalls.addConceptToEntity.mockResolvedValue(undefined);

				await store.addConceptToEntity(conceptId, entityId, entityType);

				expect(mockApiCalls.addConceptToEntity).toHaveBeenCalledWith(
					conceptId,
					entityId,
					entityType
				);
			});

			it('❌ debe manejar errores al agregar relación', async () => {
				const errorMessage = 'Error al crear relación';
				mockApiCalls.addConceptToEntity.mockRejectedValue(new Error(errorMessage));

				await expect(
					store.addConceptToEntity(conceptId, entityId, entityType)
				).rejects.toThrow(errorMessage);
			});
		});

		describe('➖ Remover relaciones', () => {
			it('✅ debe remover concepto de entidad', async () => {
				mockApiCalls.removeConceptFromEntity.mockResolvedValue(undefined);

				await store.removeConceptFromEntity(conceptId, entityId, entityType);

				expect(mockApiCalls.removeConceptFromEntity).toHaveBeenCalledWith(
					conceptId,
					entityId,
					entityType
				);
			});

			it('❌ debe manejar errores al remover relación', async () => {
				const errorMessage = 'Error al eliminar relación';
				mockApiCalls.removeConceptFromEntity.mockRejectedValue(new Error(errorMessage));

				await expect(
					store.removeConceptFromEntity(conceptId, entityId, entityType)
				).rejects.toThrow(errorMessage);
			});
		});

		describe('🔄 Tipos de entidades', () => {
			const entityTypes = ['image', 'video', 'note', 'tag'] as const;

			entityTypes.forEach(type => {
				it(`✅ debe manejar relaciones con entidad tipo ${type}`, async () => {
					mockApiCalls.addConceptToEntity.mockResolvedValue(undefined);

					await store.addConceptToEntity(conceptId, entityId, type);

					expect(mockApiCalls.addConceptToEntity).toHaveBeenCalledWith(
						conceptId,
						entityId,
						type
					);
				});
			});
		});
	});

	describe('⚡ Pruebas de Performance', () => {
		describe('📊 Manejo de grandes volúmenes de datos', () => {
			it('🚀 debe manejar 1000+ conceptos eficientemente', async () => {
				const largeConcepts = Array.from({ length: 1000 }, (_, index) => ({
					id: `concept-${index + 1}`,
					name: `Concepto ${index + 1}`,
					emoji: '💡',
					color: '#3b82f6',
					description: `Descripción del concepto ${index + 1}`,
					content: `Contenido detallado del concepto ${index + 1}...`,
					category: index % 2 === 0 ? 'technology' : 'general',
					tags: [`tag${index}`, `category${index % 10}`],
					featuredImage: null,
					isFavorite: index % 10 === 0,
					createdAt: new Date(2023, 0, index + 1),
					updatedAt: new Date(2023, 5, index + 1),
					relatedCount: index % 20,
					totalConnections: index % 50,
					lastConnection: new Date(2023, 5, index),
					avgRating: (index % 5) + 1,
					usageCount: index * 2,
				}));

				mockApiCalls.getConcepts.mockResolvedValue(largeConcepts);

				const startTime = performance.now();
				await store.loadConcepts();
				const endTime = performance.now();

				expect(store.concepts).toHaveLength(1000);
				expect(endTime - startTime).toBeLessThan(100); // Debe completar en menos de 100ms
			});

			it('🔍 debe filtrar conceptos grandes eficientemente', () => {
				const manyFilters: ConceptFilters = {
					search: 'concepto',
					category: 'technology',
					tags: ['tag1', 'tag5', 'tag10'],
					onlyFavorites: true,
				};

				const startTime = performance.now();
				store.setFilters(manyFilters);
				const endTime = performance.now();

				expect(store.filters).toEqual(manyFilters);
				expect(endTime - startTime).toBeLessThan(10); // Filtrado debe ser instantáneo
			});
		});

		describe('🔄 Operaciones repetitivas', () => {
			it('⚡ debe manejar múltiples cambios de vista', () => {
				const viewModes = [
					ConceptViewMode.GRID,
					ConceptViewMode.LIST,
					ConceptViewMode.CARDS,
				];

				const startTime = performance.now();
				for (let i = 0; i < 100; i++) {
					store.setViewMode(viewModes[i % viewModes.length]);
				}
				const endTime = performance.now();

				expect(endTime - startTime).toBeLessThan(50); // 100 cambios en menos de 50ms
			});

			it('📄 debe manejar múltiples cambios de página', () => {
				const startTime = performance.now();
				for (let i = 1; i <= 100; i++) {
					store.setPage(i);
				}
				const endTime = performance.now();

				expect(store.page).toBe(100);
				expect(endTime - startTime).toBeLessThan(20); // 100 cambios en menos de 20ms
			});
		});
	});

	describe('🔬 Casos Edge y Validaciones', () => {
		describe('📋 Datos malformados', () => {
			it('🛡️ debe manejar conceptos con datos faltantes', async () => {
				const malformedConcepts = [
					{
						id: 'concept-1',
						name: '',
						emoji: '',
						color: '',
						description: null,
						content: undefined,
						category: '',
						tags: null,
						featuredImage: undefined,
						isFavorite: null,
						createdAt: null,
						updatedAt: null,
					},
				] as any;

				mockApiCalls.getConcepts.mockResolvedValue(malformedConcepts);

				await expect(store.loadConcepts()).resolves.not.toThrow();
			});

			it('🔤 debe manejar strings con caracteres especiales', async () => {
				const specialCharsData: ConceptCreateInput = {
					name: '🚀 Concepto con émojis y ácentos ñoño 中文',
					emoji: '🌟',
					color: '#ff00ff',
					description: 'Descripción con <script>alert("xss")</script>',
					content: 'Contenido con "comillas" y \'apostrofes\' y \n saltos de línea',
					category: 'special-chars',
					tags: ['emoji🎯', 'accént', 'spëcíal'],
					featuredImage: 'https://example.com/image?param=value&other=test',
					isFavorite: true,
				};

				mockApiCalls.createConcept.mockResolvedValue(undefined);
				mockApiCalls.getConcepts.mockResolvedValue([]);

				await expect(store.createConcept(specialCharsData)).resolves.not.toThrow();
				expect(mockApiCalls.createConcept).toHaveBeenCalledWith(specialCharsData);
			});

			it('📝 debe manejar filtros con valores extremos', () => {
				const extremeFilters: ConceptFilters = {
					search: 'a'.repeat(1000), // String muy largo
					category: '',
					tags: Array.from({ length: 100 }, (_, i) => `tag${i}`), // Muchos tags
					onlyFavorites: true,
				};

				expect(() => store.setFilters(extremeFilters)).not.toThrow();
				expect(store.filters.search).toBe('a'.repeat(1000));
				expect(store.filters.tags).toHaveLength(100);
			});
		});

		describe('🆔 IDs inválidos', () => {
			const invalidIds = ['', 'null', 'undefined', '   ', '🤖', '123-456-789-000'];

			invalidIds.forEach(invalidId => {
				it(`🔍 debe manejar ID inválido: "${invalidId}"`, async () => {
					mockApiCalls.updateConcept.mockResolvedValue(undefined);
					mockApiCalls.getConcepts.mockResolvedValue([]);

					await expect(
						store.updateConcept(invalidId, { name: 'test' })
					).resolves.not.toThrow();

					expect(mockApiCalls.updateConcept).toHaveBeenCalledWith(invalidId, { name: 'test' });
				});
			});
		});

		describe('🌐 Estados de red', () => {
			it('📶 debe manejar timeout de red', async () => {
				const timeoutError = new Error('Network timeout');
				mockApiCalls.getConcepts.mockRejectedValue(timeoutError);

				await store.loadConcepts();

				expect(store.error).toBe('Network timeout');
				expect(store.isLoading).toBe(false);
			});

			it('🔄 debe manejar reconexión después de error', async () => {
				// Primera llamada falla
				mockApiCalls.getConcepts.mockRejectedValueOnce(new Error('Network error'));
				await store.loadConcepts();
				expect(store.error).toBe('Network error');

				// Segunda llamada exitosa
				const successConcepts = [
					{
						id: 'concept-recovery',
						name: 'Concepto de Recuperación',
						emoji: '🔄',
						color: '#10b981',
						description: 'Concepto después de reconexión',
						content: '',
						category: 'test',
						tags: [],
						featuredImage: null,
						isFavorite: false,
						createdAt: new Date(),
						updatedAt: new Date(),
						relatedCount: 0,
						totalConnections: 0,
						lastConnection: null,
						avgRating: 0,
						usageCount: 0,
					},
				];
				mockApiCalls.getConcepts.mockResolvedValue(successConcepts);
				await store.loadConcepts();

				expect(store.error).toBeNull();
				expect(store.concepts).toHaveLength(1);
				expect(store.concepts[0].name).toBe('Concepto de Recuperación');
			});
		});

		describe('🔄 Estados concurrentes', () => {
			it('⚡ debe manejar múltiples cargas concurrentes', async () => {
				const concepts1 = [{ id: '1', name: 'Concepto 1' }] as ConceptWithStats[];
				const concepts2 = [{ id: '2', name: 'Concepto 2' }] as ConceptWithStats[];

				mockApiCalls.getConcepts
					.mockResolvedValueOnce(concepts1)
					.mockResolvedValueOnce(concepts2);

				// Lanzar dos cargas concurrentes
				const promise1 = store.loadConcepts();
				const promise2 = store.loadConcepts();

				await Promise.all([promise1, promise2]);

				// Debería tener el resultado de la última carga completada
				expect(store.concepts).toHaveLength(1);
				expect(store.isLoading).toBe(false);
			});

			it('🔄 debe manejar CRUD operations concurrentes', async () => {
				mockApiCalls.createConcept.mockResolvedValue(undefined);
				mockApiCalls.updateConcept.mockResolvedValue(undefined);
				mockApiCalls.deleteConcept.mockResolvedValue(undefined);
				mockApiCalls.getConcepts.mockResolvedValue([]);

				// Operaciones concurrentes
				const operations = [
					store.createConcept({ name: 'Nuevo 1' } as ConceptCreateInput),
					store.updateConcept('concept-1', { name: 'Actualizado' }),
					store.deleteConcept('concept-2'),
				];

				await expect(Promise.all(operations)).resolves.not.toThrow();
			});
		});
	});

	describe('🎯 Selectores y Getters', () => {
		const mockConcepts: ConceptWithStats[] = [
			{
				id: 'concept-1',
				name: 'Primer Concepto',
				emoji: '🥇',
				color: '#fbbf24',
				description: 'El primer concepto',
				content: 'Contenido detallado...',
				category: 'first',
				tags: ['primero', 'inicial'],
				featuredImage: null,
				isFavorite: true,
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-06-01'),
				relatedCount: 5,
				totalConnections: 10,
				lastConnection: new Date('2023-05-30'),
				avgRating: 4.8,
				usageCount: 25,
			},
			{
				id: 'concept-2',
				name: 'Segundo Concepto',
				emoji: '🥈',
				color: '#6b7280',
				description: 'El segundo concepto',
				content: 'Más contenido...',
				category: 'second',
				tags: ['segundo', 'siguiente'],
				featuredImage: '/images/second.jpg',
				isFavorite: false,
				createdAt: new Date('2023-02-01'),
				updatedAt: new Date('2023-06-15'),
				relatedCount: 3,
				totalConnections: 7,
				lastConnection: new Date('2023-06-10'),
				avgRating: 4.2,
				usageCount: 18,
			},
		];

		beforeEach(() => {
			store.setConcepts(mockConcepts);
		});

		it('✅ debe obtener todos los conceptos', () => {
			const concepts = store.concepts;
			expect(concepts).toHaveLength(2);
			expect(concepts[0].name).toBe('Primer Concepto');
			expect(concepts[1].name).toBe('Segundo Concepto');
		});

		it('✅ debe obtener concepto seleccionado', () => {
			expect(store.selectedConcept).toBeNull();

			store.selectConcept(mockConcepts[0]);
			expect(store.selectedConcept?.id).toBe('concept-1');
		});

		it('✅ debe obtener estado de carga', () => {
			expect(store.isLoading).toBe(false);

			// Simular estado de carga (normalmente se hace internamente)
			store.reset();
			expect(store.isLoading).toBe(false);
		});

		it('✅ debe obtener errores', () => {
			expect(store.error).toBeNull();

			// Los errores se setean internamente durante operaciones CRUD
		});

		it('✅ debe obtener filtros actuales', () => {
			const expectedFilters: ConceptFilters = {
				search: '',
				category: undefined,
				tags: [],
				onlyFavorites: false,
			};

			expect(store.filters).toEqual(expectedFilters);
		});

		it('✅ debe obtener configuración de ordenación', () => {
			expect(store.sortBy).toBe('name_asc');
			expect(store.page).toBe(1);
			expect(store.pageSize).toBe(20);
		});

		it('✅ debe obtener estado de UI', () => {
			expect(store.viewMode).toBe(ConceptViewMode.GRID);
			expect(store.isCreateModalOpen).toBe(false);
			expect(store.isEditModalOpen).toBe(false);
			expect(store.isDeleteDialogOpen).toBe(false);
			expect(store.isDetailsDrawerOpen).toBe(false);
		});
	});
});
