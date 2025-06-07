import { clientLogger } from '@/lib/logger/client-logger';
import { transformConceptToWithStats } from '@/transformers/concept/transformer';
import type { ConceptBase, ConceptCreateInput, ConceptUpdateInput, ConceptWithStats } from '@/types/entities/concept';
import type { StateCreator } from 'zustand';
import { createConcept, deleteConcept, searchConcepts, updateConcept } from '../../../../app/actions/concepts/concept.actions';
import type { ConceptStore } from '../types';

const coreLogger = clientLogger.withContext('ConceptStore:Core');

export interface CoreSlice {
	// Estado
	concepts: ConceptWithStats[];
	selectedConcept: ConceptBase | null;
	isLoading: boolean;
	error: string | null;

	// Acciones
	loadConcepts: () => Promise<void>;
	setConcepts: (concepts: ConceptWithStats[]) => void;
	createConcept: (concept: ConceptCreateInput) => Promise<void>;
	updateConcept: (id: string, concept: ConceptUpdateInput) => Promise<void>;
	deleteConcept: (id: string) => Promise<void>;
	selectConcept: (concept: ConceptBase | null) => void;
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

			// Llamar a server action para obtener conceptos
			const results = await searchConcepts();
			const concepts = results.data; // Asumiendo que searchConcepts devuelve un objeto con una propiedad 'data'

			// Transformar resultados con la función correcta
			const transformedConcepts = concepts.map(transformConceptToWithStats);

			set({ concepts: transformedConcepts, isLoading: false });
			coreLogger.info('✅ Conceptos cargados:', { count: transformedConcepts.length });
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

			// Llamar a server action para crear concepto
			const newConcept = await createConcept(concept);
			if (newConcept) {
				// Aquí podrías añadir el nuevo concepto directamente al store
				// o recargar todos los conceptos si es más sencillo para mantener la consistencia.
				// Por simplicidad, recargaremos todos los conceptos.
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

			// Llamar a server action para actualizar concepto
			const updatedConcept = await updateConcept(id, concept);
			if (updatedConcept) {
				// Aquí podrías actualizar el concepto directamente en el store
				// o recargar todos los conceptos si es más sencillo para mantener la consistencia.
				// Por simplicidad, recargaremos todos los conceptos.
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

			// Llamar a server action para eliminar concepto
			await deleteConcept(id);

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
		coreLogger.info(concept ? `🔍 Seleccionando concepto: ${concept.id}` : '🧹 Limpiando selección de concepto');
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
