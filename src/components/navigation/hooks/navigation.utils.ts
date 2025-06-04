import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useFolderStore } from '@/store/entities/folder';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt/store';
import { useTagStore } from '@/store/entities/tag';
import { useWorldItemStore } from '@/store/entities/world-item';
import { useNavigationStore } from '@/store/navigation.store';
import type { ViewType } from '@/types/file-item';
import { useCallback } from 'react';

const navLogger = clientLogger.withContext('NavigationUtils');

/**
 * Hook personalizado para manejar la navegación y los cambios de vista
 * centralizando la lógica de limpieza de selecciones
 */
export function useNavigation() {
	const { currentView, setCurrentView } = useNavigationStore();

	// Stores específicos para cada entidad
	const { selectCollection, selectedCollectionId, getSelectedCollection } = useCollectionStore();
	const { selectFolder, selectedFolderId } = useFolderStore();
	const { selectTag, selectedTagId } = useTagStore();
	const { selectAlbum, selectedAlbumId } = useAlbumStore();
	const { selectCharacter, selectedCharacterId } = useCharacterStore();
	const { selectPlace, selectedPlaceId } = usePlaceStore();
	const { selectWorldItem, selectedWorldItemId } = useWorldItemStore();
	const { selectConcept, selectedConceptId } = useConceptStore();
	const { selectPrompt, selectedPromptId } = usePromptStore();
	const { selectNote, selectedNoteId } = useNoteStore();

	/**
	 * Limpia todas las selecciones actuales de todas las entidades
	 */
	const clearAllSelections = useCallback(() => {
		navLogger.info('🧹 Limpiando todas las selecciones de entidades');

		// Limpiar selecciones en cada store usando null o undefined según corresponda
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
	]);

	/**
	 * Navega a una vista específica, limpiando otras selecciones si es necesario
	 */
	const navigateToView = useCallback(
		(viewType: ViewType) => {
			try {
				navLogger.info(`🔄 Navegando a vista: ${viewType}`);

				// Limpiar selecciones que no corresponden a la vista actual
				if (viewType !== 'collection-content') {
					selectCollection(null);
				}
				if (viewType !== 'folder-content') {
					selectFolder(null);
				}
				if (viewType !== 'tag-content') {
					selectTag(null);
				}
				if (viewType !== 'album-content') {
					selectAlbum(null);
				}
				if (viewType !== 'character-content') {
					selectCharacter(null);
				}
				if (viewType !== 'place-content') {
					selectPlace(null);
				}
				if (viewType !== 'world-item-content') {
					selectWorldItem(null);
				}
				if (viewType !== 'concept-content') {
					selectConcept(null);
				}
				if (viewType !== 'prompt-content') {
					selectPrompt(null);
				}
				if (viewType !== 'note-content') {
					selectNote(null);
				}

				// Cambiar la vista
				setCurrentView(viewType);
			} catch (error) {
				navLogger.error('❌ Error al navegar a la vista:', error);
			}
		},
		[
			setCurrentView,
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
		]
	);

	/**
	 * Navega a la vista de contenido de una colección específica
	 */
	const navigateToCollection = useCallback(
		(id: string) => {
			navLogger.info(`📚 Navegando a colección: ${id}`);
			clearAllSelections();
			selectCollection(id);
			setCurrentView('collection-content');
		},
		[clearAllSelections, selectCollection, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de una carpeta específica
	 */
	const navigateToFolder = useCallback(
		(id: string) => {
			navLogger.info(`📁 Navegando a carpeta: ${id}`);
			clearAllSelections();
			selectFolder(id);
			setCurrentView('folder-content');
		},
		[clearAllSelections, selectFolder, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de una etiqueta específica
	 */
	const navigateToTag = useCallback(
		(id: string) => {
			navLogger.info(`🏷️ Navegando a etiqueta: ${id}`);
			clearAllSelections();
			selectTag(id);
			setCurrentView('tag-content');
		},
		[clearAllSelections, selectTag, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un álbum específico
	 */
	const navigateToAlbum = useCallback(
		(id: string) => {
			navLogger.info(`🖼️ Navegando a álbum: ${id}`);
			clearAllSelections();
			selectAlbum(id);
			setCurrentView('album-content');
		},
		[clearAllSelections, selectAlbum, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un personaje específico
	 */
	const navigateToCharacter = useCallback(
		(id: string) => {
			navLogger.info(`👤 Navegando a personaje: ${id}`);
			clearAllSelections();
			selectCharacter(id);
			setCurrentView('character-content');
		},
		[clearAllSelections, selectCharacter, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un lugar específico
	 */
	const navigateToPlace = useCallback(
		(id: string) => {
			navLogger.info(`🌍 Navegando a lugar: ${id}`);
			clearAllSelections();
			selectPlace(id);
			setCurrentView('place-content');
		},
		[clearAllSelections, selectPlace, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un objeto mundial específico
	 */
	const navigateToWorldItem = useCallback(
		(id: string) => {
			navLogger.info(`🧩 Navegando a objeto mundial: ${id}`);
			clearAllSelections();
			selectWorldItem(id);
			setCurrentView('world-item-content');
		},
		[clearAllSelections, selectWorldItem, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un concepto específico
	 */
	const navigateToConcept = useCallback(
		(id: string) => {
			navLogger.info(`💡 Navegando a concepto: ${id}`);
			clearAllSelections();
			selectConcept(id);
			setCurrentView('concept-content');
		},
		[clearAllSelections, selectConcept, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un prompt específico
	 */
	const navigateToPrompt = useCallback(
		(id: string) => {
			navLogger.info(`💬 Navegando a prompt: ${id}`);
			clearAllSelections();
			selectPrompt(id);
			setCurrentView('prompt-content');
		},
		[clearAllSelections, selectPrompt, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de una nota específica
	 */
	const navigateToNote = useCallback(
		(id: string) => {
			navLogger.info(`📝 Navegando a nota: ${id}`);
			clearAllSelections();
			selectNote(id);
			setCurrentView('note-content');
		},
		[clearAllSelections, selectNote, setCurrentView]
	);

	/**
	 * Navega a la vista principal desde una vista de contenido
	 */
	const navigateToMainFromContent = useCallback(() => {
		const mainView = currentView.replace('-content', '') as ViewType;
		navLogger.info(`🔙 Navegando a vista principal: ${mainView}`);
		clearAllSelections();
		setCurrentView(mainView);
	}, [currentView, clearAllSelections, setCurrentView]);

	/**
	 * Navega a la vista de inicio (galería)
	 */
	const navigateToHome = useCallback(() => {
		navLogger.info('🏠 Navegando a inicio (galería)');
		clearAllSelections();
		setCurrentView('all-images');
	}, [clearAllSelections, setCurrentView]);

	/**
	 * Obtiene el elemento actual seleccionado basado en la vista actual
	 */
	const getCurrentItem = useCallback(() => {
		// Detectamos el tipo de vista actual y obtenemos la información básica
		switch (currentView) {
			case 'collection-content':
				return getSelectedCollection();
			case 'folder-content':
				return useFolderStore.getState().selected;
			case 'tag-content':
				return useTagStore.getState().getSelectedTag();
			case 'album-content':
				return useAlbumStore.getState().getSelectedAlbum();
			case 'character-content':
				return useCharacterStore.getState().getSelectedCharacter();
			case 'place-content':
				return usePlaceStore.getState().getSelectedPlace();
			case 'world-item-content':
				return useWorldItemStore.getState().getSelectedItem();
			case 'concept-content':
				return useConceptStore.getState().getSelectedConcept();
			case 'prompt-content':
				return usePromptStore.getState().selectedPrompt;
			case 'note-content':
				return useNoteStore.getState().selectedNote;
			default:
				return null;
		}
	}, [currentView, getSelectedCollection]);

	return {
		// Estados actuales
		currentView,
		currentCollectionId: selectedCollectionId,
		currentFolderId: selectedFolderId,
		currentTagId: selectedTagId,
		currentAlbumId: selectedAlbumId,
		currentCharacterId: selectedCharacterId,
		currentPlaceId: selectedPlaceId,
		currentWorldItemId: selectedWorldItemId,
		currentConceptId: selectedConceptId,
		currentPromptId: selectedPromptId,
		currentNoteId: selectedNoteId,

		// Acciones de navegación
		setCurrentView,
		navigateToView,
		navigateToCollection,
		navigateToFolder,
		navigateToTag,
		navigateToAlbum,
		navigateToCharacter,
		navigateToPlace,
		navigateToWorldItem,
		navigateToConcept,
		navigateToPrompt,
		navigateToNote,
		navigateToMainFromContent,
		navigateToHome,

		// Utilidades
		clearAllSelections,
		getCurrentItem,
	};
}
