import { clientLogger } from '@/lib/logger/client-logger';
import type { FileItem } from '@/types/file-item';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const selectionLogger = clientLogger.withContext('SelectionStore');

/**
 * Interfaz para el estado del store de selección
 */
export interface SelectionState {
	// Estado
	selectedItems: FileItem[];
	lastSelectedItem: FileItem | null;
	isMultiSelectMode: boolean;

	// Acciones
	toggleSelection: (id: string, item: FileItem) => void;
	selectItem: (item: FileItem) => void;
	deselectItem: (id: string) => void;
	clearSelection: () => void;
	setMultiSelectMode: (enabled: boolean) => void;

	// Selectores
	isItemSelected: (id: string) => boolean;
}

/**
 * Store central para la selección de archivos y entidades
 * Reemplaza la funcionalidad de selección de useFileManager
 */
export const useSelectionStore = create<SelectionState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			selectedItems: [],
			lastSelectedItem: null,
			isMultiSelectMode: false,

			// Acciones
			toggleSelection: (id: string, item: FileItem) => {
				const { selectedItems, isMultiSelectMode } = get();
				const isSelected = selectedItems.some((item) => item.id === id);

				// En modo de selección única, reemplazar selección
				if (!isMultiSelectMode) {
					if (isSelected) {
						set({ selectedItems: [], lastSelectedItem: null });
						selectionLogger.debug('🚫 Deseleccionado único item:', id);
					} else {
						set({
							selectedItems: [item],
							lastSelectedItem: item,
						});
						selectionLogger.debug('✅ Seleccionado único item:', id);
					}
					return;
				}

				// En modo multi-selección, toggle individual
				if (isSelected) {
					set({
						selectedItems: selectedItems.filter((item) => item.id !== id),
						lastSelectedItem: selectedItems.length > 1 ? selectedItems[0] : null,
					});
					selectionLogger.debug('🚫 Deseleccionado item en modo multi:', id);
				} else {
					set({
						selectedItems: [...selectedItems, item],
						lastSelectedItem: item,
					});
					selectionLogger.debug('✅ Seleccionado item en modo multi:', id);
				}
			},

			selectItem: (item: FileItem) => {
				const { isMultiSelectMode, selectedItems } = get();

				// En modo multi-selección, añadir a selección existente
				if (isMultiSelectMode) {
					// Solo añadir si no está ya seleccionado
					if (!selectedItems.some((i) => i.id === item.id)) {
						set({
							selectedItems: [...selectedItems, item],
							lastSelectedItem: item,
						});
						selectionLogger.debug('➕ Añadido item a selección múltiple:', item.id);
					}
				} else {
					// En modo selección única, reemplazar selección
					set({
						selectedItems: [item],
						lastSelectedItem: item,
					});
					selectionLogger.debug('🔄 Reemplazada selección con item:', item.id);
				}
			},

			deselectItem: (id: string) => {
				const { selectedItems } = get();
				const filtered = selectedItems.filter((item) => item.id !== id);

				set({
					selectedItems: filtered,
					lastSelectedItem: filtered.length > 0 ? filtered[0] : null,
				});

				selectionLogger.debug('🚫 Deseleccionado item específico:', id);
			},

			clearSelection: () => {
				set({
					selectedItems: [],
					lastSelectedItem: null,
				});

				selectionLogger.debug('🧹 Limpiando toda la selección');
			},

			setMultiSelectMode: (enabled: boolean) => {
				set({ isMultiSelectMode: enabled });

				if (!enabled) {
					// Al salir del modo multi-selección, mantener solo el último item seleccionado
					const { lastSelectedItem } = get();
					if (lastSelectedItem) {
						set({ selectedItems: [lastSelectedItem] });
					} else {
						set({ selectedItems: [] });
					}
				}

				selectionLogger.debug(`${enabled ? '✅' : '❌'} Modo multi-selección: ${enabled ? 'activado' : 'desactivado'}`);
			},

			// Selectores
			isItemSelected: (id: string) => {
				return get().selectedItems.some((item) => item.id === id);
			},
		}),
		{
			name: 'SelectionStore',
			enabled: process.env.NODE_ENV === 'development',
		}
	)
);

// Exportar selectores como funciones para facilitar el uso
export const useSelectedItems = () => useSelectionStore((state) => state.selectedItems);
export const useIsMultiSelectMode = () => useSelectionStore((state) => state.isMultiSelectMode);
export const useLastSelectedItem = () => useSelectionStore((state) => state.lastSelectedItem);
