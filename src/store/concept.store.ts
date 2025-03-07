import {
	type ConceptCreate,
	type ConceptUpdate,
	type ConceptWithStats,
	createConcept as createConceptAction,
	deleteConcept as deleteConceptAction,
	getConcepts,
	updateConcept as updateConceptAction,
} from '@/app/actions/concept.actions';
import { logger } from '@/lib/logger';
import { Concept } from '@prisma/client';
import { create } from 'zustand';

const conceptLogger = logger.withContext('ConceptStore');

const mapToConceptWithStats = (concept: Awaited<ReturnType<typeof getConcepts>>[0]): ConceptWithStats => ({
	...concept,
	totalSize: 0,
	lastUpdated: new Date(),
	recentImages: [],
});

interface ConceptStore {
	concepts: ConceptWithStats[];
	isLoading: boolean;
	error: string | null;
	loadConcepts: () => Promise<void>;
	createConcept: (concept: ConceptCreate) => Promise<void>;
	updateConcept: (id: string, concept: ConceptUpdate) => Promise<void>;
	deleteConcept: (id: string) => Promise<void>;
}

export const useConceptStore = create<ConceptStore>((set, _get) => ({
	concepts: [],
	isLoading: false,
	error: null,
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
	createConcept: async (concept) => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('✨ Creando concepto:', concept);
			await createConceptAction(concept);
			const rawConcepts = await getConcepts();
			const concepts = rawConcepts.map(mapToConceptWithStats);
			set({ concepts, isLoading: false });
			conceptLogger.info('✅ Concepto creado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear concepto';
			conceptLogger.error('❌ Error al crear concepto:', error);
			set({ error: message, isLoading: false });
		}
	},
	updateConcept: async (id, concept) => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('💾 Actualizando concepto:', concept);
			await updateConceptAction(id, { ...concept, id });
			const rawConcepts = await getConcepts();
			const concepts = rawConcepts.map(mapToConceptWithStats);
			set({ concepts, isLoading: false });
			conceptLogger.info('✅ Concepto actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar concepto';
			conceptLogger.error('❌ Error al actualizar concepto:', error);
			set({ error: message, isLoading: false });
		}
	},
	deleteConcept: async (id) => {
		try {
			set({ isLoading: true, error: null });
			conceptLogger.info('🗑️ Eliminando concepto:', id);
			await deleteConceptAction(id);
			const rawConcepts = await getConcepts();
			const concepts = rawConcepts.map(mapToConceptWithStats);
			set({ concepts, isLoading: false });
			conceptLogger.info('✅ Concepto eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar concepto';
			conceptLogger.error('❌ Error al eliminar concepto:', error);
			set({ error: message, isLoading: false });
		}
	},
}));
