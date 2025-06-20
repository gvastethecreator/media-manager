/**
 * 📄 Store de Document
 * @module store/entities/document/document.store
 * @description Store Zustand para gestionar el estado de documentos
 */

import { createDocument, deleteDocument, getDocuments, updateDocument } from '@/app/actions/document/document.actions';
import type { DocumentComplete, DocumentFilters, DocumentFormData } from '@/types/entities/document/types';
import { createSelectors } from '@/utils/store/create-selectors';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 🏪 Estado del store de Document
 */
export interface DocumentState {
	// Estado de datos
	documents: DocumentComplete[];
	selectedDocuments: DocumentComplete[];
	currentDocument: DocumentComplete | null;

	// Estado de UI
	loading: boolean;
	error: string | null;
	filters: DocumentFilters;

	// Acciones de datos
	fetchDocuments: () => Promise<void>;
	createDocument: (data: DocumentFormData) => Promise<DocumentComplete | undefined>;
	updateDocument: (id: string, data: DocumentFormData) => Promise<DocumentComplete | undefined>;
	deleteDocument: (id: string) => Promise<void>;

	// Acciones de selección
	selectDocument: (document: DocumentComplete) => void;
	deselectDocument: (documentId: string) => void;
	clearSelection: () => void;

	// Acciones de filtrado
	setFilters: (filters: Partial<DocumentFilters>) => void;
	clearFilters: () => void;

	// Utilidades
	getDocumentById: (id: string) => DocumentComplete | undefined;
	toggleFavorite: (id: string) => Promise<void>;
}

const useDocumentStoreBase = create<DocumentState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			documents: [],
			selectedDocuments: [],
			currentDocument: null,
			loading: false,
			error: null,
			filters: {},

			// Acciones de datos
			fetchDocuments: async () => {
				set({ loading: true, error: null });
				try {
					const documents = await getDocuments();
					set({ documents, loading: false });
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			createDocument: async (data: DocumentFormData) => {
				set({ loading: true, error: null });
				try {
					const newDocument = await createDocument(data);
					set((state) => ({
						documents: [...state.documents, newDocument],
						loading: false,
					}));
					return newDocument;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			updateDocument: async (id: string, data: DocumentFormData) => {
				set({ loading: true, error: null });
				try {
					const updatedDocument = await updateDocument(id, data);
					set((state) => ({
						documents: state.documents.map((d) => (d.id === id ? updatedDocument : d)),
						currentDocument: state.currentDocument?.id === id ? updatedDocument : state.currentDocument,
						loading: false,
					}));
					return updatedDocument;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			deleteDocument: async (id: string) => {
				set({ loading: true, error: null });
				try {
					await deleteDocument(id);
					set((state) => ({
						documents: state.documents.filter((d) => d.id !== id),
						selectedDocuments: state.selectedDocuments.filter((d) => d.id !== id),
						currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
						loading: false,
					}));
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			// Acciones de selección
			selectDocument: (document: DocumentComplete) => {
				set((state) => ({
					selectedDocuments: [...state.selectedDocuments, document],
					currentDocument: document,
				}));
			},

			deselectDocument: (documentId: string) => {
				set((state) => ({
					selectedDocuments: state.selectedDocuments.filter((d) => d.id !== documentId),
				}));
			},

			clearSelection: () => {
				set({ selectedDocuments: [], currentDocument: null });
			},

			// Acciones de filtrado
			setFilters: (newFilters: Partial<DocumentFilters>) => {
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				}));
			},

			clearFilters: () => {
				set({ filters: {} });
			},

			// Utilidades
			getDocumentById: (id: string) => {
				return get().documents.find((d) => d.id === id);
			},

			toggleFavorite: async (id: string) => {
				const document = get().getDocumentById(id);
				if (document) {
					await get().updateDocument(id, {
						...document,
						isFavorite: !document.isFavorite,
					});
				}
			},
		}),
		{
			name: 'document-store',
		}
	)
);

export const useDocumentStore = createSelectors(useDocumentStoreBase);
