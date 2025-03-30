import { serverLogger } from '@/lib/logger/server-logger';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useFolderStore } from '@/store/entities/folder';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';
import { useWorldItemStore } from '@/store/entities/world-item';
import { useCallback, useEffect, useState } from 'react';

// Tipos
export type SupportedEntities =
  | 'tags'
  | 'albums'
  | 'collections'
  | 'worldItems'
  | 'places'
  | 'characters'
  | 'concepts'
  | 'prompts'
  | 'notes'
  | 'folders';

// Logger
const loadingLogger = serverLogger.withContext('EntityLoader');

// Función para obtener el store y método correspondiente a cada entidad
const getStoreForEntity = (entity: SupportedEntities) => {
  switch (entity) {
    case 'tags':
      return { store: useTagStore.getState(), loadMethod: 'loadTags' };
    case 'albums':
      return { store: useAlbumStore.getState(), loadMethod: 'loadAlbums' };
    case 'collections':
      return { store: useCollectionStore.getState(), loadMethod: 'loadCollections' };
    case 'worldItems':
      return { store: useWorldItemStore.getState(), loadMethod: 'loadWorldItems' };
    case 'places':
      return { store: usePlaceStore.getState(), loadMethod: 'loadPlaces' };
    case 'characters':
      return { store: useCharacterStore.getState(), loadMethod: 'loadCharacters' };
    case 'concepts':
      return { store: useConceptStore.getState(), loadMethod: 'loadConcepts' };
    case 'prompts':
      return { store: usePromptStore.getState(), loadMethod: 'loadPrompts' };
    case 'notes':
      return { store: useNoteStore.getState(), loadMethod: 'loadNotes' };
    case 'folders':
      return { store: useFolderStore.getState(), loadMethod: 'loadFolders' };
    default:
      return { store: null, loadMethod: null };
  }
};

// Función para manejar timeouts en promesas
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, entityName: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      loadingLogger.warn(`⏱️ Timeout excedido (${timeoutMs}ms) cargando ${entityName}`);
      resolve([] as unknown as T); // Resolver con array vacío en caso de timeout
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        loadingLogger.error(`❌ Error en operación (${entityName}):`, error);
        resolve([] as unknown as T); // Resolver con array vacío en caso de error
      });
  });
};

