import {
	type ConceptCreate,
	type ConceptUpdate,
	type ConceptWithStats,
	addConceptToImage,
	createConcept as createConceptAction,
	deleteConcept as deleteConceptAction,
	getConcepts,
	updateConcept as updateConceptAction,
} from '@/app/actions/concepts/concept.actions';
import { logger } from '@/lib/logger/logger';
import type { Concept } from '@prisma/client';
import { create } from 'zustand';

const conceptLogger = logger.withContext('ConceptStore');

const mapToConceptWithStats = (concept: Awaited<ReturnType<typeof getConcepts>>[0]): ConceptWithStats => ({
	...concept,
	_count: concept._count || {
		prompts: 0,
		notes: 0,
		characters: 0,
		places: 0,
		worldItems: 0,
	},
	lastUpdated: new Date(),
});

interface ConceptStore {
	concepts: ConceptWithStats[];
	isLoading: boolean;
	error: string | null;
	selectedItem: Concept | null;
	loadConcepts: () => Promise<void>;
	createConcept: typeof createConceptAction;
	updateConcept: typeof updateConceptAction;
	deleteConcept: (id: string) => Promise<void>;
	addConceptToImage: (imageId: string, conceptId: string) => Promise<void>;
	selectItem: (concept: Concept) => void;
}

export const useConceptStore = create<ConceptStore>((set, get) => ({
	concepts: [],
	isLoading: false,
	error: null,
	selectedItem: null,

	loadConcepts: async () => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('Cargando conceptos');
			const rawConcepts = await getConcepts();
			const concepts = rawConcepts.map(mapToConceptWithStats);
			set({ concepts, isLoading: false });
			conceptLogger.info('✅ Conceptos cargados');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar conceptos';
			conceptLogger.error('❌ Error al cargar conceptos:', error);
			set({ error: message, isLoading: false });
		}
	},

	selectItem: (concept) => {
		set({ selectedItem: concept });
	},

	createConcept: async (concept) => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('✨ Creando concepto:', concept);
			const newConcept = await createConceptAction(concept);
			await get().loadConcepts();
			conceptLogger.info('✅ Concepto creado');
			return newConcept;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear concepto';
			conceptLogger.error('❌ Error al crear concepto:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	updateConcept: async (id, concept) => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('💾 Actualizando concepto:', concept);
			const updatedConcept = await updateConceptAction(id, { ...concept, id });
			await get().loadConcepts();
			conceptLogger.info('✅ Concepto actualizado');
			return updatedConcept;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar concepto';
			conceptLogger.error('❌ Error al actualizar concepto:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	deleteConcept: async (id) => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('🗑️ Eliminando concepto:', id);
			await deleteConceptAction(id);
			await get().loadConcepts();
			conceptLogger.info('✅ Concepto eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar concepto';
			conceptLogger.error('❌ Error al eliminar concepto:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	addConceptToImage: async (imageId, conceptId) => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('➕ Añadiendo concepto a imagen:', { conceptId, imageId });
			await addConceptToImage(conceptId, imageId);
			await get().loadConcepts();
			conceptLogger.info('✅ Concepto añadido a imagen');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al añadir concepto a imagen';
			conceptLogger.error('❌ Error al añadir concepto a imagen:', error);
			set({ error: message, isLoading: false });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
}));
