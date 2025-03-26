'use client';

import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';
import { useWorldItemStore } from '@/store/entities/world-item';
import { useCallback, useMemo, useState } from 'react';
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
		]
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
				// Eliminamos logs innecesarios que podrían causar renderizaciones

				// No ejecutamos lógica innecesaria, ya que los stores ya tienen los datos
				// disponibles en memoria y no necesitan ser cargados

				setLoadingStates((prev) => ({
					...prev,
					[entity]: { loading: false, open: prev[entity].open, loaded: true },
				}));
			} catch (error) {
				setLoadingStates((prev) => ({
					...prev,
					[entity]: { ...prev[entity], loading: false },
				}));
			}
		},
		[loadingStates]
	);

	// Función para cargar datos cuando se abre un submenú
	const handleOpenChange = useCallback(
		(entity: keyof LoadingStates, isOpen: boolean) => {
			// Evitamos actualizar el estado si no hay cambio real
			if (loadingStates[entity].open === isOpen) return;

			setLoadingStates((prev) => ({
				...prev,
				[entity]: { ...prev[entity], open: isOpen },
			}));

			if (isOpen && !loadingStates[entity].loaded) {
				loadEntityData(entity);
			}
		},
		[loadingStates, loadEntityData]
	);

	return {
		loadingStates,
		handleOpenChange,
		loadEntityData,
	};
}
