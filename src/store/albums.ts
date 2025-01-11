import { create } from "zustand";
import { logger } from "@/lib/logger";
import type { FileItem } from '@/types/file-item';
import {
  getAlbums,
  getAlbum,
  createAlbum as createAlbumAction,
  updateAlbum as updateAlbumAction,
  deleteAlbum as deleteAlbumAction,
  addImageToAlbum as addImageToAlbumAction,
  removeImageFromAlbum as removeImageFromAlbumAction,
  getAlbumImages,
} from '@/app/actions/albums';

const albumLogger = logger.withContext("AlbumStore");

export interface AlbumCreate {
  name: string;
  emoji?: string;
  color?: string;
  description?: string;
  shortcut?: string;
  sortBy?: string;
  filters?: string;
}

export interface AlbumUpdate extends Partial<Omit<AlbumCreate, 'name'>> {
  id: string;
  name?: string;
}

export type Album = Awaited<ReturnType<typeof getAlbum>>;
export type AlbumWithStats = Awaited<ReturnType<typeof getAlbums>>[0];
export type ImageFromServer = Awaited<ReturnType<typeof getAlbumImages>>[0];

interface AlbumsState {
  albums: AlbumWithStats[];
  currentAlbum: Album | null;
  currentItems: FileItem[];
  isLoading: boolean;
  error: string | null;
  // Acciones
  loadAlbums: () => Promise<void>;
  createAlbum: (data: AlbumCreate) => Promise<void>;
  updateAlbum: (id: string, data: AlbumUpdate) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  addImageToAlbum: (albumId: string, imageId: string) => Promise<void>;
  removeImageFromAlbum: (albumId: string, imageId: string) => Promise<void>;
  loadAlbumContent: (id: string) => Promise<void>;
}

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined;
  try {
    const parsed = JSON.parse(metadata);
    return typeof parsed === 'object' ? parsed : undefined;
  } catch {
    albumLogger.warn('⚠️ Error al parsear metadata de imagen');
    return undefined;
  }
};

const convertServerImageToFileItem = (image: ImageFromServer): FileItem => {
  try {
    const metadata = validateMetadata(image.metadata);
    const thumbnail = image.thumbnail
      ? Buffer.from(image.thumbnail).toString('base64')
      : undefined;

    return {
      id: image.id,
      name: image.name,
      path: image.path,
      type: 'image',
      size: image.size,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      metadata,
      thumbnail,
      thumbnailSize: image.thumbnailSize ?? undefined,
      thumbnailWidth: image.thumbnailWidth ?? undefined,
      thumbnailHeight: image.thumbnailHeight ?? undefined,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
      isPublic: image.isPublic ?? false,
      isFavorite: image.isFavorite ?? false,
      folderId: image.folderId,
    };
  } catch (error) {
    albumLogger.error('❌ Error al convertir imagen del servidor:', { error, image });
    throw new Error('Error al procesar imagen del servidor');
  }
};

export const useAlbumsStore = create<AlbumsState>((set, get) => ({
  albums: [],
  currentAlbum: null,
  currentItems: [],
  isLoading: false,
  error: null,

  loadAlbums: async () => {
    try {
      set({ isLoading: true, error: null });
      const albums = await getAlbums();
      set({ albums, isLoading: false });
      albumLogger.info('📥 Álbumes cargados:', { count: albums.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      albumLogger.error('❌ Error al cargar álbumes:', { error });
    }
  },

  createAlbum: async (data: AlbumCreate) => {
    try {
      set({ isLoading: true, error: null });
      const album = await createAlbumAction(data);
      const albumWithStats = {
        ...album,
        _count: { images: 0 },
        totalSize: 0,
      } as AlbumWithStats;
      set(state => ({
        albums: [...state.albums, albumWithStats],
        isLoading: false
      }));
      albumLogger.info('✨ Álbum creado:', { album });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      albumLogger.error('❌ Error al crear álbum:', { error });
    }
  },

  updateAlbum: async (id: string, data: AlbumUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const updatedAlbum = await updateAlbumAction(id, data);
      const currentStats = get().albums.find(a => a.id === id);
      const updatedAlbumWithStats = {
        ...updatedAlbum,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as AlbumWithStats;
      set(state => ({
        albums: state.albums.map(a =>
          a.id === id ? updatedAlbumWithStats : a
        ),
        currentAlbum: state.currentAlbum?.id === id ? updatedAlbumWithStats : state.currentAlbum,
        isLoading: false
      }));
      albumLogger.info('📝 Álbum actualizado:', { id, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      albumLogger.error('❌ Error al actualizar álbum:', { id, error });
    }
  },

  deleteAlbum: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await deleteAlbumAction(id);
      set(state => ({
        albums: state.albums.filter(a => a.id !== id),
        currentAlbum: state.currentAlbum?.id === id ? null : state.currentAlbum,
        currentItems: state.currentAlbum?.id === id ? [] : state.currentItems,
        isLoading: false
      }));
      albumLogger.info('🗑️ Álbum eliminado:', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      albumLogger.error('❌ Error al eliminar álbum:', { id, error });
    }
  },

  addImageToAlbum: async (albumId: string, imageId: string) => {
    try {
      await addImageToAlbumAction(albumId, imageId);
      albumLogger.info('📸 Imagen agregada a álbum:', { albumId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage });
      albumLogger.error('❌ Error al agregar imagen a álbum:', { albumId, imageId, error });
    }
  },

  removeImageFromAlbum: async (albumId: string, imageId: string) => {
    try {
      await removeImageFromAlbumAction(albumId, imageId);
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }));
      albumLogger.info('🗑️ Imagen eliminada de álbum:', { albumId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage });
      albumLogger.error('❌ Error al eliminar imagen de álbum:', { albumId, imageId, error });
    }
  },

  loadAlbumContent: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const [album, images] = await Promise.all([
        getAlbum(id),
        getAlbumImages(id)
      ]);
      if (!album) {
        throw new Error('Álbum no encontrado');
      }

      const fileItems = images.map(convertServerImageToFileItem);

      set({
        currentAlbum: album,
        currentItems: fileItems,
        isLoading: false
      });
      albumLogger.info('📂 Contenido de álbum cargado:', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: errorMessage, isLoading: false });
      albumLogger.error('❌ Error al cargar contenido de álbum:', { id, error });
    }
  }
}));