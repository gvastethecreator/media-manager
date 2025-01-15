import { create } from "zustand";
import { getImageUrl } from "@/app/actions/image.actions";
import { getThumbnail } from "@/app/actions/thumbnails.actions";
import { ThumbnailQuality } from "@/config/thumbnail.config";
import { logger } from "@/lib/logger";

const resourceLogger = logger.withContext("ImageResources");

interface ImageResource {
  id: string;
  thumbnail?: string;
  originalUrl?: string;
  isLoading: boolean;
  error?: string;
  lastUpdate: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface ImageResourcesState {
  resources: Map<string, ImageResource>;
  loadingQueue: Set<string>;
  preloadQueue: string[];
  isProcessing: boolean;

  // Métodos principales
  getThumbnail: (id: string) => Promise<string | undefined>;
  getOriginalUrl: (id: string) => Promise<string | undefined>;
  preloadResources: (ids: string[]) => void;
  isLoading: (id: string) => boolean;
  clearResources: () => void;
}

// Configuración optimizada
const CACHE_CONFIG = {
  maxAge: 5 * 60 * 1000, // 5 minutos
  cleanupInterval: 60 * 1000, // 1 minuto
  maxQueueSize: 10,
  preloadDelay: 500,
  retryDelay: 2000,
  maxRetries: 3
};

export const useImageResources = create<ImageResourcesState>((set, get) => {
  // Limpieza periódica de caché
  setInterval(() => {
    const state = get();
    const now = Date.now();
    const resources = new Map(state.resources);

    for (const [id, resource] of resources.entries()) {
      if (now - resource.lastUpdate > CACHE_CONFIG.maxAge) {
        resources.delete(id);
      }
    }

    set({ resources });
  }, CACHE_CONFIG.cleanupInterval);

  return {
    resources: new Map(),
    loadingQueue: new Set(),
    preloadQueue: [],
    isProcessing: false,

    getThumbnail: async (id: string) => {
      const state = get();
      const resource = state.resources.get(id);

      // Si ya tenemos el thumbnail y no está expirado, retornarlo
      if (resource?.thumbnail &&
        Date.now() - resource.lastUpdate < CACHE_CONFIG.maxAge) {
        return resource.thumbnail;
      }

      // Si ya está en cola de carga, esperar
      if (state.loadingQueue.has(id)) {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            const updatedResource = get().resources.get(id);
            if (updatedResource?.thumbnail) {
              clearInterval(checkInterval);
              resolve(updatedResource.thumbnail);
            }
          }, 100);
        });
      }

      try {
        state.loadingQueue.add(id);
        const data = await getThumbnail(id, ThumbnailQuality.MEDIUM);

        if (data?.thumbnail) {
          const thumbnailUrl = `data:${data.mimeType || "image/webp"};base64,${data.thumbnail}`;
          set(state => ({
            resources: new Map(state.resources).set(id, {
              id,
              thumbnail: thumbnailUrl,
              isLoading: false,
              lastUpdate: Date.now(),
              dimensions: {
                width: data.width,
                height: data.height
              }
            })
          }));
          return thumbnailUrl;
        }
      } catch (error) {
        resourceLogger.error("Error loading thumbnail:", { id, error });
        set(state => ({
          resources: new Map(state.resources).set(id, {
            id,
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
            lastUpdate: Date.now()
          })
        }));
      } finally {
        state.loadingQueue.delete(id);
      }
    },

    getOriginalUrl: async (id: string) => {
      const state = get();
      const resource = state.resources.get(id);

      // Si ya tenemos la URL original y no está expirada, retornarla
      if (resource?.originalUrl &&
        Date.now() - resource.lastUpdate < CACHE_CONFIG.maxAge) {
        return resource.originalUrl;
      }

      try {
        const url = await getImageUrl(id);
        if (url) {
          set(state => ({
            resources: new Map(state.resources).set(id, {
              ...(state.resources.get(id) || { id, isLoading: false }),
              originalUrl: url,
              lastUpdate: Date.now()
            })
          }));
          return url;
        }
      } catch (error) {
        resourceLogger.error("Error loading original URL:", { id, error });
        set(state => ({
          resources: new Map(state.resources).set(id, {
            ...(state.resources.get(id) || { id, isLoading: false }),
            error: error instanceof Error ? error.message : "Unknown error",
            lastUpdate: Date.now()
          })
        }));
      }
    },

    preloadResources: (ids: string[]) => {
      const state = get();
      if (state.isProcessing) return;

      // Filtrar IDs que ya están cargados o en cola
      const newIds = ids.filter(id => {
        const resource = state.resources.get(id);
        return !resource?.thumbnail && !state.loadingQueue.has(id);
      });

      if (newIds.length === 0) return;

      set({
        preloadQueue: [...state.preloadQueue, ...newIds].slice(0, CACHE_CONFIG.maxQueueSize),
        isProcessing: true
      });

      // Procesar cola de precarga
      const processQueue = async () => {
        const currentState = get();
        if (currentState.preloadQueue.length === 0) {
          set({ isProcessing: false });
          return;
        }

        const id = currentState.preloadQueue[0];
        await currentState.getThumbnail(id);

        set(state => ({
          preloadQueue: state.preloadQueue.slice(1)
        }));

        setTimeout(processQueue, CACHE_CONFIG.preloadDelay);
      };

      processQueue();
    },

    isLoading: (id: string) => {
      const state = get();
      return state.loadingQueue.has(id);
    },

    clearResources: () => {
      set({
        resources: new Map(),
        loadingQueue: new Set(),
        preloadQueue: [],
        isProcessing: false
      });
    }
  };
});