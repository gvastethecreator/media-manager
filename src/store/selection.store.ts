import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { clientLogger } from '@/lib/logger/client-logger';
import type { EntityWithStats } from '@/types/entities/entity.types';

const selectionLogger = clientLogger.withContext('SelectionStore');

/**
 * Store unificado de selección - Compatible con todos los consumidores
 * Fusiona las APIs de selection.store.ts y selection.slice.ts
 */
export interface SelectionState {
	activeId: string | null; // Alias de focusedId para compatibilidad
	addSelectedId: (id: string) => void; // Alias de addToSelection
	addToSelection: (id: string) => void;
	clearSelection: () => void;
	deselectItem: (id: string) => void;
	focusedId: string | null;
	invertSelection: (allIds: string[]) => void;
	isActive: (id: string) => boolean;

	// Selectores
	isItemSelected: (id: string) => boolean;
	isMultiSelectMode: boolean;
	isSelected: (id: string) => boolean; // Alias
	lastSelectedItem: EntityWithStats | null;
	removeFromSelection: (id: string) => void;
	removeSelectedId: (id: string) => void; // Alias de removeFromSelection
	selectAll: (items: EntityWithStats[] | string[]) => void;
	selectedIds: string[];
	// Estado
	selectedItems: EntityWithStats[];
	selectItem: (item: EntityWithStats) => void;
	selectRange: (ids: string[]) => void;
	setActiveId: (id: string | null) => void; // Alias de setFocusedId
	setFocusedId: (id: string | null) => void;
	setMultiSelectMode: (enabled: boolean) => void;
	setSelectedIds: (ids: string[]) => void;
	setSelection: (ids: string[]) => void;
	toggleSelectedId: (id: string) => void; // Toggle simple por ID

	// Acciones principales
	toggleSelection: (id: string, item?: EntityWithStats) => void;
}

/**
 * Store central para la selección de archivos y entidades - MIGRADO A EntityWithStats
 * Reemplaza la funcionalidad de selección de useFileManager
 * ✅ Actualizado para usar EntityWithStats en lugar de FileItem
 */
