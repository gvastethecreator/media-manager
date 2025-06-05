import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { VERSIONING } from '@/lib/constants';
import { clientLogger } from '@/lib/logger/client-logger';

import { createCoreSlice } from './slices/core';
import { createFiltersSlice } from './slices/filters';
import { createRelationsSlice } from './slices/relations';
import { createSelectionSlice } from './slices/selection';
import { createUISlice } from './slices/ui';
import type { NoteStore } from './types';

const storeLogger = clientLogger.withContext('NoteStore');

// Combinamos todos los slices para crear el store completo
export const useNoteStore = create<NoteStore>()(
	devtools(
		persist(
			(...a) => ({
				...createCoreSlice(...a),
				...createFiltersSlice(...a),
				...createSelectionSlice(...a),
				...createUISlice(...a),
				...createRelationsSlice(...a),
			}),
			{
				name: 'note-store',
				partialize: (state) => {
					// Solo persistimos el estado relevante
					// Las notas no las persistimos porque pueden cambiar en el servidor
					const {
						// Excluir de la persistencia
						notes,
						loading,
						error,
						// El resto se persiste
						...rest
					} = state;

					storeLogger.debug('🔄 Persistiendo estado del store', { persistedKeys: Object.keys(rest) });

					return {
						...rest,
						// Añadir versión para control de migraciones
						version: VERSIONING.CURRENT_STORE_VERSION,
					};
				},
				onRehydrateStorage: () => (state) => {
					// Verificar versión y realizar migraciones si es necesario
					if (state) {
						const version = state.version || 0;
						storeLogger.info('♻️ Rehidratando store', { version });

						// Añadir migración si se necesita en el futuro
						if (version < VERSIONING.CURRENT_STORE_VERSION) {
							storeLogger.warn('⚠️ Versión de store obsoleta, puede requerir migración', {
								storeVersion: version,
								currentVersion: VERSIONING.CURRENT_STORE_VERSION,
							});
						}
					}
				},
			}
		),
		{
			name: 'NoteStore',
			enabled: process.env.NODE_ENV === 'development',
		}
	)
);

// Re-exportar todo para facilitar importaciones
export * from './slices/core';
export * from './slices/filters';
export * from './slices/relations';
export * from './slices/selection';
export * from './slices/ui';
export * from './types';
