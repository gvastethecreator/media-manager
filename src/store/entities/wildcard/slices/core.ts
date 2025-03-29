/**
 * @file Slice principal para operaciones CRUD del store de comodines
 * @module store/entities/wildcard/slices/core
 */

import { getWildcard, getWildcards } from '@/app/actions/wildcards/wildcard.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast.service';
import { extendWildcard, extendWildcards } from '@/transformers/wildcard/serializers';
import type {
    CreateWildcardData,
    UpdateWildcardData,
    Wildcard,
    WildcardBase,
} from '@/types/entities/wildcard';
import type { StateCreator } from 'zustand';
import type { WildcardState } from '../types';

const wildcardLogger = serverLogger.withContext('WildcardStore');

// Slice para operaciones CRUD básicas
export interface WildcardCoreSlice {
  // Getters
  getWildcard: (id: string) => Wildcard | undefined;
  getWildcards: () => Wildcard[];
  getWildcardItems: (wildcardId: string) => Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>;
  getChildWildcards: (parentId: string | null) => Wildcard[];
  getWildcardHierarchy: () => Record<string | 'root', string[]>;

  // Operaciones
  addWildcard: (wildcard: WildcardBase) => void;
  addWildcards: (wildcards: WildcardBase[]) => void;
  updateWildcard: (id: string, data: UpdateWildcardData) => void;
  deleteWildcard: (id: string) => void;

  // Gestión de elementos
  addItemToWildcard: (wildcardId: string, itemId: string, itemType: 'image' | 'video' | 'note' | 'tag') => void;
  removeItemFromWildcard: (wildcardId: string, itemId: string) => void;
  clearWildcardItems: (wildcardId: string) => void;

  // Gestión de jerarquía
  moveWildcard: (id: string, newParentId: string | null) => Promise<boolean>;

