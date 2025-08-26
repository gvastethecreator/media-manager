import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { ComfyUIWorkflowService } from '@/services/workflow/comfyui.service';
import type { WorkflowWithStats, WorkflowExecutionContext } from '@/types/workflow';

type FilterBy = 'all' | 'favorite' | 'valid' | 'invalid';
type SortBy = 'name' | 'date' | 'complexity' | 'nodeCount';
type SortOrder = 'asc' | 'desc';

interface WorkflowState {
	// Estado de datos
	workflows: WorkflowWithStats[];
	currentWorkflow: WorkflowWithStats | null;
	executionContext: WorkflowExecutionContext | null;

	// Estados de carga
	isLoading: boolean;
	isImporting: boolean;
	isExecuting: boolean;

	// Errores
	error: string | null;
	importError: string | null;
	executionError: string | null;

	// Filtros y búsqueda
	searchQuery: string;
	filterBy: FilterBy;
	sortBy: SortBy;
	sortOrder: SortOrder;

	// Acciones
	loadWorkflows: () => Promise<void>;
	loadWorkflowsFromDirectory: (directoryPath: string) => Promise<void>;
	importWorkflowFile: (filePath: string) => Promise<void>;
	upsertWorkflow: (input: string | unknown, sourceName?: string) => Promise<WorkflowWithStats>;
	setCurrentWorkflow: (workflow: WorkflowWithStats | null) => void;
	toggleFavorite: (workflowId: string) => void;
	deleteWorkflow: (workflowId: string) => void;

	// Filtros y búsqueda
	setSearchQuery: (query: string) => void;
	setFilter: (filter: FilterBy) => void;
	setSorting: (sortBy: SortBy, sortOrder: SortOrder) => void;

	// Ejecución
	startExecution: (workflowId: string) => Promise<void>;
	stopExecution: () => void;

	// Utilidades
	clearError: () => void;
	refresh: () => Promise<void>;
	getFilteredWorkflows: () => WorkflowWithStats[];
}

