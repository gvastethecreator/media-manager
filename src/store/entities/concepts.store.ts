'use client';

import { serverLogger } from '@/lib/logger/server-logger';
import type { Concept } from '@prisma/client';
import { create } from 'zustand';

// Definir logger específico para este store
const conceptsLogger = serverLogger.withContext('ConceptsStore');

// Tipos
export interface ConceptCreate {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string;
	shortcut?: string | null;
	featuredImage?: string | null;
}

export interface ConceptUpdate {
	id: string;
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string;
	shortcut?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

export interface ConceptWithStats extends Concept {
	_count: {
		images: number;
	};
}

// Interfaz del store
interface ConceptsStore {
	concepts: ConceptWithStats[];
	isLoading: boolean;
	error: string | null;
	loadConcepts: () => Promise<void>;
	createConcept: (concept: ConceptCreate) => Promise<Concept | null>;
	updateConcept: (id: string, concept: ConceptUpdate) => Promise<void>;
	deleteConcept: (id: string) => Promise<void>;
	addConceptToImage: (imageId: string, conceptId: string) => Promise<void>;
	removeConceptFromImage: (imageId: string, conceptId: string) => Promise<void>;
}

// Funciones de acción (normalmente estarían en un archivo separado)
// Estas son funciones temporales hasta que se implementen las acciones del servidor
const mockApi = {
	getConcepts: async (): Promise<ConceptWithStats[]> => {
		// Simulación de delay de red
		await new Promise((resolve) => setTimeout(resolve, 500));
		return [];
	},

	createConcept: async (concept: ConceptCreate): Promise<Concept> => {
		// Simulación de delay de red
		await new Promise((resolve) => setTimeout(resolve, 500));
		return {
			id: `concept-${Date.now()}`,
			name: concept.name,
			emoji: concept.emoji || '🔮',
			color: concept.color || '#8b5cf6',
			description: concept.description || null,
			content: concept.content || '',
			category: concept.category || 'general',
			tags: concept.tags || '[]',
			featuredImage: concept.featuredImage || null,
			isFavorite: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	},

	updateConcept: async (id: string, concept: ConceptUpdate): Promise<void> => {
		// Parámetros necesarios para la interfaz pero no utilizados en esta implementación mock
		// Se prefijan con guion bajo para indicar que son intencionalmente no utilizados
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _id = id;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _concept = concept;

		// Simulación de delay de red
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	deleteConcept: async (id: string): Promise<void> => {
		// Parámetro necesario para la interfaz pero no utilizado en esta implementación mock
		// Se prefija con guion bajo para indicar que es intencionalmente no utilizado
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _id = id;

		// Simulación de delay de red
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	addConceptToImage: async (imageId: string, conceptId: string): Promise<void> => {
		// Parámetros necesarios para la interfaz pero no utilizados en esta implementación mock
		// Se prefijan con guion bajo para indicar que son intencionalmente no utilizados
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _imageId = imageId;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _conceptId = conceptId;

		// Simulación de delay de red
		await new Promise((resolve) => setTimeout(resolve, 500));
	},

	removeConceptFromImage: async (imageId: string, conceptId: string): Promise<void> => {
		// Parámetros necesarios para la interfaz pero no utilizados en esta implementación mock
		// Se prefijan con guion bajo para indicar que son intencionalmente no utilizados
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _imageId = imageId;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _conceptId = conceptId;

		// Simulación de delay de red
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
};

// Crear e implementar el store
export const useConceptsStore = create<ConceptsStore>((set, _get) => ({
	concepts: [],
	isLoading: false,
	error: null,

	loadConcepts: async () => {
		try {
			set({ isLoading: true, error: null });
			conceptsLogger.info('Cargando conceptos');

			// Aquí se llamaría a la acción del servidor
			const concepts = await mockApi.getConcepts();

			set({ concepts, isLoading: false });
			conceptsLogger.info('✅ Conceptos cargados');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar conceptos';
			conceptsLogger.error('❌ Error al cargar conceptos:', error);
			set({ error: message, isLoading: false });
		}
	},

	createConcept: async (concept) => {
		try {
			set({ isLoading: true, error: null });
			conceptsLogger.info('✨ Creando concepto:', concept);

			// Aquí se llamaría a la acción del servidor
			const createdConcept = await mockApi.createConcept(concept);

			// Actualizar la lista después de crear
			const concepts = await mockApi.getConcepts();

			set({ concepts, isLoading: false });
			conceptsLogger.info('✅ Concepto creado', createdConcept);
			return createdConcept;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear concepto';
			conceptsLogger.error('❌ Error al crear concepto:', error);
			set({ error: message, isLoading: false });
			return null;
		}
	},

	updateConcept: async (id, concept) => {
		try {
			set({ isLoading: true, error: null });
			conceptsLogger.info('💾 Actualizando concepto:', concept);

			// Aquí se llamaría a la acción del servidor
			await mockApi.updateConcept(id, { ...concept, id });

			// Actualizar la lista después de actualizar
			const concepts = await mockApi.getConcepts();

			set({ concepts, isLoading: false });
			conceptsLogger.info('✅ Concepto actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar concepto';
			conceptsLogger.error('❌ Error al actualizar concepto:', error);
			set({ error: message, isLoading: false });
		}
	},

	deleteConcept: async (id) => {
		try {
			set({ isLoading: true, error: null });
			conceptsLogger.info('🗑️ Eliminando concepto:', id);

			// Aquí se llamaría a la acción del servidor
			await mockApi.deleteConcept(id);

			// Actualizar la lista después de eliminar
			const concepts = await mockApi.getConcepts();

			set({ concepts, isLoading: false });
			conceptsLogger.info('✅ Concepto eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar concepto';
			conceptsLogger.error('❌ Error al eliminar concepto:', error);
			set({ error: message, isLoading: false });
		}
	},

	addConceptToImage: async (imageId, conceptId) => {
		try {
			set({ isLoading: true, error: null });
			conceptsLogger.info('➕ Agregando concepto a imagen:', { imageId, conceptId });

			// Aquí se llamaría a la acción del servidor
			await mockApi.addConceptToImage(imageId, conceptId);

			// Actualizar la lista después de asociar
			const concepts = await mockApi.getConcepts();

			set({ concepts, isLoading: false });
			conceptsLogger.info('✅ Concepto agregado a la imagen');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al agregar concepto a la imagen';
			conceptsLogger.error('❌ Error al agregar concepto a la imagen:', error);
			set({ error: message, isLoading: false });
		}
	},

	removeConceptFromImage: async (imageId, conceptId) => {
		try {
			set({ isLoading: true, error: null });
			conceptsLogger.info('➖ Eliminando concepto de imagen:', { imageId, conceptId });

			// Aquí se llamaría a la acción del servidor
			await mockApi.removeConceptFromImage(imageId, conceptId);

			// Actualizar la lista después de desasociar
			const concepts = await mockApi.getConcepts();

			set({ concepts, isLoading: false });
			conceptsLogger.info('✅ Concepto eliminado de la imagen');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar concepto de la imagen';
			conceptsLogger.error('❌ Error al eliminar concepto de la imagen:', error);
			set({ error: message, isLoading: false });
		}
	},
}));
