'use client';

import { serverLogger } from '@/lib/logger/server-logger';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';
import { useWorldItemStore } from '@/store/entities/world-item';
// import { useObjectsStore } from '@/store/objects.store'; // Eliminado - Legacy
import { useCallback, useState } from 'react';
import type { LoadingStates } from '../types';

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

const entityLoaderLogger = serverLogger.withContext('EntityLoader');

// Estado inicial para la carga de entidades
const initialLoadingStates: LoadingStates = {
	collections: { loading: false, open: false, loaded: false },
	tags: { loading: false, open: false, loaded: false },
	albums: { loading: false, open: false, loaded: false },
	characters: { loading: false, open: false, loaded: false },
	places: { loading: false, open: false, loaded: false },
	objects: { loading: false, open: false, loaded: false },
	worldItems: { loading: false, open: false, loaded: false },
	prompts: { loading: false, open: false, loaded: false },
	notes: { loading: false, open: false, loaded: false },
	concepts: { loading: false, open: false, loaded: false },
};

export function useEntityLoader() {
	// Estados de carga para cada tipo de entidad
	const [loadingStates, setLoadingStates] = useState<LoadingStates>(initialLoadingStates);

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

	// Función para cargar datos cuando se abre un submenú
	const handleOpenChange = useCallback(
		(entity: keyof LoadingStates, isOpen: boolean) => {
			setLoadingStates((prev) => ({
				...prev,
				[entity]: { ...prev[entity], open: isOpen },
			}));

			if (isOpen && !loadingStates[entity].loaded) {
				loadEntityData(entity);
			}
		},
		[loadingStates]
	);

	// Función para cargar datos de una entidad específica
	const loadEntityData = useCallback(
		async (entity: keyof LoadingStates) => {
			if (loadingStates[entity].loading || loadingStates[entity].loaded) {
				return;
			}

			setLoadingStates((prev) => ({
				...prev,
				[entity]: { ...prev[entity], loading: true },
			}));

			try {
				entityLoaderLogger.info(`🔄 Cargando ${entity}...`);

				switch (entity) {
					case 'collections':
						// Verificar según la estructura del store
						if (collectionStore.collections !== undefined) {
							// Ya tenemos acceso a las colecciones
						}
						break;
					case 'tags':
						if (tagStore.tags !== undefined) {
							// Ya tenemos acceso a las etiquetas
						}
						break;
					case 'albums':
						if (albumStore.core && albumStore.core.albums) {
							// Ya tenemos los álbumes usando la estructura correcta
						}
						break;
					case 'characters':
						if (characterStore.characters !== undefined) {
							// Ya tenemos los personajes
						}
						break;
					case 'places':
						if (placeStore.places !== undefined) {
							// Ya tenemos los lugares
						}
						break;
					case 'worldItems':
						if (worldItemStore.worldItems !== undefined) {
							// Ya tenemos los objetos del mundo
						}
						break;
					case 'prompts':
						if (promptStore.prompts !== undefined) {
							// Ya tenemos los prompts
						}
						break;
					case 'notes':
						if (noteStore.notes !== undefined) {
							// Ya tenemos las notas
						}
						break;
					case 'concepts':
						if (conceptStore.concepts !== undefined) {
							// Ya tenemos los conceptos
						}
						break;
					default:
						throw new Error(`Entidad no soportada: ${entity}`);
				}

				setLoadingStates((prev) => ({
					...prev,
					[entity]: { loading: false, open: prev[entity].open, loaded: true },
				}));
				entityLoaderLogger.info(`✅ ${entity} cargado correctamente`);
			} catch (error) {
				entityLoaderLogger.error(`❌ Error al cargar ${entity}:`, error);
				setLoadingStates((prev) => ({
					...prev,
					[entity]: { ...prev[entity], loading: false },
				}));
			}
		},
		[
			loadingStates,
			collectionStore,
			tagStore,
			albumStore,
			characterStore,
			placeStore,
			worldItemStore,
			promptStore,
			noteStore,
			conceptStore,
		]
	);

	return {
		loadingStates,
		handleOpenChange,
		loadEntityData,
	};
}