export const useComfyUIWorkflowStore = create<WorkflowState>()(
	subscribeWithSelector((set, get) => ({
		// Estado inicial
		workflows: [],
		currentWorkflow: null,
		executionContext: null,
		isLoading: false,
		isImporting: false,
		isExecuting: false,
		error: null,
		importError: null,
		executionError: null,
		searchQuery: '',
		filterBy: 'all' as FilterBy,
		sortBy: 'name' as SortBy,
		sortOrder: 'asc' as SortOrder,

		// Cargar workflows desde storage/cache
		loadWorkflows: async () => {
			set({ isLoading: true, error: null });

			try {
				// TODO: Implementar carga desde base de datos o cache
				// Por ahora retorna array vacío
				const workflows: WorkflowWithStats[] = [];

				set({
					workflows,
					isLoading: false,
				});
			} catch (error) {
				console.error('Error loading workflows:', error);
				set({
					error: error instanceof Error ? error.message : 'Error loading workflows',
					isLoading: false,
				});
			}
		},

		// Cargar workflows desde directorio (no soportado en browser)
		loadWorkflowsFromDirectory: async (_directoryPath: string) => {
			set({ isLoading: false, error: 'Directorio no soportado en navegador' });
		},

		// Importar un archivo por ruta (no soportado en browser)
		importWorkflowFile: async (_filePath: string) => {
			set({ isImporting: false, importError: 'Importar por ruta no está disponible en navegador' });
		},

		// Upsert a partir de JSON (string u objeto)
		upsertWorkflow: async (input: string | unknown, sourceName = 'inline') => {
			const current = get().workflows;
			const parsed =
				typeof input === 'string'
					? ComfyUIWorkflowService.parseWorkflowFromString(input, sourceName)
					: ComfyUIWorkflowService.parseWorkflowFromObject(input as any, sourceName);

			if (!parsed) throw new Error('Workflow inválido');

			const idx = current.findIndex((w) => w.filePath === parsed.filePath || w.fileName === parsed.fileName);
			const updated: WorkflowWithStats[] =
				idx >= 0
					? (() => {
							const arr = [...current];
							arr[idx] = parsed;
							return arr;
						})()
					: [...current, parsed];

			set({ workflows: updated });
			return parsed;
		},

		// Establecer workflow actual
		setCurrentWorkflow: (workflow: WorkflowWithStats | null) => {
			set({
				currentWorkflow: workflow,
				executionContext: workflow ? ComfyUIWorkflowService.createExecutionContext(workflow.id) : null,
			});
		},

		// Toggle favorito
		toggleFavorite: (workflowId: string) => {
			const workflows = get().workflows.map((w) =>
				w.id === workflowId
					? {
							...w,
							// Agregar soporte para favoritos en el tipo
							isFavorite: !(w as any).isFavorite,
						}
					: w
			);

			set({ workflows });
		},

		// Eliminar workflow
		deleteWorkflow: (workflowId: string) => {
			const workflows = get().workflows.filter((w) => w.id !== workflowId);
			const currentWorkflow = get().currentWorkflow;

			set({
				workflows,
				currentWorkflow: currentWorkflow?.id === workflowId ? null : currentWorkflow,
			});
		},

		// Establecer query de búsqueda
		setSearchQuery: (query: string) => {
			set({ searchQuery: query });
		},

		// Establecer filtro
		setFilter: (filter: FilterBy) => {
			set({ filterBy: filter });
		},

		// Establecer ordenamiento
		setSorting: (sortBy: SortBy, sortOrder: SortOrder) => {
			set({ sortBy, sortOrder });
		},

		// Iniciar ejecución (placeholder)
		startExecution: async (workflowId: string) => {
			const workflow = get().workflows.find((w) => w.id === workflowId);
			if (!workflow) {
				throw new Error('Workflow not found');
			}

			set({
				isExecuting: true,
				executionError: null,
				executionContext: {
					workflowId,
					status: 'running',
					progress: 0,
					startTime: new Date(),
					errors: [],
				},
			});

			// TODO: Implementar ejecución real del workflow
			console.log('Starting workflow execution:', workflowId);
		},

		// Detener ejecución
		stopExecution: () => {
			const ctx = get().executionContext;
			set({
				isExecuting: false,
				executionContext: ctx ? { ...ctx, status: 'idle', endTime: new Date() } : null,
			});
		},

		// Limpiar errores
		clearError: () => {
			set({
				error: null,
				importError: null,
				executionError: null,
			});
		},

		// Refrescar datos
		refresh: async () => {
			await get().loadWorkflows();
		},

		// Obtener workflows filtrados
		getFilteredWorkflows: () => {
			const { workflows, searchQuery, filterBy, sortBy, sortOrder } = get();

			let filtered = workflows;

			// Filtrar por búsqueda
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				filtered = filtered.filter(
					(w) =>
						w.fileName.toLowerCase().includes(query) ||
						(w.extra?.info?.name || '').toLowerCase().includes(query) ||
						(w.extra?.info?.description || '').toLowerCase().includes(query)
				);
			}

			// Filtrar por tipo
			switch (filterBy) {
				case 'favorite':
					filtered = filtered.filter((w) => (w as any).isFavorite);
					break;
				case 'valid':
					filtered = filtered.filter((w) => {
						const validation = ComfyUIWorkflowService.validateWorkflowForExecution(w);
						return validation.isValid;
					});
					break;
				case 'invalid':
					filtered = filtered.filter((w) => {
						const validation = ComfyUIWorkflowService.validateWorkflowForExecution(w);
						return !validation.isValid;
					});
					break;
				default:
					break;
			}

			// Ordenar
			filtered.sort((a, b) => {
				let compareValue = 0;

				switch (sortBy) {
					case 'name':
						compareValue = a.fileName.localeCompare(b.fileName);
						break;
					case 'date':
						compareValue = a.updatedAt.getTime() - b.updatedAt.getTime();
						break;
					case 'complexity':
						{
							const complexityA = ComfyUIWorkflowService.calculateComplexity(a);
							const complexityB = ComfyUIWorkflowService.calculateComplexity(b);
							compareValue = complexityA.score - complexityB.score;
						}
						break;
					case 'nodeCount':
						compareValue = a.stats.nodeCount - b.stats.nodeCount;
						break;
					default:
						break;
				}

				return sortOrder === 'desc' ? -compareValue : compareValue;
			});

			return filtered;
		},
	}))
);
