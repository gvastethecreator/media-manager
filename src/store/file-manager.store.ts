import { getAlbumImages } from '@/app/actions/albums/album.actions';
import { getCharacterImages } from '@/app/actions/characters/character.actions';
import { getCollectionImages } from '@/app/actions/collections/collection.actions';
import { getConceptImages } from '@/app/actions/concepts/concept.actions';
import { getFolderImages } from '@/app/actions/folders';
import { getNoteImages } from '@/app/actions/notes/note.actions';
import { getPlaceImages } from '@/app/actions/places/place.actions';
import { getPromptImages } from '@/app/actions/prompts/prompt.actions';
import { getStats } from '@/app/actions/stats/stats.actions';
import { getTagImages } from '@/app/actions/tags/tag.actions';
import { getWorldItemImages } from '@/app/actions/world-items/world-item.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type {
	FileItem,
	ImageStats,
	RelatedAlbum,
	RelatedCharacter,
	RelatedCollection,
	RelatedConcept,
	RelatedNote,
	RelatedPlace,
	RelatedPrompt,
	RelatedTag,
	RelatedWorldItem,
	ViewType,
} from '@/types/file-item';
import type { ViewMode } from '@/types/settings';
import { create } from 'zustand';

const fileManagerLogger = serverLogger.withContext('FileManagerStore');

// Tipos para entidades
interface BaseEntity {
	id: string;
	name: string;
	title?: string;
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
	thumbnailError?: string | null;
	thumbnailErrorAt?: Date | null;
	thumbnailOptimizedAt?: Date | null;
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
	worldItems?: Array<{ id: string; name?: string }> | string[];
	concepts?: Array<{ id: string; name?: string }> | string[];
	prompts?: Array<{ id: string; name?: string }> | string[];
	notes?: Array<{ id: string; title?: string }> | string[];
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

// Tipos para mapeo de entidades en convertToFileItem
interface EntityReference {
	id: string;
	name?: string;
	title?: string;
	color?: string;
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
	currentView: ViewType;
	currentFolderId: string | null;
	currentCollectionId: string | null;
	currentTagId: string | null;
	currentAlbumId: string | null;
	currentCharacterId: string | null;
	currentPlaceId: string | null;
	currentWorldItemId: string | null;
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
	currentWorldItem: EntityWithEmoji | null;
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
	worldItems: EntityWithEmoji[];
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
	setCurrentWorldItem: (id: string) => Promise<void>;
	setCurrentConcept: (id: string) => Promise<void>;
	setCurrentPrompt: (id: string) => Promise<void>;
	setCurrentNote: (id: string) => Promise<void>;
	setItems: (items: FileItem[]) => void;
	setIsLoading: (loading: boolean) => void;
	resetState: () => void;

	// Estado de vista
	viewMode: ViewMode;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	setSortBy: (field: string) => void;
	setSortOrder: (order: 'asc' | 'desc') => void;
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
	currentView: 'loading',
	currentFolderId: null,
	currentCollectionId: null,
	currentTagId: null,
	currentAlbumId: null,
	currentCharacterId: null,
	currentPlaceId: null,
	currentWorldItemId: null,
	currentConceptId: null,
	currentPromptId: null,
	currentNoteId: null,
	currentCollection: null,
	currentFolder: null,
	currentTag: null,
	currentAlbum: null,
	currentCharacter: null,
	currentPlace: null,
	currentWorldItem: null,
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
	worldItems: [],
	concepts: [],
	prompts: [],
	notes: [],
	isProcessingThumbnails: false,
	lastUpdate: Date.now(),
	viewMode: 'grid' as const,
	sortBy: 'name',
	sortOrder: 'asc',
	setSortBy: () => {},
	setSortOrder: () => {},
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
	setCurrentWorldItem: async () => {},
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
	worldItems?: Array<{ id: string; name?: string }> | string[];
	concepts?: Array<{ id: string; name?: string }> | string[];
	prompts?: Array<{ id: string; name?: string }> | string[];
	notes?: Array<{ id: string; title?: string }> | string[];
	hash?: string;
	thumbnailError?: string | null;
	thumbnailErrorAt?: string | Date | null;
	thumbnailOptimizedAt?: string | Date | null;
	stats?: {
		id: string;
		imageId: string;
		views: number;
		downloads: number;
		lastViewed: string | Date;
		createdAt: string | Date;
		updatedAt: string | Date;
	} | null;
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
	if (item.hash && typeof item.hash !== 'string') {
		throw new Error('hash debe ser string');
	}

