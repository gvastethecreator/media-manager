import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useFolderStore } from '@/store/entities/folder';
import { useGroupStore } from '@/store/entities/group';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt/store';
import { usePropertyStore } from '@/store/entities/property';
import { useTagStore } from '@/store/entities/tag';
import { useWildcardStore } from '@/store/entities/wildcard';
import { useWorldItemStore } from '@/store/entities/world-item';
import type { ViewType } from '@/types/file-item';
import { useCallback } from 'react';

/**
 * Hook que proporciona manejadores para las interacciones con categorías
 * Centraliza la lógica de selección y navegación entre categorías
 */
export function useCategoryHandlers() {
	const { currentView, setCurrentView } = useNavigationStore();

	// Stores específicos para cada entidad
	const { selectCollection, selectedCollectionId } = useCollectionStore();
	const {
		coreActions: { setCurrentFolder: selectFolder, fetchFolderById },
		coreState: { currentFolderId: selectedFolderId },
	} = useFolderStore();
	const { selectTag, selectedTagId } = useTagStore();
	const { selectAlbum, selectedAlbumId } = useAlbumStore();
	const { selectCharacter, selectedCharacterId } = useCharacterStore();
	const { selectPlace, selectedPlaceId } = usePlaceStore();
	const { selectWorldItem, selectedWorldItemId } = useWorldItemStore();
	const { selectConcept, selectedConceptId } = useConceptStore();
	const { selectPrompt, selectedPromptId } = usePromptStore();
	const { selectNote, selectedNoteId } = useNoteStore();
	const { selectGroup, selectedGroupId } = useGroupStore();
	const { selectProperty, selectedPropertyId } = usePropertyStore();
	const { selectWildcard, selectedWildcardId } = useWildcardStore();

	// Función para limpiar todas las selecciones actuales
	const clearAllSelections = useCallback(() => {
		// 🧹 Limpiar todas las selecciones para evitar estados huérfanos
		selectCollection(null);
		selectFolder(null);
		selectTag(null);
		selectAlbum(null);
		selectCharacter(null);
		selectPlace(null);
		selectWorldItem(null);
		selectConcept(null);
		selectPrompt(null);
		selectNote(null);
		selectGroup?.(null);
		selectProperty?.(null);
		selectWildcard?.(null);
	}, [
		selectCollection,
		selectFolder,
		selectTag,
		selectAlbum,
		selectCharacter,
		selectPlace,
		selectWorldItem,
		selectConcept,
		selectPrompt,
		selectNote,
		selectGroup,
		selectProperty,
		selectWildcard,
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
			selectCollection(collectionId);
		},
		[clearAllSelections, setCurrentView, selectCollection]
	);

	// Función para manejar el clic en una carpeta
	const handleFolderClick = useCallback(
		async (folderId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			// Establecer vista y carpeta actual
			setCurrentView('folder-content');
			const folder = await fetchFolderById(folderId);
			if (folder) {
				selectFolder(folder);
			}
		},
		[clearAllSelections, setCurrentView, selectFolder, fetchFolderById]
	);

	const handleTagClick = useCallback(
		(tagName: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('tag-content');
			selectTag(tagName);
		},
		[clearAllSelections, setCurrentView, selectTag]
	);

	const handleAlbumClick = useCallback(
		(albumId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('album-content');
			selectAlbum(albumId);
		},
		[clearAllSelections, setCurrentView, selectAlbum]
	);

	const handleCharacterClick = useCallback(
		(characterId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('character-content');
			selectCharacter(characterId);
		},
		[clearAllSelections, setCurrentView, selectCharacter]
	);

	const handlePlaceClick = useCallback(
		(placeId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('place-content');
			selectPlace(placeId);
		},
		[clearAllSelections, setCurrentView, selectPlace]
	);

	const handleWorldItemClick = useCallback(
		(worldItemId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('world-item-content');
			selectWorldItem(worldItemId);
		},
		[clearAllSelections, setCurrentView, selectWorldItem]
	);

	// Añadir manejadores para conceptos, prompts y notas
	const handleConceptClick = useCallback(
		(conceptId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('concept-content');
			selectConcept(conceptId);
		},
		[clearAllSelections, setCurrentView, selectConcept]
	);

	const handlePromptClick = useCallback(
		(promptId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('prompt-content');
			selectPrompt(promptId);
		},
		[clearAllSelections, setCurrentView, selectPrompt]
	);

	const handleNoteClick = useCallback(
		(noteId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('note-content');
			selectNote(noteId);
		},
		[clearAllSelections, setCurrentView, selectNote]
	);

	// Handlers para las nuevas entidades
	const handleGroupClick = useCallback(
		(groupId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('group-content');
			selectGroup?.(groupId);
		},
		[clearAllSelections, setCurrentView, selectGroup]
	);

	const handlePropertyClick = useCallback(
		(propertyId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('property-content');
			selectProperty?.(propertyId);
		},
		[clearAllSelections, setCurrentView, selectProperty]
	);

	const handleWildcardClick = useCallback(
		(wildcardId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('wildcard-content');
			selectWildcard?.(wildcardId);
		},
		[clearAllSelections, setCurrentView, selectWildcard]
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
				case 'groups':
					return handleGroupClick;
				case 'properties':
					return handlePropertyClick;
				case 'wildcards':
					return handleWildcardClick;
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
			handleGroupClick,
			handlePropertyClick,
			handleWildcardClick,
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
				case 'groups':
					return currentView === 'group-content';
				case 'properties':
					return currentView === 'property-content';
				case 'wildcards':
					return currentView === 'wildcard-content';
				default:
					return false;
			}
		},
		[currentView]
	);

	// Función para obtener el ID seleccionado de un hijo de categoría
	const getSelectedChildId = useCallback(
		(categoryId: ViewType): string | null => {
			switch (categoryId) {
				case 'collections':
					return selectedCollectionId || null;
				case 'folders':
					return selectedFolderId || null;
				case 'tags':
					return selectedTagId || null;
				case 'albums':
					return selectedAlbumId || null;
				case 'characters':
					return selectedCharacterId || null;
				case 'places':
					return selectedPlaceId || null;
				case 'world-items':
					return selectedWorldItemId || null;
				case 'concepts':
					return selectedConceptId || null;
				case 'prompts':
					return selectedPromptId || null;
				case 'notes':
					return selectedNoteId || null;
				case 'groups':
					return selectedGroupId || null;
				case 'properties':
					return selectedPropertyId || null;
				case 'wildcards':
					return selectedWildcardId || null;
				default:
					return null;
			}
		},
		[
			selectedAlbumId,
			selectedCharacterId,
			selectedCollectionId,
			selectedConceptId,
			selectedFolderId,
			selectedNoteId,
			selectedPlaceId,
			selectedPromptId,
			selectedTagId,
			selectedWorldItemId,
			selectedGroupId,
			selectedPropertyId,
			selectedWildcardId,
		]
	);

	return {
		currentView,
		handleCategoryClick,
		getItemClickHandler,
		hasCategoryChildSelected,
		getSelectedChildId,
	};
}
