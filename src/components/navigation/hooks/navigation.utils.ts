import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ViewType } from '@/components/views/types';
import { clientLogger } from '@/lib/logger/client-logger';
import { useHierarchicalNavigation } from '@/lib/utils/folder/hierarchical-navigation';
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

const navLogger = clientLogger.withContext('NavigationUtils');

// Mapa de configuración para simplificar la lógica de navegación
const navigationMap = {
	'collection-content': useCollectionStore.getState,
	'folder-content': useFolderStore.getState,
	'tag-content': useTagStore.getState,
	'album-content': useAlbumStore.getState,
	'character-content': useCharacterStore.getState,
	'place-content': usePlaceStore.getState,
	'world-item-content': useWorldItemStore.getState,
	'concept-content': useConceptStore.getState,
	'prompt-content': usePromptStore.getState,
	'note-content': useNoteStore.getState,
};

type ContentVewType = keyof typeof navigationMap;

/**
 * Hook personalizado para manejar la navegación y los cambios de vista
 * centralizando la lógica de limpieza de selecciones
 */
export function useNavigation() {
	const navigate = useNavigate();
	const { buildHierarchicalPath } = useHierarchicalNavigation();

	// Estados de las entidades para limpiar selecciones
	const collectionStore = useCollectionStore.getState();
	const folderStore = useFolderStore.getState();
	const tagStore = useTagStore.getState();
	const albumStore = useAlbumStore.getState();
	const characterStore = useCharacterStore.getState();
	const placeStore = usePlaceStore.getState();
	const worldItemStore = useWorldItemStore.getState();
	const conceptStore = useConceptStore.getState();
	const promptStore = usePromptStore.getState();
	const noteStore = useNoteStore.getState();

	/**
	 * Limpia todas las selecciones actuales de todas las entidades
	 */
	const clearAllSelections = useCallback(() => {
		navLogger.info('🧹 Limpiando todas las selecciones de entidades');
		const stores = [
			collectionStore,
			folderStore,
			tagStore,
			albumStore,
			characterStore,
			placeStore,
			worldItemStore,
			conceptStore,
			promptStore,
			noteStore,
		];
		for (const store of stores) {
			if ('clearSelection' in store && typeof store.clearSelection === 'function') {
				store.clearSelection();
			} else if ('select' in store && typeof store.select === 'function') {
				// Fallback para stores más antiguas que no tienen `clearSelection`
				(store as any).select(null);
			}
		}
	}, [
		collectionStore,
		folderStore,
		tagStore,
		albumStore,
		characterStore,
		placeStore,
		worldItemStore,
		conceptStore,
		promptStore,
		noteStore,
	]);

	/**
	 * Navega a una vista específica, limpiando otras selecciones si es necesario
	 */
	const navigateToView = useCallback(
		(viewType: ViewType) => {
			try {
				navLogger.info(`🔄 Navegando a vista: ${viewType}`);

				// Limpiar todas las selecciones de contenido si la nueva vista no es de contenido
				if (!(viewType in navigationMap)) {
					clearAllSelections();
				}

				// Cambiar la vista
				navigate(`/${viewType}`);
			} catch (error) {
				navLogger.error('❌ Could not navigate to view:', error);
			}
		},
		[navigate, clearAllSelections]
	);

	/**
	 * Navega a la vista de contenido de una entidad específica
	 */
	const navigateToEntityContent = useCallback(
		(viewType: ContentVewType, id: string) => {
			navLogger.info(`[${viewType}] Navegando a entidad: ${id}`);
			clearAllSelections();
			const store = navigationMap[viewType]();
			if ('select' in store && typeof store.select === 'function') {
				(store as any).select(id);
			}
			// Convertir viewType a ruta apropiada
			const routeMap: Record<ContentVewType, string> = {
				'collection-content': 'collections',
				'folder-content': 'folders',
				'tag-content': 'tags',
				'album-content': 'albums',
				'character-content': 'characters',
				'place-content': 'places',
				'world-item-content': 'world-items',
				'concept-content': 'concepts',
				'prompt-content': 'prompts',
				'note-content': 'notes',
			};
			navigate(`/${routeMap[viewType]}/${id}`);
		},
		[clearAllSelections, navigate]
	);

	// Se mantienen los wrappers para compatibilidad hacia atrás
	const navigateToCollection = (id: string) => navigateToEntityContent('collection-content', id);
	const navigateToTag = (id: string) => navigateToEntityContent('tag-content', id);
	const navigateToAlbum = (id: string) => navigateToEntityContent('album-content', id);
	const navigateToCharacter = (id: string) => navigateToEntityContent('character-content', id);
	const navigateToPlace = (id: string) => navigateToEntityContent('place-content', id);
	const navigateToWorldItem = (id: string) => navigateToEntityContent('world-item-content', id);
	const navigateToConcept = (id: string) => navigateToEntityContent('concept-content', id);
	const navigateToPrompt = (id: string) => navigateToEntityContent('prompt-content', id);
	const navigateToNote = (id: string) => navigateToEntityContent('note-content', id);

	/**
	 * Navega a una carpeta específica usando path jerárquico
	 */
	const navigateToFolder = useCallback(
		(id: string) => {
			navLogger.info(`[folder] Navegando a carpeta: ${id}`);
			clearAllSelections();

			// Construir path jerárquico
			const hierarchicalPath = buildHierarchicalPath(id);

			// Navegar usando path jerárquico
			if (hierarchicalPath) {
				navigate(`/folders/${hierarchicalPath}`);
			} else {
				// Fallback para carpeta raíz o error
				navigate('/folders');
			}
		},
		[clearAllSelections, navigate, buildHierarchicalPath]
	);

	return {
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
		clearAllSelections,
	};
}
