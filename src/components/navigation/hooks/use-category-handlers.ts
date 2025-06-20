import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useGroupStore } from '@/store/entities/group';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { usePropertyStore } from '@/store/entities/property';
import { useTagStore } from '@/store/entities/tag';
import { useWildcardStore } from '@/store/entities/wildcard';
import { useWorldItemStore } from '@/store/entities/world-item';
import { ViewType } from '@/types/files';
import { useCallback } from 'react';

/**
 * Hook que proporciona manejadores para las interacciones con categorías
 * Centraliza la lógica de selección y navegación entre categorías
 */
export function useCategoryHandlers() {
	const { currentView, setCurrentView } = useNavigationStore();

	// Stores específicos para cada entidad - usando las propiedades correctas
	const collectionStore = useCollectionStore();
	const tagStore = useTagStore();
	const albumStore = useAlbumStore();
	const characterStore = useCharacterStore();
	const placeStore = usePlaceStore();
	const worldItemStore = useWorldItemStore();
	const conceptStore = useConceptStore();
	const promptStore = usePromptStore();
	const noteStore = useNoteStore();
	const _groupStore = useGroupStore();
	const _propertyStore = usePropertyStore();
	const _wildcardStore = useWildcardStore();

	// Funciones de selección extraídas de los stores (usando las funciones reales)
	const selectCollection = collectionStore.selectCollection || (() => console.log('selectCollection not available'));
	const selectTag = tagStore.selectTag || (() => console.log('selectTag not available'));
	const selectAlbum = albumStore.selectAlbum || (() => console.log('selectAlbum not available'));
	const selectCharacter = characterStore.selectCharacter || (() => console.log('selectCharacter not available'));
	const selectPlace = placeStore.selectPlace || (() => console.log('selectPlace not available'));
	const selectWorldItem = worldItemStore.selectWorldItem || (() => console.log('selectWorldItem not available'));
	const selectConcept = conceptStore.selectConcept || (() => console.log('selectConcept not available'));
	const selectPrompt = promptStore.selectPrompt || (() => console.log('selectPrompt not available'));
	const selectNote = noteStore.selectNote || (() => console.log('selectNote not available'));

	// Funciones locales para entidades sin selectores implementados
	const selectFolder = useCallback((folderId: string | null) => {
		// TODO: Implementar store de folder
		console.log('Folder selected:', folderId);
	}, []);

	const selectGroup = useCallback((groupId: string | null) => {
		// TODO: Implementar selector en GroupStore
		console.log('Group selected:', groupId);
	}, []);

	const selectProperty = useCallback((propertyId: string | null) => {
		// TODO: Implementar selector en PropertyStore
		console.log('Property selected:', propertyId);
	}, []);

	const selectWildcard = useCallback((wildcardId: string | null) => {
		// TODO: Implementar selector en WildcardStore
		console.log('Wildcard selected:', wildcardId);
	}, []);

	// IDs seleccionados - extraídos de los stores usando las propiedades reales
	const selectedCollectionId = collectionStore.selectedCollectionId || null;
	const selectedFolderId = null; // TODO: Implementar store de folder
	const selectedTagId = tagStore.selectedId || null;
	const selectedAlbumId = albumStore.ui?.selectedIds?.[0] || null;
	const selectedCharacterId = characterStore.ui?.selectedIds?.[0] || null;
	const selectedPlaceId = placeStore.selectedPlaceId || null;
	const selectedWorldItemId = worldItemStore.selectedWorldItemId || null;
	const selectedConceptId = conceptStore.selectedConceptId || null;
	const selectedPromptId = promptStore.selectedPrompt?.id || null;
	const selectedNoteId = noteStore.selectedNoteId || null;
	const selectedGroupId = null; // TODO: Obtener del store cuando esté implementado
	const selectedPropertyId = null; // TODO: Obtener del store cuando esté implementado
	const selectedWildcardId = null; // TODO: Obtener del store cuando esté implementado

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
		selectGroup(null);
		selectProperty(null);
		selectWildcard(null);
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
		(folderId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			// Establecer vista y carpeta actual
			setCurrentView('folder-content');
			selectFolder(folderId);
		},
		[clearAllSelections, setCurrentView, selectFolder]
	);

	const handleTagClick = useCallback(
		(tagId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('tag-content');
			selectTag(tagId);
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

	const handleGroupClick = useCallback(
		(groupId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('group-content');
			selectGroup(groupId);
		},
		[clearAllSelections, setCurrentView, selectGroup]
	);

	const handlePropertyClick = useCallback(
		(propertyId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('property-content');
			selectProperty(propertyId);
		},
		[clearAllSelections, setCurrentView, selectProperty]
	);

	const handleWildcardClick = useCallback(
		(wildcardId: string) => {
			// Limpiar otras selecciones
			clearAllSelections();

			setCurrentView('wildcard-content');
			selectWildcard(wildcardId);
		},
		[clearAllSelections, setCurrentView, selectWildcard]
	);

	// Función para obtener el ID actualmente seleccionado según la vista
	const getCurrentSelectedId = useCallback(() => {
		switch (currentView) {
			case 'collection-content':
				return selectedCollectionId;
			case 'folder-content':
				return selectedFolderId;
			case 'tag-content':
				return selectedTagId;
			case 'album-content':
				return selectedAlbumId;
			case 'character-content':
				return selectedCharacterId;
			case 'place-content':
				return selectedPlaceId;
			case 'world-item-content':
				return selectedWorldItemId;
			case 'concept-content':
				return selectedConceptId;
			case 'prompt-content':
				return selectedPromptId;
			case 'note-content':
				return selectedNoteId;
			case 'group-content':
				return selectedGroupId;
			case 'property-content':
				return selectedPropertyId;
			case 'wildcard-content':
				return selectedWildcardId;
			default:
				return null;
		}
	}, [
		currentView,
		selectedCollectionId,
		selectedTagId,
		selectedAlbumId,
		selectedCharacterId,
		selectedPlaceId,
		selectedWorldItemId,
		selectedConceptId,
		selectedPromptId,
		selectedNoteId,
	]);

	return {
		// Estado actual
		currentView,
		currentSelectedId: getCurrentSelectedId(),

		// IDs seleccionados
		selectedCollectionId,
		selectedFolderId,
		selectedTagId,
		selectedAlbumId,
		selectedCharacterId,
		selectedPlaceId,
		selectedWorldItemId,
		selectedConceptId,
		selectedPromptId,
		selectedNoteId,
		selectedGroupId,
		selectedPropertyId,
		selectedWildcardId,

		// Manejadores de categorías
		handleCategoryClick,
		clearAllSelections,

		// Manejadores específicos por entidad
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
		handleGroupClick,
		handlePropertyClick,
		handleWildcardClick,

		// Utilidades
		getCurrentSelectedId,
	};
}
