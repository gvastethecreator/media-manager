import { logger } from "@/lib/logger";
import type { FileItem } from '@/types/file-item';
import {
  getAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addImageToAlbum,
  removeImageFromAlbum,
  getAlbumImages,
  type AlbumCreate,
  type AlbumUpdate,
  type AlbumWithStats
} from '@/app/actions/album.actions';
import { createBaseStore, type BaseEntity } from './base.store';

const albumLogger = logger.withContext("AlbumStore");

interface Album extends BaseEntity {
  emoji: string;
  description?: string;
  color: string;
  shortcut?: string;
  sortBy: string;
  filters: string;
  _count: { images: number };
  totalSize: number;
}

interface AlbumState {
  currentAlbum: Album | null;
  currentItems: FileItem[];
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

const convertServerImageToFileItem = (image: Awaited<ReturnType<typeof getAlbumImages>>[0]): FileItem => {
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

export const useAlbumsStore = createBaseStore<Album>(
  'Album',
  '/api/albums',
  { customLogger: albumLogger }
)((set, get) => ({
  currentAlbum: null,
  currentItems: [],

  // Sobreescribir métodos del BaseStore
  loadItems: async () => {
    try {
      set({ loading: true, error: null });
      const albums = await getAlbums();
      set({ items: albums, loading: false });
      albumLogger.info('📥 Álbumes cargados:', { count: albums.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      albumLogger.error('❌ Error al cargar álbumes:', { error });
    }
  },

  createItem: async (data: AlbumCreate) => {
    try {
      set({ loading: true, error: null });
      const album = await createAlbum(data);
      const albumWithStats = {
        ...album,
        _count: { images: 0 },
        totalSize: 0,
      } as Album;
      set(state => ({
        items: [...state.items, albumWithStats],
        loading: false
      }));
      albumLogger.info('✨ Álbum creado:', { album });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      albumLogger.error('❌ Error al crear álbum:', { error });
    }
  },

  updateItem: async (id: string, data: AlbumUpdate) => {
    try {
      set({ loading: true, error: null });
      const updatedAlbum = await updateAlbum(id, data);
      const currentStats = get().items.find(a => a.id === id);
      const updatedAlbumWithStats = {
        ...updatedAlbum,
        _count: currentStats?._count || { images: 0 },
        totalSize: currentStats?.totalSize || 0,
      } as Album;
      set(state => ({
        items: state.items.map(a =>
          a.id === id ? updatedAlbumWithStats : a
        ),
        currentAlbum: state.currentAlbum?.id === id ? updatedAlbumWithStats : state.currentAlbum,
        loading: false
      }));
      albumLogger.info('📝 Álbum actualizado:', { id, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      albumLogger.error('❌ Error al actualizar álbum:', { id, error });
    }
  },

  deleteItem: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await deleteAlbum(id);
      set(state => ({
        items: state.items.filter(a => a.id !== id),
        currentAlbum: state.currentAlbum?.id === id ? null : state.currentAlbum,
        currentItems: state.currentAlbum?.id === id ? [] : state.currentItems,
        loading: false
      }));
      albumLogger.info('🗑️ Álbum eliminado:', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      albumLogger.error('❌ Error al eliminar álbum:', { id, error });
    }
  },

  // Métodos específicos de Album
  addImageToAlbum: async (albumId: string, imageId: string) => {
    try {
      await addImageToAlbum(albumId, imageId);
      albumLogger.info('📸 Imagen agregada a álbum:', { albumId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage) });
      albumLogger.error('❌ Error al agregar imagen a álbum:', { albumId, imageId, error });
    }
  },

  removeImageFromAlbum: async (albumId: string, imageId: string) => {
    try {
      await removeImageFromAlbum(albumId, imageId);
      set(state => ({
        currentItems: state.currentItems.filter(item => item.id !== imageId)
      }));
      albumLogger.info('🗑️ Imagen eliminada de álbum:', { albumId, imageId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage) });
      albumLogger.error('❌ Error al eliminar imagen de álbum:', { albumId, imageId, error });
    }
  },

  loadAlbumContent: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const [album, images] = await Promise.all([
        getAlbum(id),
        getAlbumImages(id)
      ]);
      if (!album) {
        throw new Error('Álbum no encontrado');
      }

      const fileItems = images.map(convertServerImageToFileItem);

      set({
        currentAlbum: album as Album,
        currentItems: fileItems,
        loading: false
      });
      albumLogger.info('📂 Contenido de álbum cargado:', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      albumLogger.error('❌ Error al cargar contenido de álbum:', { id, error });
    }
  }
}));