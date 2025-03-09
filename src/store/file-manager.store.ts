import { getAlbumImages } from '@/app/actions/album.actions';
import { getCharacterImages } from '@/app/actions/character.actions';
import { getCollectionImages } from '@/app/actions/collection.actions';
import { getFolderImages } from '@/app/actions/folder.actions';
import { getObjectImages } from '@/app/actions/object.actions';
import { getPlaceImages } from '@/app/actions/place.actions';
import { getStats } from '@/app/actions/stats.actions';
import { getTagImages } from '@/app/actions/tag.actions';
import { logger } from '@/lib/logger';
import type { FileItem } from '@/types/file-item';
import type { ViewMode } from '@/types/settings';
import type { RelatedTag } from '@/types/tag';
import { create } from 'zustand';

const fileManagerLogger = logger.withContext('FileManagerStore');

// Tipos para entidades
interface BaseEntity {
	id: string;
	name: string;
	count: number;
}

interface CollectionEntity extends BaseEntity {
	color?: string;
	emoji?: string;
}

interface TagEntity extends BaseEntity {
	color: string;
}

interface EntityWithEmoji extends BaseEntity {
	emoji: string;
}

// Tipos para la transformación de datos
interface APIImageResponse {
	id: string;
	name: string;
	path: string;
	type?: string;
	size: number;
	width?: number | null;
	height?: number | null;
	metadata?: string | { dimensions?: { width: number; height: number }; mimeType?: string } | null;
	thumbnail?: string | Uint8Array | null;
	thumbnailSize?: number | null;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	folderId: string;
	createdAt: string | Date;
	updatedAt: string | Date;
	collections?: Array<{ id: string; name?: string }> | string[];
	tags?: Array<{ id: string; name?: string; color?: string }> | string[];
	albums?: Array<{ id: string; name?: string }> | string[];
	characters?: Array<{ id: string; name?: string }> | string[];
	places?: Array<{ id: string; name?: string }> | string[];
	objects?: Array<{ id: string; name?: string }> | string[];
	hash?: string;
	stats?: {
		id: string;
		createdAt: Date;
		updatedAt: Date;
		imageId: string;
		views: number;
		downloads: number;
		lastViewed: Date;
	} | null;
}

// Estado del store
interface FileManagerState {
	initialState: boolean;
	// Estado de items
	currentItems: FileItem[];
	displayedItems: FileItem[];
	isLoading: boolean;
	error: string | null;
	lastUpdate: number;

	// Estado de selección
	selectedItem: FileItem | null;
	selectedItems: FileItem[];
	lastSelectedItem: FileItem | null;

	// Estado de contexto actual
	currentFolderId: string | null;
	currentCollectionId: string | null;
	currentTagId: string | null;
	currentAlbumId: string | null;
	currentCharacterId: string | null;
	currentPlaceId: string | null;
	currentObjectId: string | null;
	currentConceptId: string | null;
	currentPromptId: string | null;
	currentNoteId: string | null;

	// Objetos actuales
	currentCollection: CollectionEntity | null;
	currentFolder: BaseEntity | null;
	currentTag: TagEntity | null;
	currentAlbum: EntityWithEmoji | null;
	currentCharacter: EntityWithEmoji | null;
	currentPlace: EntityWithEmoji | null;
	currentObject: EntityWithEmoji | null;
	currentConcept: EntityWithEmoji | null;
	currentPrompt: EntityWithEmoji | null;
	currentNote: BaseEntity | null;

	// Metadatos
	collections: CollectionEntity[];
	folders: BaseEntity[];
	tags: TagEntity[];
	albums: EntityWithEmoji[];
	characters: EntityWithEmoji[];
	places: EntityWithEmoji[];
	objects: EntityWithEmoji[];
	concepts: EntityWithEmoji[];
	prompts: EntityWithEmoji[];
	notes: BaseEntity[];

	// Estado de procesamiento
	isProcessingThumbnails: boolean;

