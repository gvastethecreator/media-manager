/**
 * @file Slice principal para operaciones CRUD del store de propiedades
 * @module store/entities/property/slices/core
 */

import { getProperties, getProperty } from '@/app/actions/properties/property.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast.service';
import { extendProperties, extendProperty } from '@/transformers/property/serializers';
import type {
    CreatePropertyData,
    Property,
    PropertyBase,
    UpdatePropertyData,
} from '@/types/entities/property';
import type { StateCreator } from 'zustand';
import type { PropertyState } from '../types';

const propertyLogger = serverLogger.withContext('PropertyStore');

// Slice para operaciones CRUD básicas
export interface PropertyCoreSlice {
  // Getters
  getProperty: (id: string) => Property | undefined;
  getProperties: () => Property[];
  getPropertyItems: (propertyId: string) => Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>;

  // Operaciones
  addProperty: (property: PropertyBase) => void;
  addProperties: (properties: PropertyBase[]) => void;
  updateProperty: (id: string, data: UpdatePropertyData) => void;
  deleteProperty: (id: string) => void;

  // Gestión de elementos
  addItemToProperty: (propertyId: string, itemId: string, itemType: 'image' | 'video' | 'note' | 'tag') => void;
  removeItemFromProperty: (propertyId: string, itemId: string) => void;
  clearPropertyItems: (propertyId: string) => void;

  // Estado de carga
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones asíncronas
  fetchProperty: (id: string) => Promise<Property | undefined>;
  fetchProperties: () => Promise<Property[]>;
  createProperty: (data: CreatePropertyData) => Promise<Property | undefined>;
  removeProperty: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createPropertyCoreSlice: StateCreator<
  PropertyState,
  [],
  [],
  PropertyCoreSlice
> = (set, get) => ({
  // Getters
  getProperty: (id) => {
    return get().core.properties[id];
  },

  getProperties: () => {
    const { properties } = get().core;
    return Object.values(properties);
  },

  getPropertyItems: (propertyId) => {
    return get().core.propertyItems[propertyId] || [];
  },

  // Operaciones
  addProperty: (property) => {
    propertyLogger.info('✅ Añadiendo propiedad al store:', property.name);
    set((state) => ({
      core: {
        ...state.core,
        properties: {
          ...state.core.properties,
          [property.id]: extendProperty(property),
        },
        lastUpdated: new Date(),
      },
    }));
  },

  addProperties: (properties) => {
    propertyLogger.info('✅ Añadiendo múltiples propiedades al store', properties.length);
    const propertiesMap = properties.reduce(
      (acc, property) => ({
        ...acc,
        [property.id]: extendProperty(property),
      }),
      {}
    );

    set((state) => ({
      core: {
        ...state.core,
        properties: {
          ...state.core.properties,
          ...propertiesMap,
        },
        lastUpdated: new Date(),
      },
    }));
  },

  updateProperty: (id, data) => {
    const property = get().core.properties[id];
    if (!property) {
      propertyLogger.warn('⚠️ Intento de actualizar propiedad inexistente:', id);
      return;
    }

    propertyLogger.info('🔄 Actualizando propiedad en el store:', id);
    set((state) => ({
      core: {
        ...state.core,
        properties: {
          ...state.core.properties,
          [id]: {
            ...property,
            ...data,
            updatedAt: new Date(),
          },
        },
        lastUpdated: new Date(),
      },
    }));
  },

  deleteProperty: (id) => {
    propertyLogger.info('🗑️ Eliminando propiedad del store:', id);
    set((state) => {
      const { [id]: _, ...restProperties } = state.core.properties;
      const { [id]: __, ...restPropertyItems } = state.core.propertyItems;

      return {
        core: {
          ...state.core,
          properties: restProperties,
          propertyItems: restPropertyItems,
          lastUpdated: new Date(),
        },
      };
    });
  },

  // Gestión de elementos
  addItemToProperty: (propertyId, itemId, itemType) => {
    propertyLogger.info('➕ Añadiendo item a la propiedad:', { propertyId, itemId, itemType });
    set((state) => {
      const currentItems = state.core.propertyItems[propertyId] || [];
      const existingItem = currentItems.find((item) => item.id === itemId);

      if (existingItem) {
        return state; // El item ya existe
      }

      return {
        core: {
          ...state.core,
          propertyItems: {
            ...state.core.propertyItems,
            [propertyId]: [...currentItems, { id: itemId, type: itemType }],
          },
        },
      };
    });
  },

  removeItemFromProperty: (propertyId, itemId) => {
    propertyLogger.info('➖ Quitando item de la propiedad:', { propertyId, itemId });
    set((state) => {
      const currentItems = state.core.propertyItems[propertyId] || [];
      return {
        core: {
          ...state.core,
          propertyItems: {
            ...state.core.propertyItems,
            [propertyId]: currentItems.filter((item) => item.id !== itemId),
          },
        },
      };
    });
  },

  clearPropertyItems: (propertyId) => {
    propertyLogger.info('🧹 Limpiando items de la propiedad:', propertyId);
    set((state) => ({
      core: {
        ...state.core,
        propertyItems: {
          ...state.core.propertyItems,
          [propertyId]: [],
        },
      },
    }));
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
  fetchProperty: async (id) => {
    propertyLogger.info('🔍 Obteniendo propiedad:', id);
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      const property = await getProperty(id);
      if (property) {
        const extendedProperty = extendProperty(property as PropertyBase);
        get().addProperty(extendedProperty);
        return extendedProperty;
      }
      return undefined;
    } catch (error) {
      propertyLogger.error('❌ Error al obtener propiedad:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al obtener la propiedad',
        },
      }));
      toastService.error('No se pudo cargar la propiedad');
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

  fetchProperties: async () => {
    propertyLogger.info('🔍 Obteniendo todas las propiedades');
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      const properties = await getProperties();
      const extendedProperties = extendProperties(properties);
      get().addProperties(extendedProperties);
      return extendedProperties;
    } catch (error) {
      propertyLogger.error('❌ Error al obtener propiedades:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al obtener las propiedades',
        },
      }));
      toastService.error('No se pudieron cargar las propiedades');
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

  createProperty: async (data) => {
    propertyLogger.info('📝 Creando nueva propiedad:', data.name);
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      const property = await createProperty(data);
      if (property) {
        const extendedProperty = extendProperty(property);
        get().addProperty(extendedProperty);
        toastService.success('Propiedad creada con éxito');
        return extendedProperty;
      }
      return undefined;
    } catch (error) {
      propertyLogger.error('❌ Error al crear propiedad:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al crear la propiedad',
        },
      }));
      toastService.error('No se pudo crear la propiedad');
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

  removeProperty: async (id) => {
    propertyLogger.info('🗑️ Eliminando propiedad:', id);
    set((state) => ({
      core: {
        ...state.core,
        isLoading: true,
        error: null,
      },
    }));

    try {
      await deleteProperty(id);
      get().deleteProperty(id);
      toastService.success('Propiedad eliminada con éxito');
      return true;
    } catch (error) {
      propertyLogger.error('❌ Error al eliminar propiedad:', error);
      set((state) => ({
        core: {
          ...state.core,
          error: 'Error al eliminar la propiedad',
        },
      }));
      toastService.error('No se pudo eliminar la propiedad');
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