'use client';

import { logger } from '@/lib/logger';
import { useAlbumsStore } from '@/store/entities/albums.store';
import { useCharactersStore } from '@/store/entities/characters.store';
import { useCollectionsStore } from '@/store/entities/collections.store';
import { useConceptStore } from '@/store/entities/concept.store';
import { useNoteStore } from '@/store/entities/note.store';
import { useTagsStore } from '@/store/entities/tags.store';
import { useObjectsStore } from '@/store/objects.store';
import { usePlacesStore } from '@/store/places.store';
import { usePromptStore } from '@/store/prompt.store';
import { useCallback, useState } from 'react';
import type { LoadingStates } from '../types';

const entityLoaderLogger = logger.withContext('EntityLoader');

// Estado inicial para la carga de entidades
const initialLoadingStates: LoadingStates = {
	collections: { loading: false, open: false, loaded: false },
	tags: { loading: false, open: false, loaded: false },
	albums: { loading: false, open: false, loaded: false },
	characters: { loading: false, open: false, loaded: false },
	places: { loading: false, open: false, loaded: false },
	objects: { loading: false, open: false, loaded: false },
	prompts: { loading: false, open: false, loaded: false },
	notes: { loading: false, open: false, loaded: false },
	concepts: { loading: false, open: false, loaded: false },
};

export function useEntityLoader() {
	// Estados de carga para cada tipo de entidad
	const [loadingStates, setLoadingStates] = useState<LoadingStates>(initialLoadingStates);

	// Acceder a los stores
	const { loadCollections } = useCollectionsStore();
	const { loadTags } = useTagsStore();
	const { loadAlbums } = useAlbumsStore();
	const { loadCharacters } = useCharactersStore();
	const { loadPlaces } = usePlacesStore();
	const { loadObjects } = useObjectsStore();
	const { loadPrompts } = usePromptStore();
	const { loadNotes } = useNoteStore();
	const { loadConcepts } = useConceptStore();

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
						await loadCollections();
						break;
					case 'tags':
						await loadTags();
						break;
					case 'albums':
						await loadAlbums();
						break;
					case 'characters':
						await loadCharacters();
						break;
					case 'places':
						await loadPlaces();
						break;
					case 'objects':
						await loadObjects();
						break;
					case 'prompts':
						await loadPrompts();
						break;
					case 'notes':
						await loadNotes();
						break;
					case 'concepts':
						await loadConcepts();
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
			loadCollections,
			loadTags,
			loadAlbums,
			loadCharacters,
			loadPlaces,
			loadObjects,
			loadPrompts,
			loadNotes,
			loadConcepts,
		]
	);

	return {
		loadingStates,
		handleOpenChange,
		loadEntityData,
	};
}
