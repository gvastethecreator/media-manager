/**
 * @file Slice principal (core) para el store de Document.
 * @module store/entities/document/slices/core
 * @description Gestiona el estado y las acciones CRUD para la entidad Document.
 */

import { produce } from 'immer';
import type { StateCreator } from 'zustand';
// Uso del cliente de API para documentos
import {
	createDocumentInApi,
	deleteDocumentFromApi,
	getDocumentsFromApi,
	updateDocumentInApi,
} from '@/lib/api/client/document.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { DocumentCoreActions, DocumentCoreState, DocumentStore } from '../types';

const logger = clientLogger.withContext('DocumentCoreSlice');

const initialState: DocumentCoreState = {
	documents: {},
	isLoading: false,
	error: null,
	lastUpdated: null,
};

export const createDocumentCoreSlice: StateCreator<
	DocumentStore,
	[['zustand/immer', never]],
	[],
	DocumentCoreState & DocumentCoreActions
> = (set, get) => ({
	...initialState,

	loadDocuments: async () => {
		if (get().isLoading) return;
		set((state) => {
			state.isLoading = true;
			state.error = null;
		});

		try {
			const documents = await getDocumentsFromApi();
			set((state) => {
				state.documents = documents.reduce(
					(acc, doc) => {
						acc[doc.id] = doc;
						return acc;
					},
					{} as Record<string, (typeof documents)[0]>
				);
				state.lastUpdated = Date.now();
			});
			logger.info(`✅ ${documents.length} documentos cargados.`);
		} catch (error) {
			const errorMsg = '❌ Error al cargar los documentos.';
			logger.error(errorMsg, error);
			set((state) => {
				state.error = errorMsg;
			});
			toastService.error(errorMsg);
		} finally {
			set((state) => {
				state.isLoading = false;
			});
		}
	},

	createDocument: async (data) => {
		try {
			await createDocumentInApi(data);
			toastService.success(`Documento "${data.name}" creado.`);
			await get().loadDocuments();
		} catch (error) {
			const errorMsg = `❌ Error al crear el documento "${data.name}".`;
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	updateDocument: async (id, data) => {
		try {
			await updateDocumentInApi(id, data);
			toastService.success('Documento actualizado.');
			await get().loadDocuments();
		} catch (error) {
			const errorMsg = '❌ Error al actualizar el documento.';
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	deleteDocument: async (id) => {
		const docName = get().documents[id]?.name ?? id;
		set(
			produce((draft) => {
				delete draft.documents[id];
			})
		);
		try {
			await deleteDocumentFromApi(id);
			toastService.success(`Documento "${docName}" eliminado.`);
		} catch (error) {
			const errorMsg = '❌ Error al eliminar el documento.';
			logger.error(errorMsg, { id, error });
			toastService.error(errorMsg);
			await get().loadDocuments(); // Revertir si falla
		}
	},
});
