/**
 * 🧭 NAVIGATION HOOKS
 *
 * Hooks especializados para navegación entre diferentes contextos
 * del sistema de archivos (carpetas, colecciones, etiquetas, etc.)
 *
 * Incluye:
 * - History management
 * - Breadcrumb logic
 * - State transitions optimizadas
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { useUnifiedFileManager } from '@/store/unified-file-manager.store';

const navigationLogger = clientLogger.withContext('NavigationHooks');

// 🧭 Hook principal de navegación
export const useNavigation = () => {
	const store = useUnifiedFileManager();

	return {
		// 📍 Estado actual
		currentContext: store.currentContext,
		isLoading: store.isLoading,

		// 🎯 Navegación principal
		setCurrentFolder: store.setCurrentFolder,
		setCurrentCollection: store.setCurrentCollection,
		setCurrentTag: store.setCurrentTag,
		setCurrentAlbum: store.setCurrentAlbum,
		setCurrentCharacter: store.setCurrentCharacter,
		setCurrentPlace: store.setCurrentPlace,
		setCurrentWorldItem: store.setCurrentWorldItem,
		loadAllImages: store.loadAllImages,

		// 🔄 Utilidades
		refreshCurrentContext: store.refreshCurrentContext,

		// 📊 Información de contexto
		getCurrentContextInfo: () => {
			switch (store.currentContext) {
				case 'folder':
					return {
						type: 'folder',
						id: store.currentFolderId,
						name: store.currentFolder?.name,
						count: store.currentFolder?.count,
					};
				case 'collection':
					return {
						type: 'collection',
						id: store.currentCollectionId,
						name: store.currentCollection?.name,
						count: store.currentCollection?.count,
						emoji: store.currentCollection?.emoji,
						color: store.currentCollection?.color,
					};
				case 'tag':
					return {
						type: 'tag',
						id: store.currentTagId,
						name: store.currentTag?.name,
						count: store.currentTag?.count,
						color: store.currentTag?.color,
					};
				case 'album':
					return {
						type: 'album',
						id: store.currentAlbumId,
						name: store.currentAlbum?.name,
						count: store.currentAlbum?.count,
						emoji: store.currentAlbum?.emoji,
					};
				case 'character':
					return {
						type: 'character',
						id: store.currentCharacterId,
						name: store.currentCharacter?.name,
						count: store.currentCharacter?.count,
						emoji: store.currentCharacter?.emoji,
					};
				case 'place':
					return {
						type: 'place',
						id: store.currentPlaceId,
						name: store.currentPlace?.name,
						count: store.currentPlace?.count,
						emoji: store.currentPlace?.emoji,
					};
				case 'world-item':
					return {
						type: 'world-item',
						id: store.currentWorldItemId,
						name: store.currentWorldItem?.name,
						count: store.currentWorldItem?.count,
						emoji: store.currentWorldItem?.emoji,
					};
				case 'all':
					return {
						type: 'all',
						id: null,
						name: 'Todas las imágenes',
						count: store.currentItems.length,
					};
				default:
					return null;
			}
		},

		// 🍞 Breadcrumb helpers
		getBreadcrumbs: () => {
			const contextInfo = store.currentContext;
			if (!contextInfo) {
				return [];
			}

			const breadcrumbs = [{ name: 'Inicio', path: '/', isActive: false }];

			switch (store.currentContext) {
				case 'folder':
					breadcrumbs.push(
						{ name: 'Carpetas', path: '/folders', isActive: false },
						{ name: store.currentFolder?.name || 'Carpeta', path: `/folders/${store.currentFolderId}`, isActive: true }
					);
					break;
				case 'collection':
					breadcrumbs.push(
						{ name: 'Colecciones', path: '/collections', isActive: false },
						{
							name: store.currentCollection?.name || 'Colección',
							path: `/collections/${store.currentCollectionId}`,
							isActive: true,
						}
					);
					break;
				case 'tag':
					breadcrumbs.push(
						{ name: 'Etiquetas', path: '/tags', isActive: false },
						{ name: store.currentTag?.name || 'Etiqueta', path: `/tags/${store.currentTagId}`, isActive: true }
					);
					break;
				case 'album':
					breadcrumbs.push(
						{ name: 'Álbumes', path: '/albums', isActive: false },
						{ name: store.currentAlbum?.name || 'Álbum', path: `/albums/${store.currentAlbumId}`, isActive: true }
					);
					break;
				case 'character':
					breadcrumbs.push(
						{ name: 'Personajes', path: '/characters', isActive: false },
						{
							name: store.currentCharacter?.name || 'Personaje',
							path: `/characters/${store.currentCharacterId}`,
							isActive: true,
						}
					);
					break;
				case 'place':
					breadcrumbs.push(
						{ name: 'Lugares', path: '/places', isActive: false },
						{ name: store.currentPlace?.name || 'Lugar', path: `/places/${store.currentPlaceId}`, isActive: true }
					);
					break;
				case 'world-item':
					breadcrumbs.push(
						{ name: 'Elementos del Mundo', path: '/world-items', isActive: false },
						{
							name: store.currentWorldItem?.name || 'Elemento',
							path: `/world-items/${store.currentWorldItemId}`,
							isActive: true,
						}
					);
					break;
				case 'all':
					breadcrumbs.push({ name: 'Todas las imágenes', path: '/images/all', isActive: true });
					break;
				default:
					break;
			}

			return breadcrumbs;
		},
	};
};

// 📂 Hook especializado para carpetas (navegación)
export const useNavigationFolder = () => {
	const store = useUnifiedFileManager();

	return {
		// 📍 Estado actual de carpeta
		currentFolder: store.currentFolder,
		folderImages: store.currentContext === 'folder' ? store.currentItems : [],
		displayedImages: store.currentContext === 'folder' ? store.displayedItems : [],
		isLoading: store.isLoading && store.currentContext === 'folder',

		// 🎯 Acciones de carpeta
		setCurrentFolder: store.setCurrentFolder,

		// 📊 Información de carpetas
		folders: store.folders,

		// 🔍 Utilidades
		findFolder: (id: string) => store.folders.find((f) => f.id === id),
		getFolderStats: () => ({
			totalFolders: store.folders.length,
			currentFolderItemCount: store.currentContext === 'folder' ? store.currentItems.length : 0,
			displayedItemCount: store.currentContext === 'folder' ? store.displayedItems.length : 0,
		}),
	};
};

// 📚 Hook especializado para colecciones
export const useCollection = () => {
	const store = useUnifiedFileManager();

	return {
		// 📍 Estado actual de colección
		currentCollection: store.currentCollection,
		collectionImages: store.currentContext === 'collection' ? store.currentItems : [],
		displayedImages: store.currentContext === 'collection' ? store.displayedItems : [],
		isLoading: store.isLoading && store.currentContext === 'collection',

		// 🎯 Acciones de colección
		setCurrentCollection: store.setCurrentCollection,

		// 📊 Información de colecciones
		collections: store.collections,

		// 🔍 Utilidades
		findCollection: (id: string) => store.collections.find((c) => c.id === id),
		getCollectionStats: () => ({
			totalCollections: store.collections.length,
			currentCollectionItemCount: store.currentContext === 'collection' ? store.currentItems.length : 0,
			displayedItemCount: store.currentContext === 'collection' ? store.displayedItems.length : 0,
		}),
	};
};

// 🏷️ Hook especializado para etiquetas
export const useTag = () => {
	const store = useUnifiedFileManager();

	return {
		// 📍 Estado actual de etiqueta
		currentTag: store.currentTag,
		tagImages: store.currentContext === 'tag' ? store.currentItems : [],
		displayedImages: store.currentContext === 'tag' ? store.displayedItems : [],
		isLoading: store.isLoading && store.currentContext === 'tag',

		// 🎯 Acciones de etiqueta
		setCurrentTag: store.setCurrentTag,

		// 📊 Información de etiquetas
		tags: store.tags,

		// 🔍 Utilidades
		findTag: (id: string) => store.tags.find((t) => t.id === id),
		getTagStats: () => ({
			totalTags: store.tags.length,
			currentTagItemCount: store.currentContext === 'tag' ? store.currentItems.length : 0,
			displayedItemCount: store.currentContext === 'tag' ? store.displayedItems.length : 0,
		}),
	};
};

navigationLogger.info('🧭 Navigation hooks configurados correctamente');