	// Validar fechas
	if (!(item.createdAt instanceof Date) && !Date.parse(item.createdAt)) {
		throw new Error('createdAt debe ser una fecha válida');
	}
	if (!(item.updatedAt instanceof Date) && !Date.parse(item.updatedAt)) {
		throw new Error('updatedAt debe ser una fecha válida');
	}

	// Validar thumbnailErrorAt y thumbnailOptimizedAt si existen
	if (
		item.thumbnailErrorAt &&
		!(item.thumbnailErrorAt instanceof Date) &&
		typeof item.thumbnailErrorAt === 'string' &&
		!Date.parse(item.thumbnailErrorAt)
	) {
		throw new Error('thumbnailErrorAt debe ser una fecha válida');
	}
	if (
		item.thumbnailOptimizedAt &&
		!(item.thumbnailOptimizedAt instanceof Date) &&
		typeof item.thumbnailOptimizedAt === 'string' &&
		!Date.parse(item.thumbnailOptimizedAt)
	) {
		throw new Error('thumbnailOptimizedAt debe ser una fecha válida');
	}

	// Validar arrays
	const validateArray = <T>(arr: T[] | unknown[] | undefined, name: string): void => {
		if (arr && !Array.isArray(arr)) {
			throw new Error(`${name} debe ser un array`);
		}
	};

	validateArray(item.collections, 'collections');
	validateArray(item.tags, 'tags');
	validateArray(item.albums, 'albums');
	validateArray(item.characters, 'characters');
	validateArray(item.places, 'places');
	validateArray(item.worldItems, 'worldItems');
	validateArray(item.concepts, 'concepts');
	validateArray(item.prompts, 'prompts');
	validateArray(item.notes, 'notes');

	// Validar stats si existe
	if (item.stats && typeof item.stats !== 'object') {
		throw new Error('stats debe ser un objeto');
	}
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
			thumbnailError: rawItem.thumbnailError,
			thumbnailErrorAt: rawItem.thumbnailErrorAt,
			thumbnailOptimizedAt: rawItem.thumbnailOptimizedAt,
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
			worldItems: rawItem.worldItems,
			concepts: rawItem.concepts,
			prompts: rawItem.prompts,
			notes: rawItem.notes,
			hash: rawItem.hash,
			stats: rawItem.stats,
		};

		fileManagerLogger.debug('✅ Estructura validada:', item.id);

