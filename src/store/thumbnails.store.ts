import { create } from 'zustand';
import { logger } from '@/lib/logger';
import * as thumbnailActions from '@/app/actions/thumbnails.actions';
import type { ThumbnailError, ThumbnailStats, ThumbnailProcessStatus } from '@/types/thumbnails';

export interface ProcessStatus {
  status: string;
  progress: number;
  current?: number;
  total?: number;
  currentFile?: string;
  lastProcessed?: {
    id: string;
    path: string;
    processedAt: string;
    saved?: number;
  };
}

interface ThumbnailStore {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  stats: ThumbnailStats;
  processStatus: ProcessStatus;
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  setStats: (stats: Partial<ThumbnailStats>) => void;
  setProcessStatus: (status: Partial<ProcessStatus>) => void;
  initialize: () => Promise<void>;
  reset: () => void;
}

const initialStats: ThumbnailStats = {
  pending: 0,
  processed: 0,
  totalFiles: 0,
  withThumbnail: 0,
  totalSize: 0,
  errors: []
};

const initialProcessStatus: ProcessStatus = {
  status: '',
  progress: 0
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const useThumbnailStore = create<ThumbnailStore>((set, get) => ({
  isLoading: true,
  isProcessing: false,
  error: null,
  stats: initialStats,
  processStatus: initialProcessStatus,

  setLoading: (loading) => set({ isLoading: loading }),

  setProcessing: (processing) => set((state) => {
    if (!processing) {
      return {
        isProcessing: false,
        processStatus: initialProcessStatus
      };
    }
    return { isProcessing: true };
  }),

  setError: (error) => set((state) => ({
    error,
    isProcessing: error ? false : state.isProcessing,
    processStatus: error ? initialProcessStatus : state.processStatus
  })),

  setStats: (stats) => set((state) => ({
    stats: {
      ...state.stats,
      ...stats,
      errors: stats.errors || state.stats.errors
    }
  })),

  setProcessStatus: (status) => set((state) => ({
    processStatus: {
      ...state.processStatus,
      ...status,
      progress: status.progress ?? state.processStatus.progress,
      status: status.status || state.processStatus.status
    }
  })),

  initialize: async () => {
    const store = get();
    try {
      store.setLoading(true);
      store.setError(null);

      const stats = await thumbnailActions.getThumbnailStats();
      store.setStats(stats);
    } catch (error) {
      logger.error('Error inicializando thumbnails:', error);
      store.setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      store.setLoading(false);
    }
  },

  reset: () => set({
    isLoading: false,
    isProcessing: false,
    error: null,
    stats: initialStats,
    processStatus: initialProcessStatus
  })
}));