import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { AnyEntityWithStats } from '@/types/entities';

interface SelectionState {
  selectedIds: string[];
  selectedItems: AnyEntityWithStats[];
}

interface SelectionActions {
  addToSelection: (id: string, item?: AnyEntityWithStats) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string, item?: AnyEntityWithStats) => void;
  setSelection: (ids: string[], items?: AnyEntityWithStats[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

type SelectionStore = SelectionState & SelectionActions;

export const useSelectionStore = create<SelectionStore>()(
  devtools(
    immer((set, get) => ({
      // State
      selectedIds: [],
      selectedItems: [],

      // Actions
      addToSelection: (id: string, item?: AnyEntityWithStats) => {
        set((state) => {
          if (!state.selectedIds.includes(id)) {
            state.selectedIds.push(id);
            if (item) {
              state.selectedItems.push(item);
            }
          }
        });
      },

      removeFromSelection: (id: string) => {
        set((state) => {
          const index = state.selectedIds.indexOf(id);
          if (index !== -1) {
            state.selectedIds.splice(index, 1);
            state.selectedItems.splice(index, 1);
          }
        });
      },

      toggleSelection: (id: string, item?: AnyEntityWithStats) => {
        const { isSelected, addToSelection, removeFromSelection } = get();
        if (isSelected(id)) {
          removeFromSelection(id);
        } else {
          addToSelection(id, item);
        }
      },

      setSelection: (ids: string[], items?: AnyEntityWithStats[]) => {
        set((state) => {
          state.selectedIds = [...ids];
          state.selectedItems = items ? [...items] : [];
        });
      },

      clearSelection: () => {
        set((state) => {
          state.selectedIds = [];
          state.selectedItems = [];
        });
      },

      isSelected: (id: string) => {
        return get().selectedIds.includes(id);
      },
    })),
    {
      name: 'selection-store',
    }
  )
);
