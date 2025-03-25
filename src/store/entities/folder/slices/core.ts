/**
 * @file Core slice para el store de carpetas
 * @module store/entities/folder/slices/core
 */

import { clientLogger } from '@/lib/logger/client-logger';
import {
    createFolder,
    deleteFolder,
    fetchFolderById,
    fetchFolders,
    updateFolder
} from '../actions';
import type { FolderCoreSlice } from '../types';

const coreLogger = clientLogger.withContext('FolderStore:Core');

export const createCoreSlice: FolderCoreSlice = (set, get) => ({
  coreState: {
    // Estado inicial
    folders: [],
    currentFolderId: null,
    currentFolder: null,
    loading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  },

  coreActions: {
    // Acciones
    fetchFolders: async () => {
      try {
        const { coreState } = get();
        set({ coreState: { ...coreState, loading: true, error: null } });
        coreLogger.info('🔄 Obteniendo carpetas');

        // Usar acción integrada con server action
        const response = await fetchFolders();

        if (response.success && response.data) {
          set({
            coreState: {
              ...coreState,
              folders: response.data,
              loading: false
            }
          });
          coreLogger.info(`✅ ${response.data.length} carpetas obtenidas`);
        } else {
          throw new Error(response.message || 'Error obteniendo carpetas');
        }
      } catch (error) {
        coreLogger.error('❌ Error obteniendo carpetas:', error);
        const { coreState } = get();
        set({
          coreState: {
            ...coreState,
            loading: false,
            error: error instanceof Error ? error.message : 'Error obteniendo carpetas'
          }
        });
      }
    },

    fetchFolderById: async (id) => {
      try {
        const { coreState } = get();
        set({ coreState: { ...coreState, loading: true, error: null } });
        coreLogger.info(`🔄 Obteniendo carpeta con ID: ${id}`);

        // Usar acción integrada con server action
        const response = await fetchFolderById(id);

        if (response.success && response.data) {
          set({
            coreState: {
              ...coreState,
              currentFolder: response.data,
              currentFolderId: id,
              loading: false
            }
          });
          coreLogger.info('✅ Carpeta obtenida');
          return response.data;
        } else {
          coreLogger.warn(`⚠️ No se encontró la carpeta con ID: ${id}`);
          set({
            coreState: {
              ...coreState,
              loading: false,
              error: response.message || 'Carpeta no encontrada'
            }
          });
          return null;
        }
      } catch (error) {
        coreLogger.error(`❌ Error obteniendo carpeta con ID ${id}:`, error);
        const { coreState } = get();
        set({
          coreState: {
            ...coreState,
            loading: false,
            error: error instanceof Error ? error.message : 'Error obteniendo carpeta'
          }
        });
        return null;
      }
    },

    createFolder: async (data) => {
      try {
        const { coreState } = get();
        set({ coreState: { ...coreState, isCreating: true, error: null } });
        coreLogger.info('🔄 Creando nueva carpeta');

        // Usar acción integrada con server action
        const response = await createFolder(data);

        if (response.success && response.data) {
          // Actualizar estado
          set({
            coreState: {
              ...coreState,
              folders: [...coreState.folders, response.data],
              isCreating: false
            }
          });

          coreLogger.info('✅ Carpeta creada con éxito');
          return response.data;
        } else {
          throw new Error(response.message || 'Error creando carpeta');
        }
      } catch (error) {
        coreLogger.error('❌ Error creando carpeta:', error);
        const { coreState } = get();
        set({
          coreState: {
            ...coreState,
            isCreating: false,
            error: error instanceof Error ? error.message : 'Error creando carpeta'
          }
        });
        return null;
      }
    },

    updateFolder: async (id, data) => {
      try {
        const { coreState } = get();
        set({ coreState: { ...coreState, isUpdating: true, error: null } });
        coreLogger.info(`🔄 Actualizando carpeta con ID: ${id}`);

        // Usar acción integrada con server action
        const response = await updateFolder(id, data);

        if (response.success && response.data) {
          // Actualizar estado
          const folderIndex = coreState.folders.findIndex(f => f.id === id);

          if (folderIndex === -1) {
            coreLogger.warn(`⚠️ Carpeta con ID ${id} no encontrada en el estado local`);
            // Agregar la carpeta actualizada si no existe en el estado
            set({
              coreState: {
                ...coreState,
                folders: [...coreState.folders, response.data],
                isUpdating: false,
                currentFolder: coreState.currentFolderId === id ? response.data : coreState.currentFolder
              }
            });
          } else {
            // Actualizar la carpeta existente
            const newFolders = [...coreState.folders];
            newFolders[folderIndex] = response.data;

            set({
              coreState: {
                ...coreState,
                folders: newFolders,
                isUpdating: false,
                currentFolder: coreState.currentFolderId === id ? response.data : coreState.currentFolder
              }
            });
          }

          coreLogger.info('✅ Carpeta actualizada con éxito');
          return response.data;
        } else {
          throw new Error(response.message || 'Error actualizando carpeta');
        }
      } catch (error) {
        coreLogger.error(`❌ Error actualizando carpeta con ID ${id}:`, error);
        const { coreState } = get();
        set({
          coreState: {
            ...coreState,
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Error actualizando carpeta'
          }
        });
        return null;
      }
    },

    deleteFolder: async (id) => {
      try {
        const { coreState } = get();
        set({ coreState: { ...coreState, isDeleting: true, error: null } });
        coreLogger.info(`🔄 Eliminando carpeta con ID: ${id}`);

        // Usar acción integrada con server action
        const response = await deleteFolder(id);

        if (response.success) {
          // Actualizar estado
          set({
            coreState: {
              ...coreState,
              folders: coreState.folders.filter(f => f.id !== id),
              currentFolder: coreState.currentFolderId === id ? null : coreState.currentFolder,
              currentFolderId: coreState.currentFolderId === id ? null : coreState.currentFolderId,
              isDeleting: false
            }
          });

          coreLogger.info('✅ Carpeta eliminada con éxito');
          return true;
        } else {
          throw new Error(response.message || 'Error eliminando carpeta');
        }
      } catch (error) {
        coreLogger.error(`❌ Error eliminando carpeta con ID ${id}:`, error);
        const { coreState } = get();
        set({
          coreState: {
            ...coreState,
            isDeleting: false,
            error: error instanceof Error ? error.message : 'Error eliminando carpeta'
          }
        });
        return false;
      }
    },

    setCurrentFolderId: (id) => {
      const { coreState } = get();
      set({ coreState: { ...coreState, currentFolderId: id } });

      // Si tenemos la carpeta en el estado, la establecemos como actual
      if (id) {
        const folder = coreState.folders.find(f => f.id === id) || null;
        set({ coreState: { ...coreState, currentFolder: folder, currentFolderId: id } });
      } else {
        set({ coreState: { ...coreState, currentFolder: null, currentFolderId: null } });
      }
    },

    setCurrentFolder: (folder) => {
      const { coreState } = get();
      set({
        coreState: {
          ...coreState,
          currentFolder: folder,
          currentFolderId: folder ? folder.id : null
        }
      });
    },

    resetError: () => {
      const { coreState } = get();
      set({ coreState: { ...coreState, error: null } });
    }
  }
});