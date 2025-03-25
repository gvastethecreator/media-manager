/**
 * @file Slice principal para operaciones CRUD del store de videos
 * @module store/entities/video/slices/core
 */

import type { StateCreator } from 'zustand';
import {
    mapCreateVideoDataToPrisma,
    mapVideoVisualConfigToPrisma,
    mapVideoVisualConfigUpdateToPrisma
} from '../../../../transformers/video/mappers';
import {
    extendVideo,
    extendVideos
} from '../../../../transformers/video/serializers';
import type {
    CreateVideoData,
    UpdateVideoData,
    Video,
    VideoBase,
    VideoVisualConfig
} from '../../../../types/entities/video';
import type { VideoState } from '../types';

// Slice para operaciones CRUD básicas
export interface VideoCoreSlice {
  // Getters
  getVideo: (id: string) => Video | undefined;
  getVideos: () => Video[];
  getVideosByFolder: (folderId: string) => Video[];

  // Operaciones
  addVideo: (video: VideoBase) => void;
  addVideos: (videos: VideoBase[]) => void;
  updateVideo: (id: string, data: UpdateVideoData) => void;
  deleteVideo: (id: string) => void;

  // Estado de carga
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones asíncronas
  fetchVideo: (id: string) => Promise<Video | undefined>;
  fetchVideos: (folderIds?: string[]) => Promise<Video[]>;
  createVideo: (data: CreateVideoData) => Promise<Video | undefined>;
  removeVideo: (id: string) => Promise<boolean>;

  // Visual Config
  updateVideoVisualConfig: (videoId: string, config: Partial<VideoVisualConfig>) => Promise<VideoVisualConfig | undefined>;
  fetchVideoVisualConfig: (videoId: string) => Promise<VideoVisualConfig | undefined>;
}

// Creador del slice
export const createVideoCoreSlice: StateCreator<
  VideoState,
  [],
  [],
  VideoCoreSlice
> = (set, get) => ({
  // Getters
  getVideo: (id: string) => {
    return get().core.videos[id];
  },

  getVideos: () => {
    return Object.values(get().core.videos);
  },

  getVideosByFolder: (folderId: string) => {
    return Object.values(get().core.videos).filter(
      (video) => video.folderId === folderId
    );
  },

  // Operaciones síncronas
  addVideo: (video: VideoBase) => {
    const extendedVideo = extendVideo(video);
    set((state) => ({
      core: {
        ...state.core,
        videos: {
          ...state.core.videos,
          [video.id]: extendedVideo,
        },
        lastUpdated: Date.now(),
      },
    }));
  },

  addVideos: (videos: VideoBase[]) => {
    const extendedVideos = extendVideos(videos);
    const videosMap = extendedVideos.reduce(
      (acc, video) => {
        acc[video.id] = video;
        return acc;
      },
      {} as Record<string, Video>
    );

    set((state) => ({
      core: {
        ...state.core,
        videos: {
          ...state.core.videos,
          ...videosMap,
        },
        lastUpdated: Date.now(),
      },
    }));
  },

  updateVideo: (id: string, data: UpdateVideoData) => {
    set((state) => {
      const video = state.core.videos[id];
      if (!video) return state;

      return {
        core: {
          ...state.core,
          videos: {
            ...state.core.videos,
            [id]: {
              ...video,
              ...data,
            },
          },
          lastUpdated: Date.now(),
        },
      };
    });
  },

  deleteVideo: (id: string) => {
    set((state) => {
      const newVideos = { ...state.core.videos };
      delete newVideos[id];

      return {
        core: {
          ...state.core,
          videos: newVideos,
          lastUpdated: Date.now(),
        },
      };
    });
  },

  // Estado de carga
  setLoading: (isLoading: boolean) => {
    set((state) => ({
      core: {
        ...state.core,
        isLoading,
      },
    }));
  },

  setError: (error: string | null) => {
    set((state) => ({
      core: {
        ...state.core,
        error,
      },
    }));
  },

  // Operaciones asíncronas (simuladas, se implementarán con llamadas reales a la API)
  fetchVideo: async (id: string) => {
    const { setLoading, setError, addVideo } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const response = await fetch(`/api/videos/${id}`);
      if (!response.ok) throw new Error('Error al cargar el video');

      const videoData = await response.json();
      addVideo(videoData);
      return get().core.videos[id];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },

  fetchVideos: async (folderIds?: string[]) => {
    const { setLoading, setError, addVideos } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      let url = '/api/videos';
      if (folderIds && folderIds.length > 0) {
        url += `?folders=${folderIds.join(',')}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar los videos');

      const videosData = await response.json();
      addVideos(videosData);
      return Object.values(get().core.videos);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return [];
    } finally {
      setLoading(false);
    }
  },

  createVideo: async (data: CreateVideoData) => {
    const { setLoading, setError, addVideo } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const prismaData = mapCreateVideoDataToPrisma(data);
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prismaData),
      });

      if (!response.ok) throw new Error('Error al crear el video');

      const createdVideo = await response.json();
      addVideo(createdVideo);
      return get().core.videos[createdVideo.id];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },

  removeVideo: async (id: string) => {
    const { setLoading, setError, deleteVideo } = get();
    try {
      setLoading(true);
      // Simulación de llamada a API, reemplazar con implementación real
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar el video');

      deleteVideo(id);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  },

  // Visual Config
  updateVideoVisualConfig: async (videoId: string, config: Partial<VideoVisualConfig>) => {
    const { setLoading, setError, getVideo } = get();
    try {
      setLoading(true);
      const video = getVideo(videoId);
      if (!video) {
        setError('Video no encontrado');
        return undefined;
      }

      const prismaConfig = mapVideoVisualConfigUpdateToPrisma(config);
      const response = await fetch(`/api/videos/${videoId}/visual-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prismaConfig),
      });

      if (!response.ok) throw new Error('Error al actualizar la configuración del video');

      const updatedVideo = await response.json();
      set((state) => ({
        core: {
          ...state.core,
          videos: {
            ...state.core.videos,
            [videoId]: {
              ...video,
              ...updatedVideo,
            },
          },
          lastUpdated: Date.now(),
        },
      }));
      return updatedVideo;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },

  fetchVideoVisualConfig: async (videoId: string) => {
    const { setLoading, setError, getVideo } = get();
    try {
      setLoading(true);
      const video = getVideo(videoId);
      if (!video) {
        setError('Video no encontrado');
        return undefined;
      }

      const prismaConfig = mapVideoVisualConfigToPrisma(video);
      const response = await fetch(`/api/videos/${videoId}/visual-config`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Error al obtener la configuración del video');

      const videoConfig = await response.json();
      set((state) => ({
        core: {
          ...state.core,
          videos: {
            ...state.core.videos,
            [videoId]: {
              ...video,
              ...videoConfig,
            },
          },
          lastUpdated: Date.now(),
        },
      }));
      return videoConfig;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return undefined;
    } finally {
      setLoading(false);
    }
  },
});