  // Estado de carga
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones asíncronas
  fetchWildcard: (id: string) => Promise<Wildcard | undefined>;
  fetchWildcards: () => Promise<Wildcard[]>;
  createWildcard: (data: CreateWildcardData) => Promise<Wildcard | undefined>;
  removeWildcard: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createWildcardCoreSlice: StateCreator<
  WildcardState,
  [],
  [],
  WildcardCoreSlice
> = (set, get) => ({
  // Getters
  getWildcard: (id) => {
    return get().core.wildcards[id];
  },

  getWildcards: () => {
    const { wildcards } = get().core;
    return Object.values(wildcards);
  },

  getWildcardItems: (wildcardId) => {
    return get().core.wildcardItems[wildcardId] || [];
  },

  getChildWildcards: (parentId) => {
    return get().getWildcards().filter((wildcard) => wildcard.parentId === parentId);
  },

  getWildcardHierarchy: () => {
    const hierarchy: Record<string | 'root', string[]> = { root: [] };
    const wildcards = get().getWildcards();

    // Primero inicializa todos los arrays de hijos
    wildcards.forEach((wildcard) => {
      hierarchy[wildcard.id] = [];
    });

    // Luego asigna los hijos a sus respectivos padres
    wildcards.forEach((wildcard) => {
      if (wildcard.parentId) {
        // Si tiene padre, lo agrega a los hijos del padre
        if (hierarchy[wildcard.parentId]) {
          hierarchy[wildcard.parentId].push(wildcard.id);
        }
      } else {
        // Si no tiene padre, es un comodín de nivel raíz
        hierarchy.root.push(wildcard.id);
      }
    });

    return hierarchy;
  },

  // Operaciones
  addWildcard: (wildcard) => {
    wildcardLogger.info('✅ Añadiendo comodín al store:', wildcard.name);
    set((state) => ({
      core: {
        ...state.core,
        wildcards: {
          ...state.core.wildcards,
          [wildcard.id]: extendWildcard(wildcard),
        },
        lastUpdated: new Date(),
      },
    }));
  },

  addWildcards: (wildcards) => {
    wildcardLogger.info('✅ Añadiendo múltiples comodines al store', wildcards.length);

    // Crear un objeto con los nuevos wildcards indexados por ID
    const wildcardsMap = wildcards.reduce((acc, wildcard) => {
      acc[wildcard.id] = extendWildcard(wildcard);
      return acc;
    }, {} as Record<string, Wildcard>);

    set((state) => ({
      core: {
        ...state.core,
        wildcards: {
          ...state.core.wildcards,
          ...wildcardsMap,
        },
        lastUpdated: new Date(),
      },
    }));
  },

  updateWildcard: (id, data) => {
    const wildcard = get().core.wildcards[id];
    if (!wildcard) {
      wildcardLogger.warn('⚠️ Intento de actualizar comodín inexistente:', id);
      return;
    }

    wildcardLogger.info('🔄 Actualizando comodín en el store:', id);
    set((state) => ({
      core: {
        ...state.core,
        wildcards: {
          ...state.core.wildcards,
          [id]: {
            ...wildcard,
            ...data,
            updatedAt: new Date(),
          },
        },
        lastUpdated: new Date(),
      },
    }));
  },

  deleteWildcard: (id) => {
    wildcardLogger.info('🗑️ Eliminando comodín del store:', id);
    set((state) => {
      const { [id]: _, ...restWildcards } = state.core.wildcards;
      const { [id]: __, ...restWildcardItems } = state.core.wildcardItems;

      return {
        core: {
          ...state.core,
          wildcards: restWildcards,
          wildcardItems: restWildcardItems,
          lastUpdated: new Date(),
        },
      };
    });
  },

  // Gestión de elementos
  addItemToWildcard: (wildcardId, itemId, itemType) => {
    wildcardLogger.info('➕ Añadiendo item al comodín:', { wildcardId, itemId, itemType });
    set((state) => {
      const currentItems = state.core.wildcardItems[wildcardId] || [];
      const existingItem = currentItems.find((item) => item.id === itemId);

      if (existingItem) {
        return state; // El item ya existe
      }

      return {
        core: {
          ...state.core,
          wildcardItems: {
            ...state.core.wildcardItems,
            [wildcardId]: [...currentItems, { id: itemId, type: itemType }],
          },
        },
      };
    });
  },

  removeItemFromWildcard: (wildcardId, itemId) => {
    wildcardLogger.info('➖ Quitando item del comodín:', { wildcardId, itemId });
    set((state) => {
      const currentItems = state.core.wildcardItems[wildcardId] || [];
      return {
        core: {
          ...state.core,
          wildcardItems: {
            ...state.core.wildcardItems,
            [wildcardId]: currentItems.filter((item) => item.id !== itemId),
          },
        },
      };
    });
  },

  clearWildcardItems: (wildcardId) => {
    wildcardLogger.info('🧹 Limpiando items del comodín:', wildcardId);
    set((state) => ({
      core: {
        ...state.core,
        wildcardItems: {
          ...state.core.wildcardItems,
          [wildcardId]: [],
        },
      },
    }));
  },

  // Gestión de jerarquía
  moveWildcard: async (id, newParentId) => {
    wildcardLogger.info('🔄 Moviendo comodín:', { id, newParentId });

    try {
      // Verificar que el comodín a mover existe
      const wildcard = get().getWildcard(id);
      if (!wildcard) {
        wildcardLogger.error('❌ No se encontró el comodín a mover:', id);
        toastService.error('No se encontró el comodín a mover');
        return false;
      }

      // Verificar que el nuevo padre existe (si no es null)
      if (newParentId && !get().getWildcard(newParentId)) {
        wildcardLogger.error('❌ No se encontró el comodín padre:', newParentId);
        toastService.error('No se encontró el comodín padre');
        return false;
      }

      // Evitar que un comodín sea su propio padre
      if (id === newParentId) {
        wildcardLogger.error('❌ Un comodín no puede ser su propio padre');
        toastService.error('Un comodín no puede ser su propio padre');
        return false;
      }

      // Evitar ciclos (verificar que el nuevo padre no sea descendiente del comodín)
      if (newParentId) {
        let currentParent = get().getWildcard(newParentId);
        while (currentParent?.parentId) {
          if (currentParent.parentId === id) {
            wildcardLogger.error('❌ Mover causaría un ciclo en la jerarquía');
            toastService.error('No se puede crear un ciclo en la jerarquía');
            return false;
          }
          currentParent = get().getWildcard(currentParent.parentId);
        }
      }

      // Actualizar el parentId del comodín
      await updateWildcard(id, { parentId: newParentId });

      // Actualizar en el store
      get().updateWildcard(id, { parentId: newParentId });

      toastService.success('Comodín movido con éxito');
      return true;
    } catch (error) {
      wildcardLogger.error('❌ Error al mover comodín:', error);
      toastService.error('Error al mover el comodín');
      return false;
    }
  },

  // Estado de carga
  setLoading: (isLoading) => {
    set((state) => ({
      core: {
        ...state.core,
        isLoading,
      },
    }));
  },

  setError: (error) => {
    set((state) => ({
      core: {
        ...state.core,
        error,
      },
    }));
  },

  // Acciones asíncronas
  fetchWildcard: async (id) => {
    wildcardLogger.info('🔍 Obteniendo comodín:', id);
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      const wildcard = await getWildcard(id);
      if (wildcard) {
        const extendedWildcard = extendWildcard(wildcard as WildcardBase);
        get().addWildcard(extendedWildcard);
        return extendedWildcard;
      }
      return undefined;
    } catch (error) {
      wildcardLogger.error('❌ Error al obtener comodín:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al obtener el comodín',
        },
      }));
      toastService.error('No se pudo cargar el comodín');
      return undefined;
    } finally {
      set((state) => ({
        core: {
          ...state.core,
          isLoading: false,
        },
      }));
    }
  },

  fetchWildcards: async () => {
    wildcardLogger.info('🔍 Obteniendo todos los comodines');
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      const wildcards = await getWildcards();
      const extendedWildcards = extendWildcards(wildcards);
      get().addWildcards(extendedWildcards);
      return extendedWildcards;
    } catch (error) {
      wildcardLogger.error('❌ Error al obtener comodines:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al obtener los comodines',
        },
      }));
      toastService.error('No se pudieron cargar los comodines');
      return [];
    } finally {
      set((state) => ({
        core: {
          ...state.core,
          isLoading: false,
        },
      }));
    }
  },

  createWildcard: async (data) => {
    wildcardLogger.info('📝 Creando nuevo comodín:', data.name);
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      const wildcard = await createWildcard(data);
      if (wildcard) {
        const extendedWildcard = extendWildcard(wildcard);
        get().addWildcard(extendedWildcard);
        toastService.success('Comodín creado con éxito');
        return extendedWildcard;
      }
      return undefined;
    } catch (error) {
      wildcardLogger.error('❌ Error al crear comodín:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al crear el comodín',
        },
      }));
      toastService.error('No se pudo crear el comodín');
      return undefined;
    } finally {
      set((state) => ({
        core: {
          ...state.core,
          isLoading: false,
        },
      }));
    }
  },

  removeWildcard: async (id) => {
    wildcardLogger.info('🗑️ Eliminando comodín:', id);
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      await deleteWildcard(id);
      get().deleteWildcard(id);
      toastService.success('Comodín eliminado con éxito');
      return true;
    } catch (error) {
      wildcardLogger.error('❌ Error al eliminar comodín:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al eliminar el comodín',
        },
      }));
      toastService.error('No se pudo eliminar el comodín');
      return false;
    } finally {
      set((state) => ({
        core: {
          ...state.core,
          isLoading: false,
        },
      }));
    }
  },
});