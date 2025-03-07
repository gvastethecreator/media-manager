import type { FileItem } from '@/types/file-item';
import { create } from 'zustand';

interface FileSelectionState {
	selectedItems: FileItem[];
	lastSelectedItem: FileItem | null;
	setSelectedItems: (items: FileItem[]) => void;
	addSelectedItem: (item: FileItem) => void;
	removeSelectedItem: (item: FileItem) => void;
	toggleSelectedItem: (item: FileItem, isMultiSelect: boolean) => void;
	clearSelection: () => void;
	setLastSelectedItem: (item: FileItem | null) => void;
}

export const useFileSelection = create<FileSelectionState>((set, get) => ({
	selectedItems: [],
	lastSelectedItem: null,
	setSelectedItems: (items) => set({ selectedItems: items }),
	addSelectedItem: (item) =>
		set((state) => ({
			selectedItems: [...state.selectedItems, item],
		})),
	removeSelectedItem: (item) =>
		set((state) => ({
			selectedItems: state.selectedItems.filter((i) => i.id !== item.id),
		})),
	toggleSelectedItem: (item, isMultiSelect) => {
		const state = get();
		const isSelected = state.selectedItems.some((i) => i.id === item.id);

		if (!isMultiSelect) {
			// Si no es multi-selección, solo seleccionamos este item
			set({
				selectedItems: [item],
				lastSelectedItem: item,
			});
			return;
		}

		// Si es multi-selección (shift presionado)
		if (isSelected) {
			// Si ya está seleccionado, lo quitamos
			state.removeSelectedItem(item);
		} else {
			// Si no está seleccionado, lo agregamos a la selección existente
			state.addSelectedItem(item);
		}
		state.setLastSelectedItem(item);
	},
	clearSelection: () => set({ selectedItems: [], lastSelectedItem: null }),
	setLastSelectedItem: (item) => set({ lastSelectedItem: item }),
}));