// Función para cargar datos desde el store o el servidor
const fetchStoreData = useCallback(
  async (entity: SupportedEntities): Promise<any[]> => {
    loadingLogger.info(`🔍 Intentando cargar datos para ${entity}`);

    // 1. Buscar el store correspondiente para esta entidad
    const { store, loadMethod } = getStoreForEntity(entity);
    if (!store || !loadMethod) {
      loadingLogger.warn(`⚠️ No se encontró un store válido para ${entity}, intentando cargar mediante server action...`);

      // 2. Intentar cargar datos mediante Server Actions si no hay store
      try {
        loadingLogger.info(`🔄 Intentando cargar ${entity} con server action...`);

        // Para cada entidad, intentar importar el server action correspondiente
        switch (entity) {
          case 'tags': {
            const { getTags } = await import('@/app/actions/tags/tag.actions');
            const tags = await getTags();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${tags.length} items`);
            return tags || [];
          }
          case 'collections': {
            const { getCollections } = await import('@/app/actions/collections/collection.actions');
            const collections = await getCollections();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${collections.length} items`);
            return collections || [];
          }
          case 'worldItems': {
            const { getWorldItems } = await import('@/app/actions/world-items/world-item.actions');
            const worldItems = await getWorldItems();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${worldItems.length} items`);
            return worldItems || [];
          }
          case 'places': {
            const { getPlaces } = await import('@/app/actions/places/place.actions');
            const places = await getPlaces();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${places.length} items`);
            return places || [];
          }
          case 'characters': {
            const { getCharacters } = await import('@/app/actions/characters/character.actions');
            const characters = await getCharacters();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${characters.length} items`);
            return characters || [];
          }
          case 'concepts': {
            const { getConcepts } = await import('@/app/actions/concepts/concept.actions');
            const concepts = await getConcepts();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${concepts.length} items`);
            return concepts || [];
          }
          case 'prompts': {
            const { getPrompts } = await import('@/app/actions/prompts/prompt.actions');
            const prompts = await getPrompts();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${prompts.length} items`);
            return prompts || [];
          }
          case 'notes': {
            const { getNotes } = await import('@/app/actions/notes/note.actions');
            const notes = await getNotes();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${notes.length} items`);
            return notes || [];
          }
          case 'albums': {
            const { getAlbums } = await import('@/app/actions/albums/album.actions');
            const albums = await getAlbums();
            loadingLogger.info(`✅ Datos de ${entity} cargados mediante server action: ${albums.length} items`);
            return albums || [];
          }
          default: {
            loadingLogger.warn(`⚠️ No hay server action implementada para ${entity}, usando API...`);
          }
        }

        // 3. Si no hay server action específica, intentar cargar desde la API
        loadingLogger.info(`🔄 Intentando cargar datos de ${entity} desde API...`);
        const response = await fetch(`/api/entities/${entity}`);
        if (!response.ok) {
          throw new Error(`Error al cargar ${entity} desde API: ${response.status}`);
        }
        const data = await response.json();
        loadingLogger.info(`✅ Datos de ${entity} cargados desde API: ${data.length} items`);
        return data || [];
      } catch (error) {
        loadingLogger.error(`❌ Error al cargar ${entity} sin store:`, error);
        return []; // Retornar array vacío en caso de error
      }
    }

    // 4. Si hay store, usar el método de carga del store
    try {
      loadingLogger.info(`🔄 Cargando ${entity} desde store...`);
      const data = await store[loadMethod]();
      loadingLogger.info(`✅ Datos de ${entity} cargados desde store: ${Array.isArray(data) ? data.length : 'N/A'} items`);
      return data || [];
    } catch (storeError) {
      loadingLogger.error(`❌ Error al cargar ${entity} desde store:`, storeError);

      // 5. Intentar cargar desde la API como último recurso
      try {
        loadingLogger.info(`🔄 Fallback: intentando cargar ${entity} desde API...`);
        const response = await fetch(`/api/entities/${entity}`);
        if (!response.ok) {
          throw new Error(`Error al cargar ${entity} desde API: ${response.status}`);
        }
        const data = await response.json();
        loadingLogger.info(`✅ Datos de ${entity} cargados desde API (fallback): ${data.length} items`);
        return data || [];
      } catch (apiError) {
        loadingLogger.error(`❌ Error final al cargar ${entity}:`, apiError);
        return []; // Retornar array vacío en caso de error total
      }
    }
  },
  []
);

// Hook principal de carga de entidades
export const useEntityLoader = () => {
  const [loadingStates, setLoadingStates] = useState<Record<SupportedEntities, boolean>>({
    tags: false,
    albums: false,
    collections: false,
    worldItems: false,
    places: false,
    characters: false,
    concepts: false,
    prompts: false,
    notes: false,
    folders: false,
  });

  // Controlar apertura de submenús
  const handleOpenChange = useCallback((open: boolean, entity: SupportedEntities) => {
    // Solo cargar datos cuando se abre el menú y no están ya cargados
    if (open && !loadingStates[entity]) {
      loadEntityData(entity).catch(console.error);
    }
  }, [loadingStates]);

  // Función principal para cargar datos de entidades
  const loadEntityData = useCallback(
    async (entity: SupportedEntities): Promise<any[]> => {
      // Verificar si ya se está cargando
      if (loadingStates[entity]) {
        loadingLogger.info(`⏳ ${entity} ya está cargándose, esperando...`);
        return [];
      }

      // Marcar como cargando
      setLoadingStates((prev) => ({ ...prev, [entity]: true }));

      try {
        // Intentar cargar con timeout de seguridad (15 segundos)
        const data = await withTimeout(fetchStoreData(entity), 15000, entity);
        return data;
      } catch (error) {
        loadingLogger.error(`❌ Error al cargar ${entity}:`, error);
        return [];
      } finally {
        // Marcar como completado incluso si hay error
        setLoadingStates((prev) => ({ ...prev, [entity]: false }));
      }
    },
    [loadingStates]
  );

  // Efecto para desactivar estados de carga al desmontar
  useEffect(() => {
    return () => {
      loadingLogger.info('🧹 Limpiando estados de carga de entidades');
    };
  }, []);

  return {
    loadingStates,
    loadEntityData,
    handleOpenChange,
  };
};
