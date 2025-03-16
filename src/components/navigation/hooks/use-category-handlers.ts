import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useFileManager } from '@/store/file-manager.store';
import type { ViewType } from '@/types/file-item';
import { useCallback } from 'react';

/**
 * Hook que proporciona manejadores para las interacciones con categorías
 * Centraliza la lógica de selección y navegación entre categorías
 */
export function useCategoryHandlers() {
	const { currentView, setCurrentView } = useNavigationStore();
	const {
		setCurrentCollection,
		setCurrentFolder,
		setCurrentTag,
		setCurrentAlbum,
		setCurrentCharacter,
		setCurrentPlace,
		setCurrentWorldItem,
		currentCollectionId,
		currentFolderId,
		currentTagId,
		currentAlbumId,
		currentCharacterId,
		currentPlaceId,
		currentWorldItemId,
		currentConceptId,
		currentPromptId,
		currentNoteId,
	} = useFileManager();

	// Función para manejar el clic en una categoría
	const handleCategoryClick = useCallback(
		(id: ViewType) => {
			// Limpiar selecciones anteriores para evitar estados huérfanos
			if (id !== 'collection-content') {
				setCurrentCollection('');
			}
			if (id !== 'folder-content') {
				setCurrentFolder('');
			}
			if (id !== 'tag-content') {
				setCurrentTag('');
			}
			if (id !== 'album-content') {
				setCurrentAlbum('');
			}
			if (id !== 'character-content') {
				setCurrentCharacter('');
			}
			if (id !== 'place-content') {
				setCurrentPlace('');
			}
			if (id !== 'world-item-content') {
				setCurrentWorldItem('');
			}

			// Actualizar la vista actual
			setCurrentView(id);
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
		]
	);

	// Función para manejar el clic en una colección
	const handleCollectionClick = useCallback(
		(collectionId: string) => {
			// Limpiar otras selecciones
			setCurrentFolder('');
			setCurrentTag('');
			setCurrentAlbum('');
			setCurrentCharacter('');
			setCurrentPlace('');
			setCurrentWorldItem('');

			// Establecer vista y colección actual
			setCurrentView('collection-content');
			setCurrentCollection(collectionId);
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
		]
	);

	// Función para manejar el clic en una carpeta
	const handleFolderClick = useCallback(
		(folderId: string) => {
			// Limpiar otras selecciones
			setCurrentCollection('');
			setCurrentTag('');
			setCurrentAlbum('');
			setCurrentCharacter('');
			setCurrentPlace('');
			setCurrentWorldItem('');

			// Establecer vista y carpeta actual
			setCurrentView('folder-content');
			setCurrentFolder(folderId);
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
		]
	);

	const handleTagClick = useCallback(
		(tagName: string) => {
			setCurrentView('tag-content');
			setCurrentTag(tagName);
		},
		[setCurrentView, setCurrentTag]
	);

	const handleAlbumClick = useCallback(
		(albumId: string) => {
			setCurrentView('album-content');
			setCurrentAlbum(albumId);
		},
		[setCurrentView, setCurrentAlbum]
	);

	const handleCharacterClick = useCallback(
		(characterId: string) => {
			setCurrentView('character-content');
			setCurrentCharacter(characterId);
		},
		[setCurrentView, setCurrentCharacter]
	);

	const handlePlaceClick = useCallback(
		(placeId: string) => {
			setCurrentView('place-content');
			setCurrentPlace(placeId);
		},
		[setCurrentView, setCurrentPlace]
	);

	const handleWorldItemClick = useCallback(
		(worldItemId: string) => {
			setCurrentView('world-item-content');
			setCurrentWorldItem(worldItemId);
		},
		[setCurrentView, setCurrentWorldItem]
	);

	// Función para obtener el manejador de clic adecuado para cada tipo de categoría
	const getItemClickHandler = useCallback(
		(categoryId: ViewType) => {
			switch (categoryId) {
				case 'collections':
					return handleCollectionClick;
				case 'folders':
					return handleFolderClick;
				case 'tags':
					return handleTagClick;
				case 'albums':
					return handleAlbumClick;
				case 'characters':
					return handleCharacterClick;
				case 'places':
					return handlePlaceClick;
				case 'world-items':
					return handleWorldItemClick;
				default:
					return () => {};
			}
		},
		[
			handleAlbumClick,
			handleCharacterClick,
			handleCollectionClick,
			handleFolderClick,
			handlePlaceClick,
			handleTagClick,
			handleWorldItemClick,
		]
	);

	// Determinar si un hijo de una categoría está seleccionado
	const hasCategoryChildSelected = useCallback(
		(categoryId: ViewType): boolean => {
			switch (categoryId) {
				case 'collections':
					return currentView === 'collection-content';
				case 'folders':
					return currentView === 'folder-content';
				case 'tags':
					return currentView === 'tag-content';
				case 'albums':
					return currentView === 'album-content';
				case 'characters':
					return currentView === 'character-content';
				case 'places':
					return currentView === 'place-content';
				case 'world-items':
					return currentView === 'world-item-content';
				case 'concepts':
					return currentView === 'concept-content';
				case 'prompts':
					return currentView === 'prompt-content';
				case 'notes':
					return currentView === 'note-content';
				default:
					return false;
			}
		},
		[currentView]
	);

	// Función para verificar qué elemento hijo está seleccionado
	const getSelectedChildId = useCallback(
		(categoryId: ViewType): string | null => {
			switch (categoryId) {
				case 'collections':
					return currentCollectionId;
				case 'folders':
					return currentFolderId;
				case 'tags':
					return currentTagId;
				case 'albums':
					return currentAlbumId;
				case 'characters':
					return currentCharacterId;
				case 'places':
					return currentPlaceId;
				case 'world-items':
					return currentWorldItemId;
				case 'concepts':
					return currentConceptId;
				case 'prompts':
					return currentPromptId;
				case 'notes':
					return currentNoteId;
				default:
					return null;
			}
		},
		[
			currentAlbumId,
			currentCharacterId,
			currentCollectionId,
			currentFolderId,
			currentPlaceId,
			currentTagId,
			currentWorldItemId,
			currentConceptId,
			currentPromptId,
			currentNoteId,
		]
	);

	return {
		currentView,
		handleCategoryClick,
		handleCollectionClick,
		handleFolderClick,
		handleTagClick,
		handleAlbumClick,
		handleCharacterClick,
		handlePlaceClick,
		handleWorldItemClick,
		getItemClickHandler,
		hasCategoryChildSelected,
		getSelectedChildId,
	};
}
