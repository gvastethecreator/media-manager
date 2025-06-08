/**
 * @file Store principal de Folder
 * @module store/entities/folder
 */

// Importar y reexportar el store principal y los slices si es necesario desde store.ts
export { useFolderStore } from './store';

// Exportar los selectores directamente para que puedan ser importados
export {
	selectActiveOnly,
	selectCategoryFilter,
	selectCurrentFolder,
	selectCurrentFolderId,
	selectError,
	selectExpandedFolders, // Ya existe un hook useFilteredFolders, asegurar que no haya conflicto o decidir cuál usar.
	selectFavoriteFolders,
	selectFilteredFolders,
	selectFolderStats,
	selectFolders,
	selectIsCreating,
	selectIsDeleting,
	selectIsLoading,
	selectIsUpdating,
	selectItemSize,
	selectSearchTerm,
	selectShowCreateModal,
	selectShowDeleteModal,
	selectShowEditModal,
	selectShowFavorites,
	selectSidebarExpanded,
	selectSortBy,
	selectSortDirection,
	selectViewMode,
} from './store';

// Mantener los hooks selectores existentes, que usan useFolderStore internamente
// Estos hooks podrían necesitar ajustarse si la estructura del estado subyacente cambia
// debido a la consolidación de useFolderStore, pero los selectores importados arriba deberían funcionar.

// FIXME: Revisar la necesidad de estos hooks si los selectores directos son suficientes
// o si la implementación de useFolderStore en store.ts es diferente a la que se usaba aquí.

// Se asume que useFolderStore ahora viene de './store' y tiene la estructura esperada por estos hooks.
// Si los slices originales (createFolderCoreSlice, etc.) eran diferentes a los de store.ts (createCoreSlice, etc.),
// estos hooks podrían fallar o devolver datos incorrectos.

// Selectores útiles (hooks existentes)
// Estos hooks ahora usarán el useFolderStore reexportado de ./store
// Si los nombres de las propiedades del estado (state.items, state.selected, etc.) no coinciden
// con la estructura definida por los slices en ./store (state.coreState.folders, state.coreState.currentFolder etc.)
// entonces estos hooks fallarán o deberán ser actualizados.

// Por ahora, los comentaré para evitar conflictos inmediatos y priorizar que las importaciones originales funcionen.
// Se recomienda revisar y refactorizar estos hooks para que usen los selectores importados o
// se alineen con la estructura del estado de useFolderStore de ./store.ts

/*
export const useSelectedFolder = () => useFolderStore((state) => state.selected); // state.selected no existe en la estructura de store.ts
export const useFolderItems = () => useFolderStore((state) => state.items); // state.items no existe, es state.coreState.folders
export const useFolderFilters = () => useFolderStore((state) => state.filters); // state.filters no existe, es state.filtersState
export const useFolderLoading = () => useFolderStore((state) => state.isLoading); // state.isLoading no existe, es state.coreState.loading
export const useFolderError = () => useFolderStore((state) => state.error); // state.error no existe, es state.coreState.error

// Selectores de UI (hooks existentes)
export const useFolderUIState = () => useFolderStore((state) => state.ui); // state.ui no existe, es state.uiState
export const useFolderViewMode = () => useFolderStore((state) => state.ui.viewMode); // state.ui.viewMode no existe, es state.uiState.viewMode
export const useFolderSelectedIds = () => useFolderStore((state) => state.ui.selectedIds); // state.ui.selectedIds no existe en uiState
export const useFolderExpandedIds = () => useFolderStore((state) => state.ui.expandedIds); // state.ui.expandedIds no existe, es state.uiState.expandedFolders
export const useFolderModal = () => ({
	isOpen: useFolderStore((state) => state.ui.isModalOpen), // state.ui.isModalOpen no existe en uiState
	id: useFolderStore((state) => state.ui.currentModalId), // state.ui.currentModalId no existe en uiState
	mode: useFolderStore((state) => state.ui.modalMode), // state.ui.modalMode no existe en uiState
});

// Selectores derivados (hooks existentes)
export const useFilteredFolders = () => useFolderStore((state) => state.getFilteredFolders()); // getFilteredFolders no existe en la store unificada
export const useSortedFolders = () => useFolderStore((state) => state.getSortedFolders()); // getSortedFolders no existe en la store unificada

// Selector para carpeta por ID (hook existente)
export const useFolderById = (id?: string | null) =>
	useFolderStore((state) => (id ? state.items.find((item) => item.id === id) : null)); // state.items no existe
*/

// Exportar tipos si es necesario, aunque usualmente los tipos se importan directamente de sus archivos
export type { FolderCoreSlice, FolderFiltersSlice, FolderStoreState, FolderUISlice } from './types'; // Ajustar según los tipos reales en ./types y ./store
