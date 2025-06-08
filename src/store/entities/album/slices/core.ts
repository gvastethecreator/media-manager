/**
 * @file Slice principal para operaciones CRUD del store de álbumes
 * @module store/entities/album/slices/core
 */

import type { StateCreator } from 'zustand';
import { createAlbum, deleteAlbum, getAlbum, getAlbums, moveAlbum } from '../../../../app/actions/albums/album.actions';
import { extendAlbum } from '../../../../transformers/album/serializers';
import type {
	Album,
	AlbumBase,
	CreateAlbumData,
	UpdateAlbumData,
	UpdateAlbumItemsData,
} from '../../../../types/entities/album';
import type { AlbumState } from '../types';

// Slice para operaciones CRUD básicas
export interface AlbumCoreSlice {
	// Getters
	getAlbum: (id: string) => Album | undefined;
	getAlbums: () => Album[];
	getChildAlbums: (parentId: string) => Album[];
	getRootAlbums: () => Album[];
	getAlbumItems: (albumId: string) => Array<{ id: string; type: 'image' | 'video' }>;
	getAlbumGroups: (albumId: string) => string[];
	getAlbumProperties: (albumId: string) => string[];
	getAlbumWildcards: (albumId: string) => string[];

	// Operaciones
	addAlbum: (album: AlbumBase) => void;
	addAlbums: (albums: AlbumBase[]) => void;
	updateAlbum: (id: string, data: UpdateAlbumData) => void;
	deleteAlbum: (id: string) => void;

	// Gestión de elementos
	addItemToAlbum: (albumId: string, itemId: string, itemType: 'image' | 'video') => void;
	removeItemFromAlbum: (albumId: string, itemId: string) => void;
	updateAlbumItems: (albumId: string, data: UpdateAlbumItemsData) => void;
	clearAlbumItems: (albumId: string) => void;

	// Gestión de relaciones
	addGroupToAlbum: (albumId: string, groupId: string) => void;
	removeGroupFromAlbum: (albumId: string, groupId: string) => void;
	addPropertyToAlbum: (albumId: string, propertyId: string) => void;
	removePropertyFromAlbum: (albumId: string, propertyId: string) => void;
	addWildcardToAlbum: (albumId: string, wildcardId: string) => void;
	removeWildcardFromAlbum: (albumId: string, wildcardId: string) => void;
	updateAlbumRelations: (
		albumId: string,
		data: { groupIds?: string[]; propertyIds?: string[]; wildcardIds?: string[] }
	) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchAlbum: (id: string) => Promise<Album | undefined>;
	fetchAlbums: (parentId?: string) => Promise<Album[]>;
	createAlbum: (data: CreateAlbumData) => Promise<Album | undefined>;
	removeAlbum: (id: string) => Promise<boolean>;
	moveAlbum: (id: string, newParentId: string | null) => Promise<boolean>;
}

