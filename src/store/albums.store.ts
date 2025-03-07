import {
	type AlbumWithStats as ActionAlbumWithStats,
	type AlbumCreate,
	type AlbumUpdate,
	addImageToAlbum as addImageToAlbumAction,
	createAlbum as createAlbumAction,
	deleteAlbum as deleteAlbumAction,
	getAlbums,
	updateAlbum as updateAlbumAction,
} from '@/app/actions/album.actions';
import { logger } from '@/lib/logger';
import { Album } from '@prisma/client';
import { create } from 'zustand';

const albumsLogger = logger.withContext('AlbumsStore');

export type AlbumWithStats = ActionAlbumWithStats;

interface AlbumsStore {
	albums: AlbumWithStats[];
	isLoading: boolean;
	error: string | null;
	loadAlbums: () => Promise<void>;
	createAlbum: (album: AlbumCreate) => Promise<void>;
	updateAlbum: (id: string, album: AlbumUpdate) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
	addImageToAlbum: (albumId: string, imageId: string) => Promise<void>;
}

export const useAlbumsStore = create<AlbumsStore>((set) => ({
	albums: [],
	isLoading: false,
	error: null,
	loadAlbums: async () => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('🔄 Cargando álbumes...');
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info(`✅ ${albums.length} álbumes cargados`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar álbumes';
			albumsLogger.error('❌ Error al cargar álbumes:', error);
			set({ error: message, isLoading: false });
		}
	},
	createAlbum: async (album) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('✨ Creando álbum:', album);
			await createAlbumAction(album);
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Álbum creado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear álbum';
			albumsLogger.error('❌ Error al crear álbum:', error);
			set({ error: message, isLoading: false });
		}
	},
	updateAlbum: async (id, album) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('💾 Actualizando álbum:', album);
			await updateAlbumAction(id, { ...album, id });
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Álbum actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar álbum';
			albumsLogger.error('❌ Error al actualizar álbum:', error);
			set({ error: message, isLoading: false });
		}
	},
	deleteAlbum: async (id) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('🗑️ Eliminando álbum:', id);
			await deleteAlbumAction(id);
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Álbum eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar álbum';
			albumsLogger.error('❌ Error al eliminar álbum:', error);
			set({ error: message, isLoading: false });
		}
	},
	addImageToAlbum: async (albumId, imageId) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('➕ Agregando imagen a álbum:', { albumId, imageId });
			await addImageToAlbumAction(albumId, imageId);
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Imagen agregada al álbum');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al agregar imagen al álbum';
			albumsLogger.error('❌ Error al agregar imagen al álbum:', error);
			set({ error: message, isLoading: false });
		}
	},
}));
