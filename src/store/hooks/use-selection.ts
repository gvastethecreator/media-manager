import { useUnifiedFileManager } from '../unified-file-manager.store';

/**
 * Hook especializado para manejar selección de items
 */
export const useSelection = () => {
	const store = useUnifiedFileManager();
	return {
		selectedItems: store.selectedItems,
		selectedItem: store.selectedItem,
		lastSelectedItem: store.lastSelectedItem,
		selectItem: store.selectItem,
		deselectItem: store.deselectItem,
		toggleItemSelection: store.toggleItemSelection,
		clearSelection: store.clearSelection,
		selectAll: store.selectAll,
		selectRange: store.selectRange,
	};
};