		// Luego transformamos a FileItem
		const fileItem: FileItem = {
			id: item.id,
			hash: item.hash || '',
			name: item.name,
			path: item.path,
			type: item.type === 'image' || item.type === 'file' || item.type === 'folder' ? item.type : 'file',
			size: item.size,
			width: item.width || 0,
			height: item.height || 0,
			metadata:
				typeof item.metadata === 'string' ? item.metadata : item.metadata ? JSON.stringify(item.metadata) : null,
			thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : null,
			thumbnailSize: item.thumbnailSize || null,
			thumbnailWidth: item.thumbnailWidth || null,
			thumbnailHeight: item.thumbnailHeight || null,
			thumbnailError: item.thumbnailError || null,
			thumbnailErrorAt: item.thumbnailErrorAt || null,
			thumbnailOptimizedAt: item.thumbnailOptimizedAt || null,
			isPublic: item.isPublic || false,
			isFavorite: item.isFavorite || false,
			folderId: item.folderId,
			createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
			updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
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
			worldItems: Array.isArray(item.worldItems)
				? item.worldItems.map((w) => (typeof w === 'string' ? { id: w, name: w } : { id: w.id, name: w.name || w.id }))
				: [],
			concepts: Array.isArray(item.concepts)
				? item.concepts.map((c) => (typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }))
				: [],
			prompts: Array.isArray(item.prompts)
				? item.prompts.map((p) => (typeof p === 'string' ? { id: p, name: p } : { id: p.id, name: p.name || p.id }))
				: [],
			notes: Array.isArray(item.notes)
				? item.notes.map((n) => (typeof n === 'string' ? { id: n, title: n } : { id: n.id, title: n.title || n.id }))
				: [],
			stats: item.stats || null,
		};

		fileManagerLogger.debug('✅ Transformación completada:', fileItem.id);
		return fileItem;
	} catch (error) {
		fileManagerLogger.error('❌ Error transformando item:', error);
		throw new Error(`Error transformando item: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
};

// Función helper para convertir las imágenes a FileItem
const convertToFileItem = (image: Partial<FileItem> | Record<string, unknown>): FileItem => {
	try {
		// Transformación robusta
		return {
			id: (image.id as string) || '',
			hash: (image.hash as string) || '',
			name: (image.name as string) || '',
			path: (image.path as string) || '',
			type:
				(image.type as string) === 'image' || (image.type as string) === 'file' || (image.type as string) === 'folder'
					? (image.type as 'image' | 'file' | 'folder')
					: 'image',
			size: (image.size as number) || 0,
			width: (image.width as number) || 0,
			height: (image.height as number) || 0,
			metadata:
				typeof (image.metadata as string | object) === 'string'
					? (image.metadata as string)
					: image.metadata
						? JSON.stringify(image.metadata)
						: null,
			thumbnail: typeof (image.thumbnail as string | Uint8Array) === 'string' ? (image.thumbnail as string) : null,
			thumbnailSize: (image.thumbnailSize as number) || null,
			thumbnailWidth: (image.thumbnailWidth as number) || null,
			thumbnailHeight: (image.thumbnailHeight as number) || null,
			thumbnailError: (image.thumbnailError as string) || null,
			thumbnailErrorAt: (image.thumbnailErrorAt as Date) || null,
			thumbnailOptimizedAt: (image.thumbnailOptimizedAt as Date) || null,
			isPublic: (image.isPublic as boolean) || false,
			isFavorite: (image.isFavorite as boolean) || false,
			folderId: (image.folderId as string) || '',
			createdAt:
				(image.createdAt as Date) instanceof Date
					? (image.createdAt as Date)
					: new Date(String(image.createdAt) || Date.now()),
			updatedAt:
				(image.updatedAt as Date) instanceof Date
					? (image.updatedAt as Date)
					: new Date(String(image.updatedAt) || Date.now()),
			collections: Array.isArray(image.collections)
				? (image.collections as Array<string | EntityReference>).map((c) =>
						typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }
					)
				: [],
			tags: Array.isArray(image.tags)
				? (image.tags as Array<string | EntityReference>).map((t) =>
						typeof t === 'string'
							? { id: t, name: t, color: '#94a3b8' }
							: { id: t.id, name: t.name || t.id, color: t.color || '#94a3b8' }
					)
				: [],
			albums: Array.isArray(image.albums)
				? (image.albums as Array<string | EntityReference>).map((a) =>
						typeof a === 'string' ? { id: a, name: a } : { id: a.id, name: a.name || a.id }
					)
				: [],
			characters: Array.isArray(image.characters)
				? (image.characters as Array<string | EntityReference>).map((c) =>
						typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }
					)
				: [],
			places: Array.isArray(image.places)
				? (image.places as Array<string | EntityReference>).map((p) =>
						typeof p === 'string' ? { id: p, name: p } : { id: p.id, name: p.name || p.id }
					)
				: [],
			worldItems: Array.isArray(image.worldItems)
				? (image.worldItems as Array<string | EntityReference>).map((w) =>
						typeof w === 'string' ? { id: w, name: w } : { id: w.id, name: w.name || w.id }
					)
				: [],
			concepts: Array.isArray(image.concepts)
				? (image.concepts as Array<string | EntityReference>).map((c) =>
						typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }
					)
				: [],
			prompts: Array.isArray(image.prompts)
				? (image.prompts as Array<string | EntityReference>).map((p) =>
						typeof p === 'string' ? { id: p, name: p } : { id: p.id, name: p.name || p.id }
					)
				: [],
			notes: Array.isArray(image.notes)
				? (image.notes as Array<string | EntityReference>).map((n) =>
						typeof n === 'string' ? { id: n, title: n } : { id: n.id, title: n.title || n.id }
					)
				: [],
			stats: (image.stats as ImageStats) || null,
		};
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
			if (stats) {
				set({
					collections: stats.collections || [],
					folders: stats.folders || [],
					tags: stats.tags || [],
					albums: stats.albums || [],
					characters: stats.characters || [],
					places: stats.places || [],
					worldItems: stats.worldItems || [],
					// Usar arreglos vacíos para concepts, prompts y notes que aún no existen en la interfaz
					concepts: [],
					prompts: [],
					notes: [],
					lastUpdate: Date.now(),
				});
			} else {
				// Inicializar con arreglos vacíos si stats es null
				set({
					collections: [],
					folders: [],
					tags: [],
					albums: [],
					characters: [],
					places: [],
					worldItems: [],
					concepts: [],
					prompts: [],
					notes: [],
					lastUpdate: Date.now(),
				});
			}

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
			if (!id) {
				fileManagerLogger.info('⚠️ ID de carpeta no proporcionado, ignorando');
				return;
			}

			fileManagerLogger.info('📁 Cambiando a carpeta:', id);
			const state = get();
			const folder = state.folders.find((f) => f.id === id);

			if (!folder) {
				fileManagerLogger.info('⚠️ Carpeta no encontrada en el estado:', id);
				// No lanzar error, simplemente actualizar el estado con valores nulos
				set({
					currentFolderId: id,
					currentFolder: null,
					isLoading: false,
					error: 'Carpeta no encontrada',
				});
				return;
			}

			state.clearSelection();

			set({
				currentFolderId: id,
				currentFolder: folder,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: null,
				currentAlbum: null,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: null,
				currentPlace: null,
				currentWorldItemId: null,
				currentWorldItem: null,
				currentConceptId: null,
				currentConcept: null,
				currentPromptId: null,
				currentPrompt: null,
				currentNoteId: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas por convertServerImageToFileItem
			const images = await getFolderImages(id);

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
			if (!id) {
				fileManagerLogger.info('⚠️ ID de colección no proporcionado, ignorando');
				return;
			}

			fileManagerLogger.info('📚 Cambiando a colección:', id);
			const state = get();
			const collection = state.collections.find((c) => c.id === id);

			if (!collection) {
				fileManagerLogger.info('⚠️ Colección no encontrada en el estado:', id);
				// No lanzar error, simplemente actualizar el estado con valores nulos
				set({
					currentCollectionId: id,
					currentCollection: null,
					isLoading: false,
					error: 'Colección no encontrada',
				});
				return;
			}

			state.clearSelection();

			set({
				currentFolderId: null,
				currentFolder: null,
				currentCollectionId: id,
				currentCollection: collection,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: null,
				currentAlbum: null,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: null,
				currentPlace: null,
				currentWorldItemId: null,
				currentWorldItem: null,
				currentConceptId: null,
				currentConcept: null,
				currentPromptId: null,
				currentPrompt: null,
				currentNoteId: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas por convertServerImageToFileItem
			const images = await getCollectionImages(id);

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
			fileManagerLogger.info('🏷️ Cambiando a tag:', id);
			const state = get();
			const tag = state.tags.find((t) => t.id === id) || null;
			state.clearSelection();

			set({
				currentFolderId: null,
				currentFolder: null,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: id,
				currentTag: tag,
				currentAlbum: null,
				currentAlbumId: null,
				currentCharacter: null,
				currentCharacterId: null,
				currentPlace: null,
				currentPlaceId: null,
				currentWorldItem: null,
				currentWorldItemId: null,
				currentConcept: null,
				currentConceptId: null,
				currentPrompt: null,
				currentPromptId: null,
				currentNote: null,
				currentNoteId: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getTagImages(id);

			set({
				currentItems: images,
				displayedItems: images.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Tag cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar tag:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentAlbum: async (id: string) => {
		try {
			if (!id) {
				fileManagerLogger.info('⚠️ ID de álbum no proporcionado, ignorando');
				return;
			}

			fileManagerLogger.info('🖼️ Cambiando a álbum:', id);
			const state = get();
			const album = state.albums.find((a) => a.id === id);

			if (!album) {
				fileManagerLogger.info('⚠️ Álbum no encontrado en el estado:', id);
				// No lanzar error, simplemente actualizar el estado con valores nulos
				set({
					currentAlbumId: id,
					currentAlbum: null,
					isLoading: false,
					error: 'Álbum no encontrado',
				});
				return;
			}

			state.clearSelection();

			set({
				currentFolderId: null,
				currentFolder: null,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: id,
				currentAlbum: album,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: null,
				currentPlace: null,
				currentWorldItemId: null,
				currentWorldItem: null,
				currentConceptId: null,
				currentConcept: null,
				currentPromptId: null,
				currentPrompt: null,
				currentNoteId: null,
				currentNote: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getAlbumImages(id);

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
				currentFolder: null,
				currentCharacterId: id,
				currentCharacter: character,
				currentView: 'character-content',
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getCharacterImages(id);
			// Convertir todas las imágenes al tipo FileItem
			const fileItems = images.map(convertToFileItem);

			set({
				currentItems: fileItems,
				displayedItems: fileItems.slice(0, ITEMS_PER_BATCH),
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
			if (!id) {
				fileManagerLogger.info('⚠️ ID de lugar no proporcionado, ignorando');
				return;
			}

			fileManagerLogger.info('🏙️ Cambiando a lugar:', id);
			const state = get();
			const place = state.places.find((p) => p.id === id);

			if (!place) {
				fileManagerLogger.info('⚠️ Lugar no encontrado en el estado:', id);
				// No lanzar error, simplemente actualizar el estado con valores nulos
				set({
					currentPlaceId: id,
					currentPlace: null,
					isLoading: false,
					error: 'Lugar no encontrado',
				});
				return;
			}

			state.clearSelection();

			set({
				currentFolderId: null,
				currentFolder: null,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: null,
				currentAlbum: null,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: id,
				currentPlace: place,
				currentWorldItemId: null,
				currentWorldItem: null,
				currentConceptId: null,
				currentConcept: null,
				currentPromptId: null,
				currentPrompt: null,
				currentNoteId: null,
				currentNote: null,
				currentView: 'place-content',
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getPlaceImages(id);
			// Convertir todas las imágenes al tipo FileItem
			const fileItems = images.map(convertToFileItem);

			set({
				currentItems: fileItems,
				displayedItems: fileItems.slice(0, ITEMS_PER_BATCH),
				isLoading: false,
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info(`✅ Lugar cargado con ${images.length} imágenes`);
		} catch (error) {
			fileManagerLogger.error('❌ Error al cargar lugar:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido', isLoading: false });
		}
	},

	setCurrentWorldItem: async (id: string) => {
		try {
			if (!id) {
				fileManagerLogger.info('⚠️ ID de objeto no proporcionado, ignorando');
				return;
			}

			fileManagerLogger.info('🧩 Cambiando a objeto:', id);
			const state = get();
			const worldItem = state.worldItems.find((w) => w.id === id);

			if (!worldItem) {
				fileManagerLogger.info('⚠️ Objeto no encontrado en el estado:', id);
				// No lanzar error, simplemente actualizar el estado con valores nulos
				set({
					currentWorldItemId: id,
					currentWorldItem: null,
					isLoading: false,
					error: 'Objeto no encontrado',
				});
				return;
			}

			state.clearSelection();

			set({
				currentFolderId: null,
				currentFolder: null,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: null,
				currentAlbum: null,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: null,
				currentPlace: null,
				currentWorldItemId: id,
				currentWorldItem: worldItem,
				currentConceptId: null,
				currentConcept: null,
				currentPromptId: null,
				currentPrompt: null,
				currentNoteId: null,
				currentNote: null,
				currentView: 'world-item-content',
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getWorldItemImages(id);
			// Convertir todas las imágenes al tipo FileItem
			const fileItems = images.map(convertToFileItem);

			set({
				currentItems: fileItems,
				displayedItems: fileItems.slice(0, ITEMS_PER_BATCH),
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
				currentFolder: null,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: null,
				currentAlbum: null,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: null,
				currentPlace: null,
				currentWorldItem: null,
				currentWorldItemId: null,
				currentConceptId: id,
				currentConcept: concept,
				currentPrompt: null,
				currentPromptId: null,
				currentNote: null,
				currentNoteId: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getConceptImages(id);

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
				currentFolder: null,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: null,
				currentAlbum: null,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: null,
				currentPlace: null,
				currentWorldItem: null,
				currentWorldItemId: null,
				currentConceptId: null,
				currentConcept: null,
				currentPromptId: id,
				currentPrompt: prompt,
				currentNote: null,
				currentNoteId: null,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getPromptImages(id);

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
				currentFolder: null,
				currentCollectionId: null,
				currentCollection: null,
				currentTagId: null,
				currentTag: null,
				currentAlbumId: null,
				currentAlbum: null,
				currentCharacterId: null,
				currentCharacter: null,
				currentPlaceId: null,
				currentPlace: null,
				currentWorldItem: null,
				currentWorldItemId: null,
				currentConceptId: null,
				currentConcept: null,
				currentPromptId: null,
				currentPrompt: null,
				currentNoteId: id,
				currentNote: note,
				isLoading: true,
				lastUpdate: Date.now(),
			});

			// Las imágenes ya vienen transformadas
			const images = await getNoteImages(id);

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
	sortBy: 'name',
	sortOrder: 'asc',
	setSortBy: (field: string) => {
		set({ sortBy: field });
		// Reordenar los items actuales
		const { currentItems, sortOrder } = get();
		const sortedItems = [...currentItems].sort((a, b) => {
			const aValue = a[field as keyof typeof a];
			const bValue = b[field as keyof typeof b];

			return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
		});
		set({ currentItems: sortedItems });
	},
	setSortOrder: (order: 'asc' | 'desc') => {
		set({ sortOrder: order });
		// Reordenar los items actuales
		const { currentItems, sortBy } = get();
		const sortedItems = [...currentItems].sort((a, b) => {
			const aValue = a[sortBy as keyof typeof a];
			const bValue = b[sortBy as keyof typeof b];

			return order === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
		});
		set({ currentItems: sortedItems });
	},
}));

// Tipos exportados para uso en componentes
export type { FileManagerState, BaseEntity, CollectionEntity, TagEntity, EntityWithEmoji };
