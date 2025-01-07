import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { thumbnailService, type ThumbnailStats } from "@/services/thumbnail.service";
import { logger } from "@/lib/logger";

interface ProcessStatus {
  status?: string;
  currentFile?: string;
  current?: number;
  total?: number;
  progress?: number;
  folderId?: string;
}

interface ThumbnailStore {
  stats: ThumbnailStats | null;
  isLoading: boolean;
  isProcessing: boolean;
  processStatus: ProcessStatus;
  error: string | null;
  // Actions
  initialize: () => Promise<void>;
  updateStats: (stats: ThumbnailStats) => void;
  setProcessing: (isProcessing: boolean) => void;
  updateProcessStatus: (status: ProcessStatus) => void;
  setError: (error: string | null) => void;
}

export const useThumbnailStore = create<ThumbnailStore>()(
  devtools(
    (set, get) => ({
      stats: null,
      isLoading: false,
      isProcessing: false,
      processStatus: {},
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          const stats = await thumbnailService.getStats();
          set({ stats, isLoading: false });
        } catch (error) {
          logger.error("Error initializing thumbnail store:", error);
          set({
            error: error instanceof Error ? error.message : "Error al cargar estadísticas",
            isLoading: false
          });
        }
      },

      updateStats: (stats) => {
        set({ stats });
      },

      setProcessing: (isProcessing) => {
        set({ isProcessing });
        if (!isProcessing) {
          set({ processStatus: {} });
        }
      },

      updateProcessStatus: (status) => {
        set({ processStatus: { ...get().processStatus, ...status } });
      },

      setError: (error) => {
        set({ error });
      }
    }),
    { name: "thumbnail-store" }
  )
);