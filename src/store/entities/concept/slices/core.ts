import { conceptsApi } from '@/lib/api/services/concepts';
import { clientLogger } from '@/lib/logger/client-logger';
import type { ConceptCreateInput, ConceptUpdateInput, ConceptWithStats } from '@/types/entities/concept/types';
import type { StateCreator } from 'zustand';
import type { ConceptStore } from '../types';

const coreLogger = clientLogger.withContext('ConceptStore:Core');

export interface CoreSlice {
	// Estado
	concepts: ConceptWithStats[];
	selectedConcept: ConceptWithStats | null;
	isLoading: boolean;
	error: string | null;

	// Acciones
	loadConcepts: () => Promise<void>;
	setConcepts: (concepts: ConceptWithStats[]) => void;
	createConcept: (concept: ConceptCreateInput) => Promise<void>;
	updateConcept: (id: string, concept: ConceptUpdateInput) => Promise<void>;
	deleteConcept: (id: string) => Promise<void>;
	selectConcept: (concept: ConceptWithStats | null) => void;
	reset: () => void;
}

export const createCoreSlice: StateCreator<ConceptStore, [], [], CoreSlice> = (set, get) => ({
	// Estado inicial
	concepts: [],
	selectedConcept: null,
	isLoading: false,
	error: null,

	// Acciones
	loadConcepts: async () => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🔄 Cargando conceptos');

			// Llamar a API para obtener conceptos
			const concepts = await conceptsApi.getAll({});

			set({ concepts, isLoading: false });
			coreLogger.info('✅ Conceptos cargados:', { count: concepts.length });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar conceptos';
			coreLogger.error('❌ Error al cargar conceptos:', error);
			set({ error: message, isLoading: false });
		}
	},

	setConcepts: (concepts) => {
		coreLogger.info('📥 Estableciendo conceptos manualmente:', { count: concepts.length });
		set({ concepts, isLoading: false });
	},

	createConcept: async (concept) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('✨ Creando concepto:', concept);

			// Llamar a API para crear concepto
			const newConcept = await conceptsApi.create(concept);
			if (newConcept) {
				await get().loadConcepts();
			}

			coreLogger.info('✅ Concepto creado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear concepto';
			coreLogger.error('❌ Error al crear concepto:', error);
			set({ error: message, isLoading: false });
		}
	},

	updateConcept: async (id, concept) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🔄 Actualizando concepto:', { id, ...concept });

			// Llamar a API para actualizar concepto
			const updatedConcept = await conceptsApi.update(id, concept);
			if (updatedConcept) {
				await get().loadConcepts();
			}

			coreLogger.info('✅ Concepto actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar concepto';
			coreLogger.error('❌ Error al actualizar concepto:', error);
			set({ error: message, isLoading: false });
		}
	},

	deleteConcept: async (id) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('🗑️ Eliminando concepto:', id);

			// Llamar a API para eliminar concepto
			await conceptsApi.delete(id);

			// Recargar conceptos para actualizar la lista
			await get().loadConcepts();

			// Si el concepto seleccionado es el que se eliminó, deseleccionarlo
			if (get().selectedConcept?.id === id) {
				set({ selectedConcept: null });
			}

			coreLogger.info('✅ Concepto eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar concepto';
			coreLogger.error('❌ Error al eliminar concepto:', error);
			set({ error: message, isLoading: false });
		}
	},

 selectConcept: (concept) => {
  coreLogger.info(concept ? `🔍 Seleccionando concepto: ${concept?.id ?? 'null'}` : '🧹 Limpiando selección de concepto');
  set({ selectedConcept: concept });
 },

	reset: () => {
		set({
			concepts: [],
			selectedConcept: null,
			isLoading: false,
			error: null,
		});
	},
});
