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
		setCurrentConcept,
		setCurrentPrompt,
		setCurrentNote,
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

	// Función para limpiar todas las selecciones actuales
	const clearAllSelections = useCallback(() => {
		// 🧹 Limpiar todas las selecciones para evitar estados huérfanos
		setCurrentCollection('');
		setCurrentFolder('');
		setCurrentTag('');
		setCurrentAlbum('');
		setCurrentCharacter('');
		setCurrentPlace('');
		setCurrentWorldItem('');
		setCurrentConcept('');
		setCurrentPrompt('');
		setCurrentNote('');
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

	// Función para manejar el clic en una categoría
	const handleCategoryClick = useCallback(
		(id: ViewType) => {
			// Limpiar selecciones anteriores para evitar estados huérfanos
			clearAllSelections();

			// Actualizar la vista actual
			setCurrentView(id);
		},
		[clearAllSelections, setCurrentView]
	);

	// Función para manejar el clic en una colección
	const handleCollectionClick = useCallback(
		(collectionId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			// Establecer vista y colección actual
			setCurrentView('collection-content');
			setCurrentCollection(collectionId);
		},
		[clearAllSelections, setCurrentView, setCurrentCollection]
	);

	// Función para manejar el clic en una carpeta
	const handleFolderClick = useCallback(
		(folderId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			// Establecer vista y carpeta actual
			setCurrentView('folder-content');
			setCurrentFolder(folderId);
		},
		[clearAllSelections, setCurrentView, setCurrentFolder]
	);

	const handleTagClick = useCallback(
		(tagName: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('tag-content');
			setCurrentTag(tagName);
		},
		[clearAllSelections, setCurrentView, setCurrentTag]
	);

	const handleAlbumClick = useCallback(
		(albumId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('album-content');
			setCurrentAlbum(albumId);
		},
		[clearAllSelections, setCurrentView, setCurrentAlbum]
	);

	const handleCharacterClick = useCallback(
		(characterId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('character-content');
			setCurrentCharacter(characterId);
		},
		[clearAllSelections, setCurrentView, setCurrentCharacter]
	);

	const handlePlaceClick = useCallback(
		(placeId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('place-content');
			setCurrentPlace(placeId);
		},
		[clearAllSelections, setCurrentView, setCurrentPlace]
	);

	const handleWorldItemClick = useCallback(
		(worldItemId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('world-item-content');
			setCurrentWorldItem(worldItemId);
		},
		[clearAllSelections, setCurrentView, setCurrentWorldItem]
	);

	// Añadir manejadores para conceptos, prompts y notas
	const handleConceptClick = useCallback(
		(conceptId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('concept-content');
			setCurrentConcept(conceptId);
		},
		[clearAllSelections, setCurrentView, setCurrentConcept]
	);

	const handlePromptClick = useCallback(
		(promptId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('prompt-content');
			setCurrentPrompt(promptId);
		},
		[clearAllSelections, setCurrentView, setCurrentPrompt]
	);

	const handleNoteClick = useCallback(
		(noteId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('note-content');
			setCurrentNote(noteId);
		},
		[clearAllSelections, setCurrentView, setCurrentNote]
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
				case 'concepts':
					return handleConceptClick;
				case 'prompts':
					return handlePromptClick;
				case 'notes':
					return handleNoteClick;
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
			handleConceptClick,
			handlePromptClick,
			handleNoteClick,
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
		handleConceptClick,
		handlePromptClick,
		handleNoteClick,
		getItemClickHandler,
		hasCategoryChildSelected,
		getSelectedChildId,
		clearAllSelections,
	};
}
