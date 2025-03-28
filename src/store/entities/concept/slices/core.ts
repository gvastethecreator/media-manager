import { serverLogger } from '@/lib/logger/server-logger';
import { toConceptWithStats } from '@/transformers/concept';
import type { ConceptBase, ConceptCreateInput, ConceptUpdateInput, ConceptWithStats } from '@/types/entities/concept';
import type { StateCreator } from 'zustand';
import type { ConceptStore } from '../types';

const coreLogger = serverLogger.withContext('ConceptStore:Core');

export interface CoreSlice {
	// Estado
	concepts: ConceptWithStats[];
	selectedConcept: ConceptBase | null;
	isLoading: boolean;
	error: string | null;

	// Acciones
	loadConcepts: () => Promise<void>;
	createConcept: (concept: ConceptCreateInput) => Promise<void>;
	updateConcept: (id: string, concept: ConceptUpdateInput) => Promise<void>;
	deleteConcept: (id: string) => Promise<void>;
	selectConcept: (concept: ConceptBase | null) => void;
	reset: () => void;
}

// Acciones mock para desarrollo (se reemplazarán con server actions)
const mockApi = {
	getConcepts: async (): Promise<ConceptWithStats[]> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return [];
	},

	createConcept: async (concept: ConceptCreateInput): Promise<ConceptBase> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return {
			id: `concept-${Date.now()}`,
			name: concept.name,
			emoji: concept.emoji || '💡',
			color: concept.color || '#3b82f6',
			description: concept.description || null,
			content: concept.content || '',
			category: concept.category || 'general',
			tags: concept.tags || 'empty_array',
			featuredImage: concept.featuredImage || null,
			isFavorite: concept.isFavorite || false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	},

	updateConcept: async (id: string, concept: ConceptUpdateInput): Promise<ConceptBase> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return {
			id,
			name: concept.name || 'Concepto actualizado',
			emoji: concept.emoji || '💡',
			color: concept.color || '#3b82f6',
			description: concept.description || null,
			content: concept.content || '',
			category: concept.category || 'general',
			tags: concept.tags || 'empty_array',
			featuredImage: concept.featuredImage || null,
			isFavorite: concept.isFavorite || false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	},

	deleteConcept: async (id: string): Promise<void> => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
};

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
			const concepts = await mockApi.getConcepts();

			// Transformar resultados si es necesario
			const transformedConcepts = concepts.map(toConceptWithStats);

			set({ concepts: transformedConcepts, isLoading: false });
			coreLogger.info('✅ Conceptos cargados:', { count: transformedConcepts.length });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar conceptos';
			coreLogger.error('❌ Error al cargar conceptos:', error);
			set({ error: message, isLoading: false });
		}
	},

	createConcept: async (concept) => {
		try {
			set({ isLoading: true, error: null });
			coreLogger.info('✨ Creando concepto:', concept);

			// Llamar a server action para crear concepto
			await mockApi.createConcept(concept);

			// Recargar conceptos para actualizar la lista
			await get().loadConcepts();

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
			await mockApi.updateConcept(id, concept);

			// Recargar conceptos para actualizar la lista
			await get().loadConcepts();

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
			await mockApi.deleteConcept(id);

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
