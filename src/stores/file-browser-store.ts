import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { ViewConfiguration, FileBrowserViewType } from '@/types/file-browser/view-configuration';

interface FileBrowserState {
  currentViewType: FileBrowserViewType;
  viewConfigurations: Record<FileBrowserViewType, ViewConfiguration>;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  showHiddenFiles: boolean;
  enableAnimations: boolean;
}

interface FileBrowserActions {
  setViewType: (viewType: FileBrowserViewType) => void;
  updateViewConfiguration: (viewType: FileBrowserViewType, config: ViewConfiguration) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  toggleSortDirection: () => void;
  setShowHiddenFiles: (show: boolean) => void;
  setEnableAnimations: (enable: boolean) => void;
}

type FileBrowserStore = FileBrowserState & FileBrowserActions;

export const useFileBrowserStore = create<FileBrowserStore>()(
  devtools(
    immer((set, get) => ({
      // State
      currentViewType: 'grid',
      viewConfigurations: {} as Record<FileBrowserViewType, ViewConfiguration>,
      sortBy: 'name',
      sortDirection: 'asc',
      showHiddenFiles: false,
      enableAnimations: true,

      // Actions
      setViewType: (viewType: FileBrowserViewType) => {
        set((state) => {
          state.currentViewType = viewType;
        });
      },

      updateViewConfiguration: (viewType: FileBrowserViewType, config: ViewConfiguration) => {
        set((state) => {
          state.viewConfigurations[viewType] = config;
        });
      },

      setSortBy: (sortBy: string) => {
        set((state) => {
          state.sortBy = sortBy;
        });
      },

      setSortDirection: (direction: 'asc' | 'desc') => {
        set((state) => {
          state.sortDirection = direction;
        });
      },

      toggleSortDirection: () => {
        set((state) => {
          state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        });
      },

      setShowHiddenFiles: (show: boolean) => {
        set((state) => {
          state.showHiddenFiles = show;
        });
      },

      setEnableAnimations: (enable: boolean) => {
        set((state) => {
          state.enableAnimations = enable;
        });
      },
    })),
    {
      name: 'file-browser-store',
    }
  )
);