// Creador del slice
export const createAlbumCoreSlice: StateCreator<AlbumState, [], [], AlbumCoreSlice> = (set, get) => ({
	// Getters
	getAlbum: (id: string) => {
		return get().core.albums[id];
	},

	getAlbums: () => {
		return Object.values(get().core.albums);
	},

	getChildAlbums: (parentId: string) => {
		return Object.values(get().core.albums).filter((album) => album.parentId === parentId);
	},

	getRootAlbums: () => {
		return Object.values(get().core.albums).filter((album) => !album.parentId);
	},

	getAlbumItems: (albumId: string) => {
		return get().core.albumItems[albumId] || [];
	},

	getAlbumGroups: (albumId: string) => {
		const album = get().core.albums[albumId];
		return album?.groups?.map((group) => group.id) || [];
	},

	getAlbumProperties: (albumId: string) => {
		const album = get().core.albums[albumId];
		return album?.properties?.map((property) => property.id) || [];
	},

	getAlbumWildcards: (albumId: string) => {
		const album = get().core.albums[albumId];
		return album?.wildcards?.map((wildcard) => wildcard.id) || [];
	},

	// Operaciones síncronas
	addAlbum: (album: AlbumBase) => {
		const extendedAlbum = extendAlbum(album);
		set((state) => ({
			core: {
				...state.core,
				albums: {
					...state.core.albums,
					[album.id]: extendedAlbum,
				},
				lastUpdated: Date.now(),
			},
		}));
	},

	addAlbums: (albums: AlbumBase[]) => {
		const extendedAlbums = albums.map((album) => extendAlbum(album));
		const albumsMap = extendedAlbums.reduce(
			(acc, album) => {
				acc[album.id] = album;
				return acc;
			},
			{} as Record<string, Album>
		);

		set((state) => ({
			core: {
				...state.core,
				albums: {
					...state.core.albums,
					...albumsMap,
				},
				lastUpdated: Date.now(),
			},
		}));
	},

	updateAlbum: (id: string, data: UpdateAlbumData) => {
		set((state) => {
			const album = state.core.albums[id];
			if (!album) return state;

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[id]: {
							...album,
							...data,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	deleteAlbum: (id: string) => {
		set((state) => {
			const newAlbums = { ...state.core.albums };
			delete newAlbums[id];

			const newAlbumItems = { ...state.core.albumItems };
			delete newAlbumItems[id];

			return {
				core: {
					...state.core,
					albums: newAlbums,
					albumItems: newAlbumItems,
					lastUpdated: Date.now(),
				},
			};
		});
	},

	// Gestión de elementos de álbum
	addItemToAlbum: (albumId: string, itemId: string, itemType: 'image' | 'video') => {
		set((state) => {
			const currentItems = state.core.albumItems[albumId] || [];

			// Verificar si el item ya existe
			if (currentItems.some((item) => item.id === itemId)) {
				return state;
			}

			return {
				core: {
					...state.core,
					albumItems: {
						...state.core.albumItems,
						[albumId]: [...currentItems, { id: itemId, type: itemType }],
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	removeItemFromAlbum: (albumId: string, itemId: string) => {
		set((state) => {
			const currentItems = state.core.albumItems[albumId] || [];

			return {
				core: {
					...state.core,
					albumItems: {
						...state.core.albumItems,
						[albumId]: currentItems.filter((item) => item.id !== itemId),
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	updateAlbumItems: (albumId: string, data: UpdateAlbumItemsData) => {
		set((state) => {
			const currentItems = state.core.albumItems[albumId] || [];

			// Convertir elementos a formato interno
			const newItems = data.items.map((item) => ({
				id: item.itemId,
				type: item.itemType,
			}));

			// Reemplazar todos o añadir a los existentes
			const updatedItems = data.replaceExisting
				? newItems
				: [...currentItems, ...newItems.filter((newItem) => !currentItems.some((item) => item.id === newItem.id))];

			return {
				core: {
					...state.core,
					albumItems: {
						...state.core.albumItems,
						[albumId]: updatedItems,
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	clearAlbumItems: (albumId: string) => {
		set((state) => ({
			core: {
				...state.core,
				albumItems: {
					...state.core.albumItems,
					[albumId]: [],
				},
				lastUpdated: Date.now(),
			},
		}));
	},

	// Gestión de relaciones
	addGroupToAlbum: (albumId: string, groupId: string) => {
		set((state) => {
			const album = state.core.albums[albumId];
			if (!album) return state;

			const newGroups = album.groups ? [...album.groups] : [];
			if (!newGroups.some((g) => g.id === groupId)) {
				newGroups.push({ id: groupId }); // Solo almacenar el ID del grupo
			}

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[albumId]: {
							...album,
							groups: newGroups,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	removeGroupFromAlbum: (albumId: string, groupId: string) => {
		set((state) => {
			const album = state.core.albums[albumId];
			if (!album) return state;

			const filteredGroups = album.groups ? album.groups.filter((g) => g.id !== groupId) : [];

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[albumId]: {
							...album,
							groups: filteredGroups,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	addPropertyToAlbum: (albumId: string, propertyId: string) => {
		set((state) => {
			const album = state.core.albums[albumId];
			if (!album) return state;

			const newProperties = album.properties ? [...album.properties] : [];
			if (!newProperties.some((p) => p.id === propertyId)) {
				newProperties.push({ id: propertyId });
			}

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[albumId]: {
							...album,
							properties: newProperties,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	removePropertyFromAlbum: (albumId: string, propertyId: string) => {
		set((state) => {
			const album = state.core.albums[albumId];
			if (!album) return state;

			const filteredProperties = album.properties ? album.properties.filter((p) => p.id !== propertyId) : [];

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[albumId]: {
							...album,
							properties: filteredProperties,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	addWildcardToAlbum: (albumId: string, wildcardId: string) => {
		set((state) => {
			const album = state.core.albums[albumId];
			if (!album) return state;

			const newWildcards = album.wildcards ? [...album.wildcards] : [];
			if (!newWildcards.some((w) => w.id === wildcardId)) {
				newWildcards.push({ id: wildcardId });
			}

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[albumId]: {
							...album,
							wildcards: newWildcards,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	removeWildcardFromAlbum: (albumId: string, wildcardId: string) => {
		set((state) => {
			const album = state.core.albums[albumId];
			if (!album) return state;

			const filteredWildcards = album.wildcards ? album.wildcards.filter((w) => w.id !== wildcardId) : [];

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[albumId]: {
							...album,
							wildcards: filteredWildcards,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	updateAlbumRelations: (
		albumId: string,
		data: { groupIds?: string[]; propertyIds?: string[]; wildcardIds?: string[] }
	) => {
		set((state) => {
			const album = state.core.albums[albumId];
			if (!album) return state;

			const updatedRelations: Partial<AlbumRelations> = {};
			if (data.groupIds) {
				updatedRelations.groups = data.groupIds.map((id) => ({ id }));
			}
			if (data.propertyIds) {
				updatedRelations.properties = data.propertyIds.map((id) => ({ id }));
			}
			if (data.wildcardIds) {
				updatedRelations.wildcards = data.wildcardIds.map((id) => ({ id }));
			}

			return {
				core: {
					...state.core,
					albums: {
						...state.core.albums,
						[albumId]: {
							...album,
							...updatedRelations,
						},
					},
					lastUpdated: Date.now(),
				},
			};
		});
	},

	// Estado de carga y error
	setLoading: (isLoading: boolean) => {
		set((state) => ({ loading: isLoading }));
	},
	setError: (error: string | null) => {
		set((state) => ({ error: error }));
	},

	// Acciones asíncronas con Server Actions
	fetchAlbum: async (id: string) => {
		set({ loading: true, error: null });
		try {
			const album = await getAlbum(id);
			if (album) {
				get().addAlbum(album);
				return album;
			}
			return undefined;
		} catch (error: any) {
			set({ error: error.message, loading: false });
			console.error('Error fetching album:', error);
			return undefined;
		} finally {
			set({ loading: false });
		}
	},

	fetchAlbums: async (parentId?: string) => {
		set({ loading: true, error: null });
		try {
			const albums = await getAlbums();
			get().addAlbums(albums);
			return albums;
		} catch (error: any) {
			set({ error: error.message, loading: false });
			console.error('Error fetching albums:', error);
			return [];
		} finally {
			set({ loading: false });
		}
	},

	createAlbum: async (data: CreateAlbumData) => {
		set({ loading: true, error: null });
		try {
			const newAlbum = await createAlbum(data);
			if (newAlbum) {
				get().addAlbum(newAlbum);
			}
			return newAlbum;
		} catch (error: any) {
			set({ error: error.message, loading: false });
			console.error('Error creating album:', error);
			return undefined;
		} finally {
			set({ loading: false });
		}
	},

	removeAlbum: async (id: string) => {
		set({ loading: true, error: null });
		try {
			await deleteAlbum(id);
			get().deleteAlbum(id);
			return true;
		} catch (error: any) {
			set({ error: error.message, loading: false });
			console.error('Error removing album:', error);
			return false;
		} finally {
			set({ loading: false });
		}
	},

	moveAlbum: async (id: string, newParentId: string | null) => {
		set({ loading: true, error: null });
		try {
			await moveAlbum(id, newParentId);
			// Actualizar el estado localmente después de la acción exitosa
			set((state) => {
				const albumToMove = state.core.albums[id];
				if (!albumToMove) return state;
				return {
					core: {
						...state.core,
						albums: {
							...state.core.albums,
							[id]: {
								...albumToMove,
								parentId: newParentId,
							},
						},
						lastUpdated: Date.now(),
					},
				};
			});
			return true;
		} catch (error: any) {
			set({ error: error.message, loading: false });
			console.error('Error moving album:', error);
			return false;
		} finally {
			set({ loading: false });
		}
	},
});