	// Acciones
	initialize: () => Promise<void>;
	loadItems: (url: string) => Promise<void>;
	loadMoreItems: () => void;
	selectItem: (item: FileItem) => void;
	deselectItem: (id: string) => void;
	toggleItemSelection: (item: FileItem, isMultiSelect: boolean) => void;
	clearSelection: () => void;
	setCurrentFolder: (id: string) => Promise<void>;
	setCurrentCollection: (id: string) => Promise<void>;
	setCurrentTag: (id: string) => Promise<void>;
	setCurrentAlbum: (id: string) => Promise<void>;
	setCurrentCharacter: (id: string) => Promise<void>;
	setCurrentPlace: (id: string) => Promise<void>;
	setCurrentObject: (id: string) => Promise<void>;
	setCurrentConcept: (id: string) => Promise<void>;
	setCurrentPrompt: (id: string) => Promise<void>;
	setCurrentNote: (id: string) => Promise<void>;
	setItems: (items: FileItem[]) => void;
	setIsLoading: (loading: boolean) => void;
	resetState: () => void;

	// Estado de vista
	viewMode: ViewMode;
}

interface FileManagerActions {
	setViewMode: (mode: 'grid' | 'list' | 'masonry' | 'cards') => void;
}

const ITEMS_PER_BATCH = 50;

const initialState: FileManagerState = {
	initialState: true,
	currentItems: [],
	displayedItems: [],
	selectedItem: null,
	selectedItems: [],
	lastSelectedItem: null,
	currentFolderId: null,
	currentCollectionId: null,
	currentTagId: null,
	currentAlbumId: null,
	currentCharacterId: null,
	currentPlaceId: null,
	currentObjectId: null,
	currentConceptId: null,
	currentPromptId: null,
	currentNoteId: null,
	currentCollection: null,
	currentFolder: null,
	currentTag: null,
	currentAlbum: null,
	currentCharacter: null,
	currentPlace: null,
	currentObject: null,
	currentConcept: null,
	currentPrompt: null,
	currentNote: null,
	isLoading: false,
	error: null,
	collections: [],
	folders: [],
	tags: [],
	albums: [],
	characters: [],
	places: [],
	objects: [],
	concepts: [],
	prompts: [],
	notes: [],
	isProcessingThumbnails: false,
	lastUpdate: Date.now(),
	viewMode: 'grid' as const,
	// Funciones stub que serán reemplazadas por las implementaciones reales
	initialize: async () => {},
	loadItems: async () => {},
	loadMoreItems: () => {},
	selectItem: () => {},
	deselectItem: () => {},
	toggleItemSelection: () => {},
	clearSelection: () => {},
	setCurrentFolder: async () => {},
	setCurrentCollection: async () => {},
	setCurrentTag: async () => {},
	setCurrentAlbum: async () => {},
	setCurrentCharacter: async () => {},
	setCurrentPlace: async () => {},
	setCurrentObject: async () => {},
	setCurrentConcept: async () => {},
	setCurrentPrompt: async () => {},
	setCurrentNote: async () => {},
	setItems: () => {},
	setIsLoading: () => {},
	resetState: () => {},
};

// Definir un tipo para el item raw que llega de la API
type PartialFileItem = Partial<FileItem> & {
	id: string;
	name: string;
	path: string;
	size: number;
	folderId: string;
	createdAt: string | Date;
	updatedAt: string | Date;
	collections?: Array<{ id: string; name?: string }> | string[];
	tags?: Array<{ id: string; name?: string; color?: string }> | string[];
	albums?: Array<{ id: string; name?: string }> | string[];
	characters?: Array<{ id: string; name?: string }> | string[];
	places?: Array<{ id: string; name?: string }> | string[];
	objects?: Array<{ id: string; name?: string }> | string[];
};

