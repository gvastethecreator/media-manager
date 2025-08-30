import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientLogger } from '@/lib/logger/client-logger';
import type { EntityWithStats } from '@/types/entities/entity.types';

const selectionLogger = clientLogger.withContext('SelectionStore');

/**
 * Interfaz para el estado del store de selección - MIGRADO A EntityWithStats
 */
export interface SelectionState {
	// Estado
	selectedItems: EntityWithStats[];
	selectedIds: string[];
	lastSelectedItem: EntityWithStats | null;
	focusedId: string | null;
	isMultiSelectMode: boolean;

	// Acciones
	toggleSelection: (id: string, item?: EntityWithStats) => void;
	selectItem: (item: EntityWithStats) => void;
	deselectItem: (id: string) => void;
	clearSelection: () => void;
	setMultiSelectMode: (enabled: boolean) => void;
	setFocusedId: (id: string | null) => void;
	addToSelection: (id: string) => void;
	removeFromSelection: (id: string) => void;
	setSelection: (ids: string[]) => void;
	selectRange: (ids: string[]) => void;
	setSelectedIds: (ids: string[]) => void;
	selectAll: (items: EntityWithStats[]) => void;

	// Selectores
	isItemSelected: (id: string) => boolean;
}

/**
 * Store central para la selección de archivos y entidades - MIGRADO A EntityWithStats
 * Reemplaza la funcionalidad de selección de useFileManager
 * ✅ Actualizado para usar EntityWithStats en lugar de FileItem
 */
export const useSelectionStore = create<SelectionState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			selectedItems: [],
			selectedIds: [],
			lastSelectedItem: null,
			focusedId: null,
			isMultiSelectMode: false,

			// Acciones
			toggleSelection: (id: string, item?: EntityWithStats) => {
				const { selectedItems, selectedIds, isMultiSelectMode } = get();
				const isSelected = selectedIds.includes(id);

				// En modo de selección única, reemplazar selección
				if (!isMultiSelectMode) {
					if (isSelected) {
						set({ selectedItems: [], selectedIds: [], lastSelectedItem: null });
						selectionLogger.debug('🚫 Deseleccionado único item:', id);
					} else if (item) {
						set({
							selectedItems: [item],
							selectedIds: [id],
							lastSelectedItem: item,
						});
						selectionLogger.debug('✅ Seleccionado único item:', id);
					}
					return;
				}

				// En modo multi-selección, toggle individual
				if (isSelected) {
					const newSelectedItems = selectedItems.filter((item) => item.id !== id);
					const newSelectedIds = selectedIds.filter((itemId) => itemId !== id);
					set({
						selectedItems: newSelectedItems,
						selectedIds: newSelectedIds,
						lastSelectedItem: newSelectedItems.length > 0 ? newSelectedItems[0] : null,
					});
					selectionLogger.debug('🚫 Deseleccionado item en modo multi:', id);
				} else if (item) {
					set({
						selectedItems: [...selectedItems, item],
						selectedIds: [...selectedIds, id],
						lastSelectedItem: item,
					});
					selectionLogger.debug('✅ Seleccionado item en modo multi:', id);
				}
			},

			selectItem: (item: EntityWithStats) => {
				const { isMultiSelectMode, selectedItems, selectedIds } = get();

				// En modo multi-selección, añadir a selección existente
				if (isMultiSelectMode) {
					// Solo añadir si no está ya seleccionado
					if (!selectedIds.includes(item.id)) {
						set({
							selectedItems: [...selectedItems, item],
							selectedIds: [...selectedIds, item.id],
							lastSelectedItem: item,
						});
						selectionLogger.debug('➕ Añadido item a selección múltiple:', item.id);
					}
				} else {
					// En modo selección única, reemplazar selección
					set({
						selectedItems: [item],
						selectedIds: [item.id],
						lastSelectedItem: item,
					});
					selectionLogger.debug('🔄 Reemplazada selección con item:', item.id);
				}
			},

			deselectItem: (id: string) => {
				const { selectedItems, selectedIds } = get();
				const newSelectedItems = selectedItems.filter((item) => item.id !== id);
				const newSelectedIds = selectedIds.filter((itemId) => itemId !== id);

				set({
					selectedItems: newSelectedItems,
					selectedIds: newSelectedIds,
					lastSelectedItem: newSelectedItems.length > 0 ? newSelectedItems[0] : null,
				});

				selectionLogger.debug('🚫 Deseleccionado:', id);
			},

			clearSelection: () => {
				set({
					selectedItems: [],
					selectedIds: [],
					lastSelectedItem: null,
					focusedId: null,
				});

				selectionLogger.debug('🧹 Selección limpiada');
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

			setFocusedId: (id: string | null) => {
				set({ focusedId: id });
				selectionLogger.debug('🎯 Foco establecido en:', id);
			},

			addToSelection: (id: string) => {
				const { selectedIds } = get();
				if (!selectedIds.includes(id)) {
					set({ selectedIds: [...selectedIds, id] });
					selectionLogger.debug('➕ Agregado a selección:', id);
				}
			},

			removeFromSelection: (id: string) => {
				const { selectedIds } = get();
				set({ selectedIds: selectedIds.filter((itemId) => itemId !== id) });
				selectionLogger.debug('➖ Removido de selección:', id);
			},

			setSelection: (ids: string[]) => {
				set({ selectedIds: ids });
				selectionLogger.debug('📝 Selección establecida:', `${ids.length} items`);
			},

			selectRange: (ids: string[]) => {
				const { selectedIds, isMultiSelectMode } = get();
				if (isMultiSelectMode) {
					const newIds = [...new Set([...selectedIds, ...ids])];
					set({ selectedIds: newIds });
					selectionLogger.debug('📊 Rango agregado a selección:', `${ids.length} items`);
				} else {
					set({ selectedIds: ids });
					selectionLogger.debug('📊 Rango seleccionado:', `${ids.length} items`);
				}
			},

			setSelectedIds: (ids: string[]) => {
				set({ selectedIds: ids });
				selectionLogger.debug('📝 Selección establecida:', `${ids.length} items`);
			},

			selectAll: (items: EntityWithStats[]) => {
				const allIds = items.map((item) => item.id);
				set({
					selectedItems: items,
					selectedIds: allIds,
					lastSelectedItem: items.length > 0 ? items.at(-1) : null,
					isMultiSelectMode: items.length > 1,
				});
				selectionLogger.debug('🎯 Seleccionados todos los items:', `${items.length} items`);
			},

			// Selectores
			isItemSelected: (id: string) => {
				return get().selectedIds.includes(id);
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
