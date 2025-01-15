import { create } from "zustand";
import { getImageUrl } from "@/app/actions/image.actions";
import { getThumbnail } from "@/app/actions/thumbnails.actions";
import { ThumbnailQuality } from "@/config/thumbnail.config";

interface ImageResource {
  thumbnailUrl?: string;
  originalUrl?: string;
  isLoading: boolean;
  error?: string;
  lastLoaded?: number;
}

interface ImageResourcesState {
  resources: Record<string, ImageResource>;
  loadingQueue: Set<string>;
  // Métodos
  getThumbnail: (imageId: string) => Promise<string | undefined>;
  getOriginalUrl: (imageId: string) => Promise<string | undefined>;
  preloadResources: (imageIds: string[]) => Promise<void>;
  clearResources: () => void;
  isLoading: (imageId: string) => boolean;
  hasResource: (imageId: string) => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useImageResources = create<ImageResourcesState>((set, get) => ({
  resources: {},
  loadingQueue: new Set(),

  getThumbnail: async (imageId: string) => {
    const state = get();
    const resource = state.resources[imageId];

    // Si ya está cargado y no ha expirado, retornar
    if (
      resource?.thumbnailUrl &&
      resource.lastLoaded &&
      Date.now() - resource.lastLoaded < CACHE_DURATION
    ) {
      return resource.thumbnailUrl;
    }

    // Si ya está en cola de carga, esperar
    if (state.loadingQueue.has(imageId)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const current = get().resources[imageId];
          if (current?.thumbnailUrl) {
            clearInterval(checkInterval);
            resolve(current.thumbnailUrl);
          }
        }, 100);
      });
    }

    try {
      state.loadingQueue.add(imageId);
      set((state) => ({
        resources: {
          ...state.resources,
          [imageId]: {
            ...state.resources[imageId],
            isLoading: true,
          },
        },
      }));

      const data = await getThumbnail(imageId, ThumbnailQuality.MEDIUM);
      const thumbnailUrl = `data:${data.mimeType || "image/webp"};base64,${data.thumbnail
        }`;

      set((state) => ({
        resources: {
          ...state.resources,
          [imageId]: {
            ...state.resources[imageId],
            thumbnailUrl,
            isLoading: false,
            lastLoaded: Date.now(),
          },
        },
      }));

      return thumbnailUrl;
    } catch (error) {
      console.error("Error loading thumbnail:", error);
      set((state) => ({
        resources: {
          ...state.resources,
          [imageId]: {
            ...state.resources[imageId],
            error: "Error loading thumbnail",
            isLoading: false,
          },
        },
      }));
      return undefined;
    } finally {
      state.loadingQueue.delete(imageId);
    }
  },

  getOriginalUrl: async (imageId: string) => {
    const state = get();
    const resource = state.resources[imageId];

    if (
      resource?.originalUrl &&
      resource.lastLoaded &&
      Date.now() - resource.lastLoaded < CACHE_DURATION
    ) {
      return resource.originalUrl;
    }

    if (state.loadingQueue.has(imageId)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const current = get().resources[imageId];
          if (current?.originalUrl) {
            clearInterval(checkInterval);
            resolve(current.originalUrl);
          }
        }, 100);
      });
    }

    try {
      state.loadingQueue.add(imageId);
      set((state) => ({
        resources: {
          ...state.resources,
          [imageId]: {
            ...state.resources[imageId],
            isLoading: true,
          },
        },
      }));

      const url = await getImageUrl(imageId);

      set((state) => ({
        resources: {
          ...state.resources,
          [imageId]: {
            ...state.resources[imageId],
            originalUrl: url,
            isLoading: false,
            lastLoaded: Date.now(),
          },
        },
      }));

      return url;
    } catch (error) {
      console.error("Error loading original URL:", error);
      set((state) => ({
        resources: {
          ...state.resources,
          [imageId]: {
            ...state.resources[imageId],
            error: "Error loading original URL",
            isLoading: false,
          },
        },
      }));
      return undefined;
    } finally {
      state.loadingQueue.delete(imageId);
    }
  },

  preloadResources: async (imageIds: string[]) => {
    const state = get();
    const unloadedIds = imageIds.filter(
      (id) => !state.hasResource(id) && !state.loadingQueue.has(id)
    );

    // Cargar en lotes de 5
    for (let i = 0; i < unloadedIds.length; i += 5) {
      const batch = unloadedIds.slice(i, i + 5);
      await Promise.all([
        ...batch.map((id) => state.getThumbnail(id)),
        ...batch.map((id) => state.getOriginalUrl(id)),
      ]);
      // Pequeña pausa entre lotes
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  },

  clearResources: () => {
    set({ resources: {}, loadingQueue: new Set() });
  },

  isLoading: (imageId: string) => {
    const state = get();
    return state.loadingQueue.has(imageId) || state.resources[imageId]?.isLoading;
  },

  hasResource: (imageId: string) => {
    const state = get();
    const resource = state.resources[imageId];
    return !!(
      resource &&
      resource.lastLoaded &&
      Date.now() - resource.lastLoaded < CACHE_DURATION &&
      (resource.thumbnailUrl || resource.originalUrl)
    );
  },
}));