// Función auxiliar para validar tipos de datos
const validateDataTypes = (item: PartialFileItem): void => {
	// Validar tipos básicos
	if (typeof item.id !== 'string') {
		throw new Error('id debe ser string');
	}
	if (typeof item.name !== 'string') {
		throw new Error('name debe ser string');
	}
	if (typeof item.path !== 'string') {
		throw new Error('path debe ser string');
	}
	if (typeof item.size !== 'number') {
		throw new Error('size debe ser number');
	}
	if (typeof item.folderId !== 'string') {
		throw new Error('folderId debe ser string');
	}

	// Validar tipos opcionales
	if (item.type && typeof item.type !== 'string') {
		throw new Error('type debe ser string');
	}
	if (item.width && typeof item.width !== 'number') {
		throw new Error('width debe ser number');
	}
	if (item.height && typeof item.height !== 'number') {
		throw new Error('height debe ser number');
	}
	if (item.isPublic && typeof item.isPublic !== 'boolean') {
		throw new Error('isPublic debe ser boolean');
	}
	if (item.isFavorite && typeof item.isFavorite !== 'boolean') {
		throw new Error('isFavorite debe ser boolean');
	}

	// Validar fechas
	if (!(item.createdAt instanceof Date) && !Date.parse(item.createdAt)) {
		throw new Error('createdAt debe ser una fecha válida');
	}
	if (!(item.updatedAt instanceof Date) && !Date.parse(item.updatedAt)) {
		throw new Error('updatedAt debe ser una fecha válida');
	}

	// Validar arrays
	const validateArray = <T>(arr: T[] | undefined, name: string): void => {
		if (arr && !Array.isArray(arr)) {
			throw new Error(`${name} debe ser un array`);
		}
	};

	validateArray(item.collections, 'collections');
	validateArray(item.tags, 'tags');
	validateArray(item.albums, 'albums');
	validateArray(item.characters, 'characters');
	validateArray(item.places, 'places');
	validateArray(item.objects, 'objects');
};

// Función auxiliar para validar datos requeridos
const validateRequiredFields = (item: Record<string, unknown>): void => {
	const requiredFields = ['id', 'name', 'path', 'size', 'folderId'];
	const missingFields = requiredFields.filter((field) => !item[field]);

	if (missingFields.length > 0) {
		throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
	}
};

