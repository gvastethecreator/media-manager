import { useCallback, useMemo, useRef, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { getAlbums } from '@/services/album/album.service';
import { getCharacters } from '@/services/character/character.service';
import { getCollections } from '@/services/collection/collection.service';
import { ConceptService } from '@/services/concept/concept.service';
import { searchGroupsService } from '@/services/group/group.service';
import { getNotes } from '@/services/note/note.service';
import { getPlaces } from '@/services/place/place.service';
import { searchPromptsService } from '@/services/prompt/prompt.service';
import { getProperties } from '@/services/property/property.service';
import { getTags } from '@/services/tag/tag.service';
import { getWildcards } from '@/services/wildcard/wildcard.service';
import { getWorldItems } from '@/services/world-item/world-item.service';
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
import type { EntityLoadingState, LoadingStates } from '../types';

// Logger para el componente
const entityLoaderLogger = clientLogger.withContext('EntityLoader');

// Interfaces para los stores
interface BaseEntityStore {
	fetchCollections?: () => Promise<unknown>;
	fetchTags?: () => Promise<unknown>;
	fetchAlbums?: () => Promise<unknown>;
	fetchCharacters?: () => Promise<unknown>;
	fetchPlaces?: () => Promise<unknown>;
	fetchWorldItems?: () => Promise<unknown>;
	fetchPrompts?: () => Promise<unknown>;
	fetchNotes?: () => Promise<unknown>;
	fetchConcepts?: () => Promise<unknown>;
	fetchGroups?: () => Promise<unknown>;
	fetchProperties?: () => Promise<unknown>;
	fetchWildcards?: () => Promise<unknown>;
}

// Estado inicial para la carga de entidades
const _initialLoadingStates: LoadingStates = {
	collections: { loading: false, loaded: false, error: null },
	tags: { loading: false, loaded: false, error: null },
	albums: { loading: false, loaded: false, error: null },
	characters: { loading: false, loaded: false, error: null },
	places: { loading: false, loaded: false, error: null },
	objects: { loading: false, loaded: false, error: null }, // Legacy, mantener para compatibilidad
	worldItems: { loading: false, loaded: false, error: null },
	prompts: { loading: false, loaded: false, error: null },
	notes: { loading: false, loaded: false, error: null },
	concepts: { loading: false, loaded: false, error: null },
};

// Mapeo de entidades a funciones de acción del servidor
const _entityActionMap = {
	tags: {
		action: getTags,
		storeMethod: 'setTags',
	},
	albums: {
		action: getAlbums,
		storeMethod: 'setAlbums',
	},
	collections: {
		action: getCollections,
		storeMethod: 'setCollections',
	},
	characters: {
		action: getCharacters,
		storeMethod: 'setCharacters',
	},
	places: {
		action: getPlaces,
		storeMethod: 'setPlaces',
	},
	worldItems: {
		action: getWorldItems,
		storeMethod: 'setWorldItems',
	},
	prompts: {
		action: searchPromptsService,
		storeMethod: 'setPrompts',
	},
	notes: {
		action: getNotes,
		storeMethod: 'setNotes',
	},
	concepts: {
		action: ConceptService.getConcepts,
		storeMethod: 'setConcepts',
	},
	groups: {
		action: searchGroupsService,
		storeMethod: 'setGroups',
	},
	properties: {
		action: getProperties,
		storeMethod: 'setProperties',
	},
	wildcards: {
		action: getWildcards,
		storeMethod: 'setWildcards',
	},
};

// Extender Window con nuestra propiedad personalizada
declare global {
	interface Window {
		entityPreloadComplete?: boolean;
		entityPreloadInProgress?: boolean;
		preloadingEntities?: Set<string>;
	}
}

// Modificar la función withTimeout para ser más tolerante y no fallar inmediatamente
const _withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, entityName: string): Promise<T> => {
	let timeoutId: any; // Usar any para compatibilidad entre Node y navegador

	const timeoutPromise = new Promise<T>((_resolve) => {
		timeoutId = setTimeout(() => {
			// Cast a number para compatibilidad con el navegador
			entityLoaderLogger.warn(
				`⚠️ Timeout al cargar ${entityName} después de ${timeoutMs}ms - continuando con datos parciales`
			);
			// @ts-ignore
			_resolve([]);
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} catch (error) {
		entityLoaderLogger.warn(`⚠️ Error durante la carga de ${entityName} con timeout:`, error);
		// @ts-ignore
		return [];
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
};

/**
 * Hook para cargar entidades para los submenús del menú contextual
 */
export function useEntityLoader() {
	// Estado inicial para todas las entidades
	const initialLoadingState: EntityLoadingState = {
		loading: false,
		loaded: false,
		error: null,
	};

	// Estado para todas las entidades
	const [loadingStates, setLoadingStates] = useState<LoadingStates>({
		collections: { ...initialLoadingState },
		tags: { ...initialLoadingState },
		albums: { ...initialLoadingState },
		characters: { ...initialLoadingState },
		places: { ...initialLoadingState },
		objects: { ...initialLoadingState },
		worldItems: { ...initialLoadingState },
		prompts: { ...initialLoadingState },
		notes: { ...initialLoadingState },
		concepts: { ...initialLoadingState },
	});

	// Ref para controlar si la precarga ya se ha ejecutado
	const _preloadExecutedRef = useRef<boolean>(false);

	// Acceder a los stores
	const collectionStore = useCollectionStore();
	const tagStore = useTagStore();
	const albumStore = useAlbumStore();
	const characterStore = useCharacterStore();
	const placeStore = usePlaceStore();
	const worldItemStore = useWorldItemStore();
	const promptStore = usePromptStore();
	const noteStore = useNoteStore();
	const conceptStore = useConceptStore();
	const groupStore = useGroupStore();
	const propertyStore = usePropertyStore();
	const wildcardStore = useWildcardStore();

	// Memoizamos todas las stores para evitar recreaciones del objeto
	const _stores = useMemo(
		() => ({
			collections: collectionStore,
			tags: tagStore,
			albums: albumStore,
			characters: characterStore,
			places: placeStore,
			worldItems: worldItemStore,
			prompts: promptStore,
			notes: noteStore,
			concepts: conceptStore,
			groups: groupStore,
			properties: propertyStore,
			wildcards: wildcardStore,
		}),
		[
			collectionStore,
			tagStore,
			albumStore,
			characterStore,
			placeStore,
			worldItemStore,
			promptStore,
			noteStore,
			conceptStore,
			groupStore,
			propertyStore,
			wildcardStore,
		]
	);

	// Función para actualizar el estado de carga de una entidad
	const updateLoadingState = useCallback((entity: keyof LoadingStates, state: Partial<EntityLoadingState>) => {
		setLoadingStates((prev) => ({
			...prev,
			[entity]: {
				...prev[entity],
				...state,
			},
		}));
	}, []);

	// Función para cargar datos de una entidad específica
	const loadEntityData = useCallback(
		async (entity: keyof LoadingStates) => {
			if (loadingStates[entity].loading || loadingStates[entity].loaded) {
				return;
			}
			updateLoadingState(entity, { loading: true });
			try {
				entityLoaderLogger.info(`🔄 Cargando datos para ${entity}...`);
				switch (entity) {
					case 'collections':
						if ('fetchCollections' in collectionStore) {
							await collectionStore.fetchCollections();
						}
						break;
					case 'tags':
						if ('fetchTags' in tagStore) {
							await tagStore.fetchTags();
						}
						break;
					case 'albums':
						if ('loadAlbums' in albumStore) {
							await albumStore.loadAlbums();
						}
						break;
					case 'characters':
						// No hay método de fetch, solo marcar como cargado
						break;
					case 'places':
						if ('loadPlaces' in placeStore) {
							await placeStore.loadPlaces();
						}
						break;
					case 'worldItems':
						if ('loadWorldItems' in worldItemStore) {
							await worldItemStore.loadWorldItems();
						}
						break;
					case 'prompts':
						// No hay método de fetch, solo marcar como cargado
						break;
					case 'notes':
						// No hay método de fetch, solo marcar como cargado
						break;
					case 'concepts':
						// No hay método de fetch, solo marcar como cargado
						break;
					// objects: legacy, no cargar
				}
				updateLoadingState(entity, {
					loading: false,
					loaded: true,
					error: null,
				});
			} catch (error) {
				entityLoaderLogger.error(`❌ Error cargando ${entity}:`, error);
				updateLoadingState(entity, {
					loading: false,
					error: error instanceof Error ? error.message : 'Error desconocido',
				});
			}
		},
		[loadingStates, updateLoadingState, collectionStore, tagStore, albumStore, placeStore, worldItemStore]
	);

	// Función para manejar el cambio de estado abierto/cerrado de un submenú
	const handleOpenChange = useCallback(
		(entity: keyof LoadingStates, isOpen: boolean) => {
			// Si se abre y no se ha cargado, cargar los datos
			if (isOpen && !loadingStates[entity].loaded) {
				loadEntityData(entity);
			}
		},
		[loadingStates, loadEntityData]
	);

	return {
		loadingStates,
		loadEntityData,
		handleOpenChange,
	};
}