export const useSelectionStore = create<SelectionState>()(
	devtools(
		immer((set, get) => ({
			// Estado inicial
			selectedItems: [],
			selectedIds: [],
			lastSelectedItem: null,
			focusedId: null,
			activeId: null, // Sincronizado con focusedId
			isMultiSelectMode: false,

			// Acciones
			toggleSelection: (id: string, item?: EntityWithStats) => {
				const state = get();
				const isSelected = state.selectedIds.includes(id);

				// En modo de selección única, reemplazar selección
				if (!state.isMultiSelectMode) {
					if (isSelected) {
						set({ selectedItems: [], selectedIds: [], lastSelectedItem: null, focusedId: null, activeId: null });
					} else if (item) {
						set({
							selectedItems: [item],
							selectedIds: [id],
							lastSelectedItem: item,
							focusedId: id,
							activeId: id,
						});
					}
					return;
				}

				// En modo multi-selección, toggle individual
				if (isSelected) {
					set((draft) => {
						draft.selectedItems = draft.selectedItems.filter((i) => i.id !== id);
						draft.selectedIds = draft.selectedIds.filter((i) => i !== id);
						draft.lastSelectedItem = draft.selectedItems[0] ?? null;
					});
				} else if (item) {
					set((draft) => {
						draft.selectedItems.push(item);
						draft.selectedIds.push(id);
						draft.lastSelectedItem = item;
						draft.focusedId = id;
						draft.activeId = id;
					});
				}
			},

			selectItem: (item: EntityWithStats) => {
				const state = get();

				if (state.isMultiSelectMode) {
					if (!state.selectedIds.includes(item.id)) {
						set((draft) => {
							draft.selectedItems.push(item);
							draft.selectedIds.push(item.id);
							draft.lastSelectedItem = item;
							draft.focusedId = item.id;
							draft.activeId = item.id;
						});
					}
				} else {
					set({
						selectedItems: [item],
						selectedIds: [item.id],
						lastSelectedItem: item,
						focusedId: item.id,
						activeId: item.id,
					});
				}
			},

			deselectItem: (id: string) => {
				set((draft) => {
					draft.selectedItems = draft.selectedItems.filter((item) => item.id !== id);
					draft.selectedIds = draft.selectedIds.filter((itemId) => itemId !== id);
					draft.lastSelectedItem = draft.selectedItems[0] ?? null;
					if (draft.focusedId === id) {
						draft.focusedId = null;
						draft.activeId = null;
					}
				});
			},

			clearSelection: () => {
				set({
					selectedItems: [],
					selectedIds: [],
					lastSelectedItem: null,
					focusedId: null,
					activeId: null,
				});
			},

			setMultiSelectMode: (enabled: boolean) => {
				set((draft) => {
					draft.isMultiSelectMode = enabled;
					if (!enabled && draft.lastSelectedItem) {
						draft.selectedItems = [draft.lastSelectedItem];
						draft.selectedIds = [draft.lastSelectedItem.id];
					}
				});
			},

			setFocusedId: (id: string | null) => {
				set({ focusedId: id, activeId: id });
			},

			setActiveId: (id: string | null) => {
				set({ focusedId: id, activeId: id });
			},

			addToSelection: (id: string) => {
				const state = get();
				if (!state.selectedIds.includes(id)) {
					set((draft) => {
						draft.selectedIds.push(id);
						draft.focusedId = id;
						draft.activeId = id;
					});
				}
			},

			addSelectedId: (id: string) => {
				get().addToSelection(id);
			},

			removeFromSelection: (id: string) => {
				set((draft) => {
					draft.selectedIds = draft.selectedIds.filter((itemId) => itemId !== id);
					draft.selectedItems = draft.selectedItems.filter((item) => item.id !== id);
					if (draft.focusedId === id) {
						draft.focusedId = null;
						draft.activeId = null;
					}
				});
			},

			removeSelectedId: (id: string) => {
				get().removeFromSelection(id);
			},

			toggleSelectedId: (id: string) => {
				const state = get();
				if (state.selectedIds.includes(id)) {
					get().removeFromSelection(id);
				} else {
					get().addToSelection(id);
				}
			},

			setSelection: (ids: string[]) => {
				set({
					selectedIds: [...ids],
					focusedId: ids[0] ?? null,
					activeId: ids[0] ?? null,
				});
			},

			selectRange: (ids: string[]) => {
				const state = get();
				if (state.isMultiSelectMode) {
					const newIds = [...new Set([...state.selectedIds, ...ids])];
					set({ selectedIds: newIds });
				} else {
					set({ selectedIds: [...ids] });
				}
			},

			setSelectedIds: (ids: string[]) => {
				set({
					selectedIds: [...ids],
					focusedId: ids[0] ?? null,
					activeId: ids[0] ?? null,
				});
			},

			selectAll: (items: EntityWithStats[] | string[]) => {
				if (items.length === 0) {
					set({ selectedIds: [], selectedItems: [], isMultiSelectMode: false });
					return;
				}

				// Detectar si es array de strings o de EntityWithStats
				if (typeof items[0] === 'string') {
					const ids = items as string[];
					set({
						selectedIds: [...ids],
						isMultiSelectMode: ids.length > 1,
						focusedId: ids[0],
						activeId: ids[0],
					});
				} else {
					const entities = items as EntityWithStats[];
					const allIds = entities.map((item) => item.id);
					set({
						selectedItems: [...entities],
						selectedIds: allIds,
						lastSelectedItem: entities.at(-1) ?? null,
						isMultiSelectMode: entities.length > 1,
						focusedId: allIds[0],
						activeId: allIds[0],
					});
				}
			},

			invertSelection: (allIds: string[]) => {
				const state = get();
				const newSelectedIds = allIds.filter((id) => !state.selectedIds.includes(id));
				set({
					selectedIds: newSelectedIds,
					focusedId: newSelectedIds[0] ?? null,
					activeId: newSelectedIds[0] ?? null,
				});
			},

			// Selectores
			isItemSelected: (id: string) => get().selectedIds.includes(id),
			isSelected: (id: string) => get().selectedIds.includes(id),
			isActive: (id: string) => get().activeId === id,
		})),
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
