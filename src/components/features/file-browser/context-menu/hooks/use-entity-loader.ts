'use client';

import { getAlbums } from '@/app/actions/albums/album.actions';
import { searchCharacters } from '@/app/actions/characters/character.actions';
import { getCollections } from '@/app/actions/collections/collection.actions';
import { getConcepts } from '@/app/actions/concepts/concept.actions';
import { getGroups } from '@/app/actions/groups/group.actions';
import { getNotes } from '@/app/actions/notes/note.actions';
import { getPlaces } from '@/app/actions/places/place.actions';
import { getPrompts } from '@/app/actions/prompts/prompt.actions';
import { getProperties } from '@/app/actions/properties/property.actions';
import { getTagsAction } from '@/app/actions/tags';
import { getWildcards } from '@/app/actions/wildcards/wildcard.actions';
import { getWorldItems } from '@/app/actions/world-items/world-item.actions';
import { clientLogger } from '@/lib/logger/client-logger';
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
import { useCallback, useMemo, useRef, useState } from 'react';
import type { EntityLoadingState, LoadingStates } from '../types';

// Logger para el componente
const entityLoaderLogger = clientLogger.withContext('EntityLoader');

// Interfaces para los stores
interface BaseEntityStore {
	getCollections?: () => unknown[];
	getTags?: () => unknown[];
	getAlbums?: () => unknown[];
	getCharacters?: () => unknown[];
	getPlaces?: () => unknown[];
	getWorldItems?: () => unknown[];
	getPrompts?: () => unknown[];
	getNotes?: () => unknown[];
	getConcepts?: () => unknown[];
}

// Estado inicial para la carga de entidades
const initialLoadingStates: LoadingStates = {
	collections: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	tags: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	albums: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	characters: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	places: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	worldItems: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	prompts: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	notes: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
	concepts: { loading: false, open: false, loaded: false, hasError: false, loadedCount: 0 },
};

// Mapeo de entidades a funciones de acción del servidor
const entityActionMap = {
	tags: {
		action: getTagsAction,
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
		action: searchCharacters,
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
		action: getPrompts,
		storeMethod: 'setPrompts',
	},
	notes: {
		action: getNotes,
		storeMethod: 'setNotes',
	},
	concepts: {
		action: getConcepts,
		storeMethod: 'setConcepts',
	},
	groups: {
		action: getGroups,
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
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, entityName: string): Promise<T> => {
	let timeoutId: NodeJS.Timeout;

	const timeoutPromise = new Promise<T>((_, reject) => {
		timeoutId = setTimeout(() => {
			// En lugar de rechazar la promesa inmediatamente, registramos el timeout como advertencia
			// y continuamos con un valor por defecto (array vacío)
			entityLoaderLogger.warn(
				`⚠️ Timeout al cargar ${entityName} después de ${timeoutMs}ms - continuando con datos parciales`
			);
			// Devolver array vacío en vez de rechazar la promesa
			// @ts-ignore - Ignoramos el error de tipos ya que sabemos que estamos manejando arrays
			resolve([]);
		}, timeoutMs);
	});

	try {
		// Race entre la promesa original y el timeout
		return await Promise.race([promise, timeoutPromise]);
	} catch (error) {
		// Si falla la promesa original, registramos y devolvemos array vacío
		entityLoaderLogger.warn(`⚠️ Error durante la carga de ${entityName} con timeout:`, error);
		// @ts-ignore - Ignoramos el error de tipos ya que sabemos que estamos manejando arrays
		return [];
	} finally {
		clearTimeout(timeoutId);
	}
};

/**
 * Hook para cargar entidades para los submenús del menú contextual
 */
export function useEntityLoader() {
	// Estado inicial para todas las entidades
	const initialLoadingState: EntityLoadingState = {
		loading: false,
		open: false,
		loaded: false
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
		concepts: { ...initialLoadingState }
	});

	// Ref para controlar si la precarga ya se ha ejecutado
	const preloadExecutedRef = useRef<boolean>(false);

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
	const stores = useMemo(
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
		setLoadingStates(prev => ({
			...prev,
			[entity]: {
				...prev[entity],
				...state
			}
		}));
	}, []);

	// Función para manejar el cambio de estado abierto/cerrado de un submenú
	const handleOpenChange = useCallback((entity: keyof LoadingStates, isOpen: boolean) => {
		updateLoadingState(entity, { open: isOpen });

		// Si se abre y no se ha cargado, cargar los datos
		if (isOpen && !loadingStates[entity].loaded) {
			loadEntityData(entity);
		}
	}, [loadingStates, updateLoadingState]);

	// Función para cargar datos de una entidad específica
	const loadEntityData = useCallback(async (entity: keyof LoadingStates) => {
		// Si ya está cargando o ya está cargado, no hacer nada
		if (loadingStates[entity].loading || loadingStates[entity].loaded) {
			return;
		}

		// Marcar como cargando
		updateLoadingState(entity, { loading: true });

		try {
			// Cargar datos según el tipo de entidad
			switch (entity) {
				case 'collections':
					await collectionStore.fetchCollections();
					break;
				case 'tags':
					await tagStore.fetchTags();
					break;
				case 'albums':
					await albumStore.fetchAlbums();
					break;
				// Implementar otros casos según sea necesario
				case 'characters':
					if (typeof characterStore.fetchCharacters === 'function') {
						await characterStore.fetchCharacters();
					}
					break;
				case 'places':
					if (typeof placeStore.fetchPlaces === 'function') {
						await placeStore.fetchPlaces();
					}
					break;
				case 'worldItems':
					if (typeof worldItemStore.fetchWorldItems === 'function') {
						await worldItemStore.fetchWorldItems();
					}
					break;
				case 'prompts':
					if (typeof promptStore.fetchPrompts === 'function') {
						await promptStore.fetchPrompts();
					}
					break;
				case 'notes':
					if (typeof noteStore.fetchNotes === 'function') {
						await noteStore.fetchNotes();
					}
					break;
				case 'concepts':
					if (typeof conceptStore.fetchConcepts === 'function') {
						await conceptStore.fetchConcepts();
					}
					break;
			}

			// Marcar como cargado exitosamente
			updateLoadingState(entity, { loading: false, loaded: true });
		} catch (error) {
			console.error(`Error cargando ${entity}:`, error);
			// Marcar como error
			updateLoadingState(entity, { loading: false });
		}
	}, [loadingStates, updateLoadingState, collectionStore, tagStore, albumStore, characterStore, placeStore, worldItemStore, promptStore, noteStore, conceptStore]);

	return {
		loadingStates,
		loadEntityData,
		handleOpenChange
	};
}
