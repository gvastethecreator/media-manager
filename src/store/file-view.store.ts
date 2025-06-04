import { clientLogger } from '@/lib/logger/client-logger';
import type { ViewMode } from '@/types/settings';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const viewLogger = clientLogger.withContext('FileViewStore');

/**
 * Interfaz para el estado del store de visualización de archivos
 */
export interface FileViewState {
  // Estado de visualización
  viewMode: ViewMode;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Preferencias de UI
  showThumbnails: boolean;
  showMetadata: boolean;
  thumbnailSize: 'small' | 'medium' | 'large';
  animationsEnabled: boolean;

  // Acciones
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setShowThumbnails: (show: boolean) => void;
  setShowMetadata: (show: boolean) => void;
  setThumbnailSize: (size: 'small' | 'medium' | 'large') => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  resetViewSettings: () => void;
}

/**
 * Estado inicial para el store
 */
const initialState = {
  viewMode: 'grid' as ViewMode,
  sortBy: 'name',
  sortOrder: 'asc' as 'asc' | 'desc',
  showThumbnails: true,
  showMetadata: true,
  thumbnailSize: 'medium' as 'small' | 'medium' | 'large',
  animationsEnabled: true,
};

/**
 * Store para la gestión de visualización de archivos
 * Reemplaza las funcionalidades de visualización de useFileManager
 */
export const useFileViewStore = create<FileViewState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setViewMode: (mode: ViewMode) => {
        viewLogger.info(`🔄 Cambiando modo de visualización a: ${mode}`);
        set({ viewMode: mode });
      },

      setSortBy: (field: string) => {
        viewLogger.info(`🔄 Cambiando ordenamiento por campo: ${field}`);
        set({ sortBy: field });
      },

      setSortOrder: (order: 'asc' | 'desc') => {
        viewLogger.info(`🔄 Cambiando dirección de ordenamiento a: ${order}`);
        set({ sortOrder: order });
      },

      setShowThumbnails: (show: boolean) => {
        viewLogger.info(`${show ? '✅' : '❌'} ${show ? 'Mostrando' : 'Ocultando'} miniaturas`);
        set({ showThumbnails: show });
      },

      setShowMetadata: (show: boolean) => {
        viewLogger.info(`${show ? '✅' : '❌'} ${show ? 'Mostrando' : 'Ocultando'} metadatos`);
        set({ showMetadata: show });
      },

      setThumbnailSize: (size: 'small' | 'medium' | 'large') => {
        viewLogger.info(`🔄 Cambiando tamaño de miniaturas a: ${size}`);
        set({ thumbnailSize: size });
      },

      setAnimationsEnabled: (enabled: boolean) => {
        viewLogger.info(`${enabled ? '✅' : '❌'} ${enabled ? 'Activando' : 'Desactivando'} animaciones`);
        set({ animationsEnabled: enabled });
      },

      resetViewSettings: () => {
        viewLogger.info('🔄 Restableciendo configuración de visualización');
        set({ ...initialState });
      }
    }),
    {
      name: 'file-view-store',
      // Solo persistir preferencias de visualización
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        showThumbnails: state.showThumbnails,
        thumbnailSize: state.thumbnailSize,
        animationsEnabled: state.animationsEnabled,
      }),
    }
  )
);

// Exportar hooks personalizados para facilitar el acceso
export const useViewMode = () => useFileViewStore((state) => state.viewMode);
export const useSortSettings = () => useFileViewStore((state) => ({
  sortBy: state.sortBy,
  sortOrder: state.sortOrder,
  setSortBy: state.setSortBy,
  setSortOrder: state.setSortOrder
}));
export const useThumbnailSettings = () => useFileViewStore((state) => ({
  showThumbnails: state.showThumbnails,
  thumbnailSize: state.thumbnailSize,
  setShowThumbnails: state.setShowThumbnails,
  setThumbnailSize: state.setThumbnailSize
}));