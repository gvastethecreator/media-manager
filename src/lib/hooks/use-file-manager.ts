import { create } from "zustand";

interface FileManagerState {
  currentFolder: string | null;
  setCurrentFolder: (id: string | null) => void;
  currentCollection: string | null;
  setCurrentCollection: (id: string | null) => void;
  currentTag: string | null;
  setCurrentTag: (id: string | null) => void;
  stats: {
    totalFiles: number;
    totalSize: number;
    processedFiles: number;
    failedFiles: number;
  };
  updateStats: (stats: Partial<FileManagerState["stats"]>) => void;
}

export const useFileManager = create<FileManagerState>((set) => ({
  currentFolder: null,
  setCurrentFolder: (id) => set({ currentFolder: id }),
  currentCollection: null,
  setCurrentCollection: (id) => set({ currentCollection: id }),
  currentTag: null,
  setCurrentTag: (id) => set({ currentTag: id }),
  stats: {
    totalFiles: 0,
    totalSize: 0,
    processedFiles: 0,
    failedFiles: 0,
  },
  updateStats: (newStats) =>
    set((state) => ({
      stats: {
        ...state.stats,
        ...newStats,
      },
    })),
}));