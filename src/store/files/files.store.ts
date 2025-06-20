import { getFavoriteImages, getImages } from '@/app/actions/images/image-crud.actions';
import { getTags } from '@/app/actions/tags/tag.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { getCollections } from '@/services/collection/collection.service';
import { getFolders } from '@/services/folder/folder.service';
import type { CollectionComplete } from '@/types/entities/collection';
import type { FolderComplete } from '@/types/entities/folder';
import type { ImageComplete } from '@/types/entities/image';
import type { TagComplete } from '@/types/entities/tag';
import type { FileItem, RelatedTag } from '@/types/files';
import { create } from 'zustand';

const ITEMS_PER_BATCH = 50;
const filesLogger = clientLogger.withContext('FilesStore');

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
interface ServerCollection extends CollectionComplete {
	_count?: { images: number };
}

interface ServerFolder extends FolderComplete {
	_count?: { images: number };
}

interface ServerTag extends TagComplete {
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
	loadFavorites: () => Promise<void>;
	selectItem: (item: FileItem) => void;
	deselectItem: (id: string) => void;
	handleSelectFolder: (id: string) => Promise<void>;
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
			const result = await getImages({ pageSize: 1000 });
			const items = result.images || [];
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
			const items: ImageComplete[] = await getFavoriteImages();
			set({
				currentItems: items.map(imageToFileItem),
				displayedItems: items.slice(0, ITEMS_PER_BATCH).map(imageToFileItem),
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
			// Importar dinámicamente la función de folder images
			const { getLatestFolderImages } = await import('@/app/actions/images/folder-images.action');
			const response = await getLatestFolderImages(id, 1000); // Obtener hasta 1000 imágenes
			const items = response.data || [];
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

	handleSelectCollection: async (id: string) => {
		try {
			set({ isLoading: true, currentCollectionId: id });
			const { getCollectionImages } = await import('@/app/actions/collections/collection.actions');
			const items: ImageComplete[] = await getCollectionImages(id);
			set({
				currentItems: items.map(imageToFileItem),
				displayedItems: items.slice(0, ITEMS_PER_BATCH).map(imageToFileItem),
				isProcessingThumbnails: true,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false, isProcessingThumbnails: false });
		}
	},

	handleSelectTag: async (id: string) => {
		try {
			set({ isLoading: true, currentTagId: id });
			const { getTagImages } = await import('@/app/actions/tags/tag.actions');
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

// Transformer simple para convertir Image a FileItem (debería estar en un archivo transformer)
function imageToFileItem(image: ImageComplete): FileItem {
	return {
		id: image.id,
		name: image.name || 'Untitled',
		type: 'image',
		path: image.path,
		size: image.size || 0,
		width: image.width || 0,
		height: image.height || 0,
		metadata: image.metadata || '',
		thumbnail: image.thumbnail || null,
		thumbnailSize: image.thumbnailSize || undefined,
		thumbnailWidth: image.thumbnailWidth || undefined,
		thumbnailHeight: image.thumbnailHeight || undefined,
		thumbnailError: image.thumbnailError || null,
		thumbnailErrorAt: image.thumbnailErrorAt || null,
		thumbnailOptimizedAt: image.thumbnailOptimizedAt || null,
		isPublic: false, // TODO: Implementar isPublic si es necesario
		isFavorite: image.isFavorite || false,
		folderId: image.folderId,
		createdAt: image.addedAt, // ImageBase usa addedAt en lugar de createdAt
		updatedAt: image.addedAt, // TODO: Implementar updatedAt en ImageBase si es necesario
		modifiedAt: image.addedAt, // Usar addedAt como modifiedAt
		accessedAt: image.addedAt, // Usar addedAt como accessedAt
		hash: image.hash || '',
		src: image.path, // Usar path como src
		// Las relaciones en ImageComplete son solo { id: string }[], no tienen name/color
		// Por ahora retornamos arrays vacíos hasta que se implemente correctamente
		collections: [],
		tags: [],
		places: [],
		worldItems: [],
		concepts: [],
		prompts: [],
		notes: [],
		groups: [],
		properties: [],
		wildcards: [],
		stats: undefined, // TODO: Implementar stats
	};
}
