import { getCollections } from '@/app/actions/collections/collection.actions';
import { getFolders } from '@/app/actions/folders';
import { getTagImages } from '@/app/actions/tags/tag.actions';
import { getTags } from '@/app/actions/tags/tag.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { FileItem, RelatedTag } from '@/types/file-item';
import type { Collection } from '@prisma/client';
import { create } from 'zustand';

const ITEMS_PER_BATCH = 50;
const filesLogger = serverLogger.withContext('FilesStore');

interface CollectionWithCount {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	count?: number;
}

interface FolderWithCount {
	id: string;
	name: string;
	count?: number;
}

interface TagWithCount {
	id: string;
	name: string;
	color: string;
	count?: number;
}

interface TagMapping {
	id: string;
	name: string;
	color?: string;
}

// Interfaces para datos recibidos del servidor
interface ServerCollection extends Collection {
	_count?: { images: number };
}

interface ServerFolder {
	id: string;
	name: string;
	_count?: { images: number };
}

interface ServerTag {
	id: string;
	name: string;
	color: string;
	_count?: { images: number };
}

export interface FilesState {
	currentItems: FileItem[];
	displayedItems: FileItem[];
	selectedItem: FileItem | null;
	selectedIds: string[];
	currentFolderId: string | null;
	currentCollectionId: string | null;
	currentTagId: string | null;
	isLoading: boolean;
	error: string | null;
	collections: CollectionWithCount[];
	folders: FolderWithCount[];
	tags: TagWithCount[];
	isProcessingThumbnails: boolean;
	initialize: () => Promise<void>;
	loadAllImages: () => Promise<void>;
	handleSelectCollection: (id: string) => Promise<void>;
	handleSelectTag: (id: string) => Promise<void>;
	loadMoreItems: () => void;
}

export const useFilesStore = create<FilesState>((set, _get) => ({
	currentItems: [],
	displayedItems: [],
	selectedItem: null,
	selectedIds: [],
	currentFolderId: null,
	currentCollectionId: null,
	currentTagId: null,
	isLoading: false,
	error: null,
	collections: [],
	folders: [],
	tags: [],
	isProcessingThumbnails: false,

	initialize: async () => {
		try {
			set({ isLoading: true });
			const [folders, collections, tags] = await Promise.all([getFolders(), getCollections(), getTags()]);
			set({
				collections: collections.map((c: ServerCollection) => ({
					id: c.id,
					name: c.name,
					count: c._count?.images || 0,
					emoji: c.emoji,
					color: c.color,
				})),
				folders: folders.map((f: ServerFolder) => ({
					id: f.id,
					name: f.name,
					count: f._count?.images || 0,
				})),
				tags: tags.map((t: ServerTag) => ({
					id: t.id,
					name: t.name,
					count: t._count?.images || 0,
					color: t.color,
				})),
			});
		} catch (error) {
			filesLogger.error('Error al inicializar:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false });
		}
	},

	loadAllImages: async () => {
		try {
			set({ isLoading: true });
			const response = await fetch('/api/images/all');
			if (!response.ok) {
				throw new Error('Error al cargar imágenes');
			}
			const data = await response.json();
			const items = data.items || [];
			set({
				currentItems: items,
				displayedItems: items.slice(0, ITEMS_PER_BATCH),
				isProcessingThumbnails: true,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false, isProcessingThumbnails: false });
		}
	},

	loadFavorites: async () => {
		try {
			set({ isLoading: true });
			const response = await fetch('/api/images/favorites/all');
			if (!response.ok) {
				throw new Error('Error al cargar favoritos');
			}
			const data = await response.json();
			const items = data.items || [];
			set({
				currentItems: items,
				displayedItems: items.slice(0, ITEMS_PER_BATCH),
				isProcessingThumbnails: true,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false, isProcessingThumbnails: false });
		}
	},

	selectItem: (item: FileItem) => {
		set((state) => ({
			selectedItem: item,
			selectedIds: [...state.selectedIds, item.id],
		}));
	},

	deselectItem: (id: string) => {
		set((state) => ({
			selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
			selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
		}));
	},

	handleSelectFolder: async (id: string) => {
		try {
			set({ isLoading: true, currentFolderId: id });
			const response = await fetch(`/api/folders/${id}/images/all`);
			if (!response.ok) {
				throw new Error('Error al cargar carpeta');
			}
			const data = await response.json();
			const items = data.items || [];
			set({
				currentItems: items,
				displayedItems: items.slice(0, ITEMS_PER_BATCH),
				isProcessingThumbnails: true,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false, isProcessingThumbnails: false });
		}
	},

	handleSelectCollection: async (id) => {
		try {
			set({ isLoading: true, currentCollectionId: id });
			const response = await fetch(`/api/collections/${id}/images/all`);
			if (!response.ok) {
				throw new Error('Error al cargar colección');
			}
			const data = await response.json();
			const items = data.items || [];
			set({
				currentItems: items,
				displayedItems: items.slice(0, ITEMS_PER_BATCH),
				isProcessingThumbnails: true,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false, isProcessingThumbnails: false });
		}
	},

	handleSelectTag: async (id) => {
		try {
			set({ isLoading: true, currentTagId: id });
			const rawItems = await getTagImages(id);

			const items = rawItems.map((item) => {
				const itemTags = Array.isArray(item.tags) ? item.tags : [];

				const tags: RelatedTag[] = itemTags.map((t: TagMapping) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#94a3b8',
				}));

				return {
					...item,
					type: item.type === 'image' || item.type === 'file' || item.type === 'folder' ? item.type : 'file',
					modifiedAt: new Date(item.updatedAt),
					accessedAt: new Date(item.updatedAt),
					tags,
				} as FileItem;
			});

			set({ currentItems: items, displayedItems: items.slice(0, ITEMS_PER_BATCH), isLoading: false });
		} catch (error) {
			console.error('Error al cargar etiqueta:', error);
			set({ error: 'Error al cargar etiqueta', isLoading: false });
		}
	},

	loadMoreItems: () => {
		set((state) => {
			const currentLength = state.displayedItems.length;
			const nextBatch = state.currentItems.slice(currentLength, currentLength + ITEMS_PER_BATCH);
			return {
				displayedItems: [...state.displayedItems, ...nextBatch],
			};
		});
	},
}));
