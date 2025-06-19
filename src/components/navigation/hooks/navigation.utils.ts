import { useNavigationStore } from '@/components/navigation/navigation.store';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';
import { useWorldItemStore } from '@/store/entities/world-item';
import { ViewType } from '@/types/files';
import { useCallback } from 'react';

const navLogger = clientLogger.withContext('NavigationUtils');

/**
 * Hook personalizado para manejar la navegación y los cambios de vista
 * centralizando la lógica de limpieza de selecciones
 */
export function useNavigation() {
	const { currentView, setCurrentView } = useNavigationStore();

	// Stores específicos para cada entidad
	const collectionStore = useCollectionStore();
	const tagStore = useTagStore();
	const albumStore = useAlbumStore();
	const characterStore = useCharacterStore();
	const placeStore = usePlaceStore();
	const worldItemStore = useWorldItemStore();
	const conceptStore = useConceptStore();
	const promptStore = usePromptStore();
	const noteStore = useNoteStore();

	// Extraer funciones de selección de los stores
	const selectCollection = collectionStore.selectCollection || (() => console.log('selectCollection not available'));
	const selectTag = tagStore.selectTag || (() => console.log('selectTag not available'));
	const selectAlbum = albumStore.selectAlbum || (() => console.log('selectAlbum not available'));
	const selectCharacter = characterStore.selectCharacter || (() => console.log('selectCharacter not available'));
	const selectPlace = placeStore.selectPlace || (() => console.log('selectPlace not available'));
	const selectWorldItem = worldItemStore.selectWorldItem || (() => console.log('selectWorldItem not available'));
	const selectConcept = conceptStore.selectConcept || (() => console.log('selectConcept not available'));
	const selectPrompt = promptStore.selectPrompt || (() => console.log('selectPrompt not available'));
	const selectNote = noteStore.selectNote || (() => console.log('selectNote not available'));

	// Extraer IDs seleccionados de los stores
	const selectedCollectionId = collectionStore.selectedCollectionId || null;
	const selectedTagId = tagStore.selectedId || null;
	const selectedAlbumId = albumStore.ui?.selectedIds?.[0] || null;
	const selectedCharacterId = characterStore.ui?.selectedIds?.[0] || null;
	const selectedPlaceId = placeStore.selectedPlaceId || null;
	const selectedWorldItemId = worldItemStore.selectedWorldItemId || null;
	const selectedConceptId = conceptStore.selectedConceptId || null;
	const selectedPromptId = promptStore.selectedPrompt?.id || null;
	const selectedNoteId = noteStore.selectedNoteId || null;

	// ✅ Funciones temporales para entidades sin store
	const selectFolder = useCallback((folderId: string | null) => {
		// TODO: Implementar store de folder
		console.log('Folder selected:', folderId);
	}, []);

	const selectedFolderId = null; // TODO: Obtener del store cuando exista

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
			navLogger.info(`📍 Navegando a lugar: ${id}`);
			clearAllSelections();
			selectPlace(id);
			setCurrentView('place-content');
		},
		[clearAllSelections, selectPlace, setCurrentView]
	);

	/**
	 * Navega a la vista de contenido de un elemento del mundo específico
	 */
	const navigateToWorldItem = useCallback(
		(id: string) => {
			navLogger.info(`🌍 Navegando a elemento del mundo: ${id}`);
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
	 * Obtiene el ID de la entidad actualmente seleccionada según la vista
	 */
	const getCurrentEntityId = useCallback(() => {
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
			default:
				return null;
		}
	}, [
		currentView,
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
	]);

	/**
	 * Verifica si hay alguna entidad seleccionada
	 */
	const hasSelection = useCallback(() => {
		return getCurrentEntityId() !== null;
	}, [getCurrentEntityId]);

	return {
		// Estado
		currentView,
		hasSelection: hasSelection(),
		currentEntityId: getCurrentEntityId(),

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

		// Navegación general
		navigateToView,
		clearAllSelections,

		// Navegación específica por entidad
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

		// Utilidades
		getCurrentEntityId,
	};
}
