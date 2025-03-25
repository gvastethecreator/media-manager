import { useFileManager } from '@/store/files/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import type { ViewType } from '@/types/file-item';
import { useCallback } from 'react';

/**
 * Hook personalizado para manejar la navegación y los cambios de vista
 * centralizando la lógica de limpieza de selecciones
 */
export function useNavigation() {
	const { currentView, setCurrentView } = useNavigationStore();
	const {
		// Estados actuales
		currentCollectionId,
		currentFolderId,
		currentTagId,
		currentAlbumId,
		currentCharacterId,
		currentPlaceId,
		currentWorldItemId,
		// Variables no utilizadas pero mantenidas para referencia
		// currentConceptId,
		// currentPromptId,
		// currentNoteId,

		// Objetos actuales
		currentCollection,
		currentFolder,
		currentTag,
		currentAlbum,
		currentCharacter,
		currentPlace,
		currentWorldItem,
		// Variables no utilizadas pero mantenidas para referencia
		// currentConcept,
		// currentPrompt,
		// currentNote,

		// Métodos set
		setCurrentCollection,
		setCurrentFolder,
		setCurrentTag,
		setCurrentAlbum,
		setCurrentCharacter,
		setCurrentPlace,
		setCurrentWorldItem,
		setCurrentConcept,
		setCurrentPrompt,
		setCurrentNote,
	} = useFileManager();

	/**
	 * Limpia todas las selecciones actuales
	 */
	const clearAllSelections = useCallback(() => {
		// Usar "" para todos para evitar errores de tipo
		setCurrentCollection('');
		setCurrentFolder('');
		setCurrentTag('');
		setCurrentAlbum('');
		setCurrentCharacter('');
		setCurrentPlace('');
		setCurrentWorldItem('');
		setCurrentConcept?.('');
		setCurrentPrompt?.('');
		setCurrentNote?.('');
	}, [
		setCurrentCollection,
		setCurrentFolder,
		setCurrentTag,
		setCurrentAlbum,
		setCurrentCharacter,
		setCurrentPlace,
		setCurrentWorldItem,
		setCurrentConcept,
		setCurrentPrompt,
		setCurrentNote,
	]);

	/**
	 * Navega a una vista específica, limpiando otras selecciones si es necesario
	 */
	const navigateToView = useCallback(
		(viewType: ViewType) => {
			try {
				// Limpiar selecciones que no corresponden a la vista actual
				if (viewType !== 'collection-content') {
					setCurrentCollection('');
				}
				if (viewType !== 'folder-content') {
					setCurrentFolder('');
				}
				if (viewType !== 'tag-content') {
					setCurrentTag('');
				}
				if (viewType !== 'album-content') {
					setCurrentAlbum('');
				}
				if (viewType !== 'character-content') {
					setCurrentCharacter('');
				}
				if (viewType !== 'place-content') {
					setCurrentPlace('');
				}
				if (viewType !== 'world-item-content') {
					setCurrentWorldItem('');
				}
				if (viewType !== 'concept-content' && setCurrentConcept) {
					setCurrentConcept('');
				}
				if (viewType !== 'prompt-content' && setCurrentPrompt) {
					setCurrentPrompt('');
				}
				if (viewType !== 'note-content' && setCurrentNote) {
					setCurrentNote('');
				}

				// Cambiar la vista
				setCurrentView(viewType);
			} catch (error) {
				console.error('Error al navegar a la vista:', error);
			}
		},
		[
			setCurrentView,
			setCurrentCollection,
			setCurrentFolder,
			setCurrentTag,
			setCurrentAlbum,
			setCurrentCharacter,
			setCurrentPlace,
			setCurrentWorldItem,
			setCurrentConcept,
			setCurrentPrompt,
			setCurrentNote,
		]
	);

	/**
	 * Navega a la vista de contenido de una colección específica
	 */
	const navigateToCollection = useCallback(
		(id: string) => {
			clearAllSelections();
			setCurrentCollection(id);
			setCurrentView('collection-content');
		},
		[clearAllSelections, setCurrentCollection, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de una carpeta específica
	 */
	const navigateToFolder = useCallback(
		(id: string) => {
			clearAllSelections();
			setCurrentFolder(id);
			setCurrentView('folder-content');
		},
		[clearAllSelections, setCurrentFolder, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de una etiqueta específica
	 */
	const navigateToTag = useCallback(
		(id: string) => {
			clearAllSelections();
			setCurrentTag(id);
			setCurrentView('tag-content');
		},
		[clearAllSelections, setCurrentTag, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un álbum específico
	 */
	const navigateToAlbum = useCallback(
		(id: string) => {
			clearAllSelections();
			setCurrentAlbum(id);
			setCurrentView('album-content');
		},
		[clearAllSelections, setCurrentAlbum, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un personaje específico
	 */
	const navigateToCharacter = useCallback(
		(id: string) => {
			clearAllSelections();
			setCurrentCharacter(id);
			setCurrentView('character-content');
		},
		[clearAllSelections, setCurrentCharacter, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un lugar específico
	 */
	const navigateToPlace = useCallback(
		(id: string) => {
			clearAllSelections();
			setCurrentPlace(id);
			setCurrentView('place-content');
		},
		[clearAllSelections, setCurrentPlace, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un objeto mundial específico
	 */
	const navigateToWorldItem = useCallback(
		(id: string) => {
			clearAllSelections();
			setCurrentWorldItem(id);
			setCurrentView('world-item-content');
		},
		[clearAllSelections, setCurrentWorldItem, setCurrentView]
	);

	/**
	 * Navega a la vista principal desde una vista de contenido
	 */
	const navigateToMainFromContent = useCallback(() => {
		const mainView = currentView.replace('-content', '') as ViewType;
		clearAllSelections();
		setCurrentView(mainView);
	}, [currentView, clearAllSelections, setCurrentView]);

	/**
	 * Navega a la vista de inicio (galería)
	 */
	const navigateToHome = useCallback(() => {
		clearAllSelections();
		setCurrentView('all-images');
	}, [clearAllSelections, setCurrentView]);

	/**
	 * Obtiene el elemento actual seleccionado basado en la vista actual
	 * con información detallada adicional básica
	 */
	const getCurrentItem = useCallback(() => {
		// Detectamos el tipo de vista actual y obtenemos la información básica
		switch (currentView) {
			case 'collection-content':
				return currentCollection
					? {
							id: currentCollectionId,
							name: currentCollection.name,
							// Propiedades que espera BreadcrumbsProps
							itemType: 'collection',
							// Añadir propiedades opcionales que puedan ser útiles
							color: currentCollection.color,
							emoji: currentCollection.emoji,
						}
					: undefined;
			case 'folder-content':
				return currentFolder
					? {
							id: currentFolderId,
							name: currentFolder.name,
							path: currentFolder.path,
							description: currentFolder.description,
							emoji: currentFolder.emoji,
							_count: currentFolder._count,
							totalSize: currentFolder.totalSize,
							lastIndexed: currentFolder.lastIndexed,
							createdAt: currentFolder.createdAt,
							updatedAt: currentFolder.updatedAt,
							// Propiedades que espera BreadcrumbsProps
							itemType: 'folder',
						}
					: undefined;
			case 'tag-content':
				return currentTag
					? {
							id: currentTagId,
							name: currentTag.name,
							// Propiedades básicas comunes
							itemType: 'tag',
						}
					: undefined;
			case 'album-content':
				return currentAlbum
					? {
							id: currentAlbumId,
							name: currentAlbum.name,
							// Propiedades básicas comunes
							itemType: 'album',
						}
					: undefined;
			case 'character-content':
				return currentCharacter
					? {
							id: currentCharacterId,
							name: currentCharacter.name,
							// Propiedades básicas comunes
							itemType: 'character',
						}
					: undefined;
			case 'place-content':
				return currentPlace
					? {
							id: currentPlaceId,
							name: currentPlace.name,
							// Propiedades básicas comunes
							itemType: 'place',
						}
					: undefined;
			case 'world-item-content':
				return currentWorldItem
					? {
							id: currentWorldItemId,
							name: currentWorldItem.name,
							// Propiedades básicas comunes
							itemType: 'world-item',
						}
					: undefined;
			default:
				return undefined;
		}
	}, [
		currentView,
		currentCollectionId,
		currentCollection,
		currentFolderId,
		currentFolder,
		currentTagId,
		currentTag,
		currentAlbumId,
		currentAlbum,
		currentCharacterId,
		currentCharacter,
		currentPlaceId,
		currentPlace,
		currentWorldItemId,
		currentWorldItem,
	]);

	return {
		currentView,
		navigateToView,
		navigateToCollection,
		navigateToFolder,
		navigateToTag,
		navigateToAlbum,
		navigateToCharacter,
		navigateToPlace,
		navigateToWorldItem,
		navigateToMainFromContent,
		navigateToHome,
		clearAllSelections,
		getCurrentItem,
	};
}