// Función auxiliar para transformar la respuesta de la API en FileItem
const transformToFileItem = (rawItem: PartialFileItem): FileItem => {
	try {
		fileManagerLogger.debug('🔄 Transformando item:', rawItem.id);

		// Validar campos requeridos
		validateRequiredFields(rawItem as Record<string, unknown>);

		// Validar tipos de datos
		validateDataTypes(rawItem);

		// Primero convertimos a APIImageResponse para validar la estructura
		const item: APIImageResponse = {
			id: rawItem.id,
			name: rawItem.name,
			path: rawItem.path,
			type: rawItem.type,
			size: rawItem.size,
			width: rawItem.width,
			height: rawItem.height,
			metadata: rawItem.metadata,
			thumbnail: rawItem.thumbnail,
			thumbnailSize: rawItem.thumbnailSize,
			thumbnailWidth: rawItem.thumbnailWidth,
			thumbnailHeight: rawItem.thumbnailHeight,
			isPublic: rawItem.isPublic,
			isFavorite: rawItem.isFavorite,
			folderId: rawItem.folderId,
			createdAt: rawItem.createdAt,
			updatedAt: rawItem.updatedAt,
			collections: rawItem.collections,
			tags: rawItem.tags,
			albums: rawItem.albums,
			characters: rawItem.characters,
			places: rawItem.places,
			objects: rawItem.objects,
			hash: rawItem.hash,
			stats: rawItem.stats,
		};

		fileManagerLogger.debug('✅ Estructura validada:', item.id);

		// Luego transformamos a FileItem
		const fileItem: FileItem = {
			id: item.id,
			name: item.name,
			path: item.path,
			type: item.type === 'image' || item.type === 'file' || item.type === 'folder' ? item.type : 'file',
			size: item.size,
			width: item.width || null,
			height: item.height || null,
			metadata:
				typeof item.metadata === 'string' ? item.metadata : item.metadata ? JSON.stringify(item.metadata) : null,
			thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : null,
			thumbnailSize: item.thumbnailSize || null,
			thumbnailWidth: item.thumbnailWidth || null,
			thumbnailHeight: item.thumbnailHeight || null,
			isPublic: item.isPublic || false,
			isFavorite: item.isFavorite || false,
			folderId: item.folderId,
			createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
			updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
			modifiedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
			accessedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
			collections: Array.isArray(item.collections)
				? item.collections.map((c) => (typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }))
				: [],
			tags: Array.isArray(item.tags)
				? item.tags.map((t) =>
						typeof t === 'string'
							? { id: t, name: t, color: '#94a3b8' }
							: { id: t.id, name: t.name || t.id, color: t.color || '#94a3b8' }
					)
				: [],
			albums: Array.isArray(item.albums)
				? item.albums.map((a) => (typeof a === 'string' ? { id: a, name: a } : { id: a.id, name: a.name || a.id }))
				: [],
			characters: Array.isArray(item.characters)
				? item.characters.map((c) => (typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }))
				: [],
			places: Array.isArray(item.places)
				? item.places.map((p) => (typeof p === 'string' ? { id: p, name: p } : { id: p.id, name: p.name || p.id }))
				: [],
			objects: Array.isArray(item.objects)
				? item.objects.map((o) => (typeof o === 'string' ? { id: o, name: o } : { id: o.id, name: o.name || o.id }))
				: [],
		};

		fileManagerLogger.debug('✅ Transformación completada:', fileItem.id);
		return fileItem;
	} catch (error) {
		fileManagerLogger.error('❌ Error transformando item:', error);
		throw new Error(`Error transformando item: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
};

export const useFileManager = create<FileManagerState & FileManagerActions>((set, get) => ({
	...initialState,

	// Inicialización
	initialize: async () => {
		try {
			fileManagerLogger.info('🔄 Inicializando File Manager');
			set({ isLoading: true, error: null });

			const stats = await getStats();
			set({
				collections: stats.collections || [],
				folders: stats.folders || [],
				tags: stats.tags || [],
				albums: stats.albums || [],
				characters: stats.characters || [],
				places: stats.places || [],
				objects: stats.objects || [],
				concepts: stats.concepts || [],
				prompts: stats.prompts || [],
				notes: stats.notes || [],
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info('✅ File Manager inicializado');
		} catch (error) {
			fileManagerLogger.error('❌ Error al inicializar:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false });
		}
	},

	// Carga de items
	loadItems: async (url: string) => {
		try {
			fileManagerLogger.info('🔄 Cargando items desde:', url);
			set({ isLoading: true, error: null });

			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Error al cargar datos desde ${url}`);
			}
			const data = await response.json();
			const items = (data.items || []).map(transformToFileItem);

			set({
				currentItems: items,
				displayedItems: items.slice(0, ITEMS_PER_BATCH),
				isProcessingThumbnails: true,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ ${items.length} items cargados`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar items:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false, isProcessingThumbnails: false });
		}
	},

	loadMoreItems: () => {
		const state = get();
		const currentLength = state.displayedItems.length;
		const nextBatch = state.currentItems.slice(currentLength, currentLength + ITEMS_PER_BATCH);

		fileManagerLogger.info(`🔄 Cargando ${nextBatch.length} items adicionales`);
		set({
			displayedItems: [...state.displayedItems, ...nextBatch],
			lastUpdate: Date.now(),
		});
	},

	// Selección de items
	selectItem: (item) => {
		fileManagerLogger.info('🎯 Seleccionando item:', item.id);
		set((state) => ({
			selectedItem: item,
			selectedItems: [...state.selectedItems, item],
			lastSelectedItem: item,
			lastUpdate: Date.now(),
		}));
	},

	deselectItem: (id) => {
		fileManagerLogger.info('🎯 Deseleccionando item:', id);
		set((state) => ({
			selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
			selectedItems: state.selectedItems.filter((item) => item.id !== id),
			lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem,
			lastUpdate: Date.now(),
		}));
	},

	toggleItemSelection: (item, isMultiSelect) => {
		const state = get();
		const isSelected = state.selectedItems.some((i) => i.id === item.id);

		fileManagerLogger.info(`🔄 Toggle selección de item ${item.id} (multi: ${isMultiSelect})`);

		if (!isMultiSelect) {
			set({
				selectedItem: item,
				selectedItems: [item],
				lastSelectedItem: item,
				lastUpdate: Date.now(),
			});
			return;
		}

		if (isSelected) {
			state.deselectItem(item.id);
		} else {
			state.selectItem(item);
		}
	},

	clearSelection: () => {
		fileManagerLogger.info('🧹 Limpiando selección');
		set({
			selectedItem: null,
			selectedItems: [],
			lastSelectedItem: null,
			lastUpdate: Date.now(),
		});
	},

	// Navegación
	setCurrentFolder: async (id: string) => {
		try {
			fileManagerLogger.info('📂 Cambiando a carpeta:', id);
			const state = get();
			const folder = state.folders.find((f) => f.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: id,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: folder,
				currentCollection: null,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: null,
				currentObject: null,
				currentConcept: null,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getFolderImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Carpeta cargada con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar carpeta:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentCollection: async (id: string) => {
		try {
			fileManagerLogger.info('📚 Cambiando a colección:', id);
			const state = get();
			const collection = state.collections.find((c) => c.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: id,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: collection,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: null,
				currentObject: null,
				currentConcept: null,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getCollectionImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Colección cargada con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar colección:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentTag: async (id: string) => {
		try {
			fileManagerLogger.info('🏷️ Cambiando a etiqueta:', id);
			const state = get();
			const tag = state.tags.find((t) => t.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: id,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: null,
				currentTag: tag,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: null,
				currentObject: null,
				currentConcept: null,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getTagImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Etiqueta cargada con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar etiqueta:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentAlbum: async (id: string) => {
		try {
			fileManagerLogger.info('📸 Cambiando a álbum:', id);
			const state = get();
			const album = state.albums.find((a) => a.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: id,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: null,
				currentTag: null,
				currentAlbum: album,
				currentCharacter: null,
				currentPlace: null,
				currentObject: null,
				currentConcept: null,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getAlbumImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Álbum cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar álbum:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentCharacter: async (id: string) => {
		try {
			fileManagerLogger.info('👤 Cambiando a personaje:', id);
			const state = get();
			const character = state.characters.find((c) => c.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: id,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: null,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: character,
				currentPlace: null,
				currentObject: null,
				currentConcept: null,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getCharacterImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Personaje cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar personaje:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentPlace: async (id: string) => {
		try {
			fileManagerLogger.info('📍 Cambiando a lugar:', id);
			const state = get();
			const place = state.places.find((p) => p.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: id,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: null,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: place,
				currentObject: null,
				currentConcept: null,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getPlaceImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Lugar cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar lugar:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentObject: async (id: string) => {
		try {
			fileManagerLogger.info('📦 Cambiando a objeto:', id);
			const state = get();
			const object = state.objects.find((o) => o.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: id,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: null,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: null,
				currentObject: object,
				currentConcept: null,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getObjectImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Objeto cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar objeto:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentConcept: async (id: string) => {
		try {
			fileManagerLogger.info('💡 Cambiando a concepto:', id);
			const state = get();
			const concept = state.concepts.find((c) => c.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: id,
				currentPromptId: null,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: null,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: null,
				currentObject: null,
				currentConcept: concept,
				currentPrompt: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getTagImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Concepto cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar concepto:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentPrompt: async (id: string) => {
		try {
			fileManagerLogger.info('💬 Cambiando a prompt:', id);
			const state = get();
			const prompt = state.prompts.find((p) => p.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: id,
				currentNoteId: null,
				currentFolder: null,
				currentCollection: null,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: null,
				currentObject: null,
				currentConcept: null,
				currentPrompt: prompt,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getTagImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Prompt cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar prompt:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentNote: async (id: string) => {
		try {
			fileManagerLogger.info('📝 Cambiando a nota:', id);
			const state = get();
			const note = state.notes.find((n) => n.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentCollectionId: null,
				currentTagId: null,
				currentAlbumId: null,
				currentCharacterId: null,
				currentPlaceId: null,
				currentObjectId: null,
				currentConceptId: null,
				currentPromptId: null,
				currentNoteId: id,
				currentFolder: null,
				currentCollection: null,
				currentTag: null,
				currentAlbum: null,
				currentCharacter: null,
				currentPlace: null,
				currentObject: null,
				currentConcept: null,
				currentPrompt: null,
				currentNote: note,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			const rawImages = await getTagImages(id);
			const images = rawImages.map(transformToFileItem);
			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Nota cargada con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar nota:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setItems: (items: FileItem[]) => {
		fileManagerLogger.info(`📥 Actualizando items (${items.length})`);
		set({
			currentItems: items,
			displayedItems: items.slice(0, ITEMS_PER_BATCH),
			lastUpdate: Date.now(),
		});
	},

	setIsLoading: (loading: boolean) => {
		set({ isLoading: loading, lastUpdate: Date.now() });
	},

	resetState: () => {
		fileManagerLogger.info('🔄 Restaurando estado inicial');
		set({ ...initialState, lastUpdate: Date.now() });
	},

	// Estado de vista
	viewMode: initialState.viewMode,
	setViewMode: (mode: 'grid' | 'list' | 'masonry' | 'cards') => set({ viewMode: mode }),
}));

// Tipos exportados para uso en componentes
export type { FileManagerState, BaseEntity, CollectionEntity, TagEntity, EntityWithEmoji };
