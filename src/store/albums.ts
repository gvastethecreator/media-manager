import { create } from "zustand";
import { logger } from "@/lib/logger";
import { albumService, type AlbumCreate, type AlbumUpdate } from "@/services/album.service";

const albumLogger = logger.withContext("AlbumsStore");

interface AlbumsState {
  albums: Awaited<ReturnType<typeof albumService.getAlbums>>;
  isLoading: boolean;
  loadAlbums: () => Promise<void>;
  createAlbum: (data: AlbumCreate) => Promise<void>;
  updateAlbum: (id: string, data: AlbumUpdate) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
}

export const useAlbumsStore = create<AlbumsState>((set, get) => ({
  albums: [],
  isLoading: false,

  loadAlbums: async () => {
    try {
      set({ isLoading: true });
      albumLogger.info("🔄 Cargando álbumes...");
      const albums = await albumService.getAlbums();
      albumLogger.info(`✅ ${albums.length} álbumes cargados`);
      set({ albums });
    } catch (error) {
      albumLogger.error("❌ Error al cargar álbumes:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createAlbum: async (data) => {
    try {
      albumLogger.info("➕ Creando nuevo álbum:", data);
      await albumService.createAlbum(data);
      await get().loadAlbums();
    } catch (error) {
      albumLogger.error("❌ Error al crear álbum:", error);
      throw error;
    }
  },

  updateAlbum: async (id, data) => {
    try {
      albumLogger.info("💾 Actualizando álbum:", { id, data });
      await albumService.updateAlbum(id, data);
      await get().loadAlbums();
    } catch (error) {
      albumLogger.error("❌ Error al actualizar álbum:", error);
      throw error;
    }
  },

  deleteAlbum: async (id) => {
    try {
      albumLogger.info("🗑️ Eliminando álbum:", id);
      await albumService.deleteAlbum(id);
      await get().loadAlbums();
    } catch (error) {
      albumLogger.error("❌ Error al eliminar álbum:", error);
      throw error;
    }
  },
}));