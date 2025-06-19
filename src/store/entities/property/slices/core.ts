/**
 * @file Slice principal para operaciones CRUD del store de propiedades
 * @module store/entities/property/slices/core
 */

import {
    createProperty as createPropertyAction,
    deleteProperty as deletePropertyAction,
    getProperties as fetchPropertiesAction,
    getProperty as fetchPropertyAction,
    updateProperty as updatePropertyAction,
} from '@/app/actions/properties/property.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import {
    extendProperties,
    extendProperty,
} from '@/transformers/property/serializers';
import {
    CreatePropertySchema,
    UpdatePropertySchema,
} from '@/types/entities/property/schema';
import { z } from 'zod';
import type { StateCreator } from 'zustand';
import type { Property, PropertyState } from '../types';

const propertyLogger = clientLogger.withContext('PropertyStore');

// Tipos inferidos de Zod para una validación robusta
export type CreatePropertyData = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyData = z.infer<typeof UpdatePropertySchema>;

/**
 * @interface PropertyCoreSlice
 * @description Define la API del slice principal para la gestión de propiedades.
 * Incluye getters, operaciones síncronas y acciones asíncronas para interactuar
 * con el backend.
 */
export interface PropertyCoreSlice {
	// --- Getters ---
	getProperty: (id: string) => Property | undefined;
	getProperties: () => Property[];
	getPropertyItems: (
		propertyId: string,
	) => Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>;

	// --- Operaciones Síncronas ---
	addProperty: (property: Property) => void;
	addProperties: (properties: Property[]) => void;
	_updateProperty: (id: string, data: Partial<Property>) => void;
	deleteProperty: (id: string) => void;

	// --- Gestión de Elementos Asociados ---
	addItemToProperty: (
		propertyId: string,
		itemId: string,
		itemType: 'image' | 'video' | 'note' | 'tag',
	) => void;
	removeItemFromProperty: (propertyId: string, itemId: string) => void;
	clearPropertyItems: (propertyId: string) => void;

	// --- Estado de Carga y Errores ---
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// --- Acciones Asíncronas ---
	fetchProperty: (id: string) => Promise<Property | undefined>;
	fetchProperties: () => Promise<Property[]>;
	createProperty: (data: CreatePropertyData) => Promise<Property | undefined>;
	updateProperty: (
		id: string,
		data: UpdatePropertyData,
	) => Promise<Property | undefined>;
	removeProperty: (id: string) => Promise<boolean>;
}

/**
 * @function createPropertyCoreSlice
 * @description Implementación del slice de Zustand para la entidad Property.
 */
export const createPropertyCoreSlice: StateCreator<
	PropertyState & PropertyCoreSlice,
	[],
	[],
	PropertyCoreSlice
> = (set, get) => ({
	// --- Getters ---
	getProperty: (id) => get().core.properties[id],
	getProperties: () => Object.values(get().core.properties),
	getPropertyItems: (propertyId) => get().core.propertyItems[propertyId] || [],

	// --- Operaciones Síncronas ---
	addProperty: (property) => {
		propertyLogger.info('✅ Añadiendo propiedad al store:', property.name);
		set((state) => ({
			core: {
				...state.core,
				properties: {
					...state.core.properties,
					[property.id]: property,
				},
				lastUpdated: new Date(),
			},
		}));
	},

	addProperties: (properties) => {
		propertyLogger.info(
			`✅ Añadiendo ${properties.length} propiedades al store`,
		);
		const newProperties = properties.reduce(
			(acc, prop) => {
				acc[prop.id] = prop;
				return acc;
			},
			{} as Record<string, Property>,
		);
		set((state) => ({
			core: {
				...state.core,
				properties: {
					...state.core.properties,
					...newProperties,
				},
				lastUpdated: new Date(),
			},
		}));
	},

	_updateProperty: (id, data) => {
		const existingProperty = get().getProperty(id);
		if (!existingProperty) {
			propertyLogger.warn(`⚠️ No se encontró la propiedad con ID: ${id}`);
			return;
		}
		const updatedProperty = {
			...existingProperty,
			...data,
			updatedAt: new Date(),
		};
		get().addProperty(updatedProperty);
	},

	deleteProperty: (id) => {
		const { [id]: _, ...remaining } = get().core.properties;
		set((state) => ({
			core: {
				...state.core,
				properties: remaining,
				lastUpdated: new Date(),
			},
		}));
		// También eliminamos los items asociados para evitar datos huérfanos
		const { [id]: __, ...remainingItems } = get().core.propertyItems;
		set((state) => ({
			core: {
				...state.core,
				propertyItems: remainingItems,
			},
		}));
	},

	// --- Gestión de Elementos Asociados ---
	addItemToProperty: (propertyId, itemId, itemType) => {
		set((state) => {
			const items = state.core.propertyItems[propertyId] || [];
			if (items.some((item) => item.id === itemId)) return state;

			return {
				core: {
					...state.core,
					propertyItems: {
						...state.core.propertyItems,
						[propertyId]: [...items, { id: itemId, type: itemType }],
					},
				},
			};
		});
	},
	removeItemFromProperty: (propertyId, itemId) => {
		set((state) => {
			const items = state.core.propertyItems[propertyId] || [];
			return {
				core: {
					...state.core,
					propertyItems: {
						...state.core.propertyItems,
						[propertyId]: items.filter((item) => item.id !== itemId),
					},
				},
			};
		});
	},
	clearPropertyItems: (propertyId) => {
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

	// --- Estado de Carga y Errores ---
	setLoading: (isLoading) =>
		set((state) => ({ core: { ...state.core, isLoading } })),
	setError: (error) => set((state) => ({ core: { ...state.core, error } })),

	// --- Acciones Asíncronas ---
	fetchProperty: async (id) => {
		get().setLoading(true);
		get().setError(null);
		try {
			const response = await fetchPropertyAction(id);
			if (response.success && response.data) {
				const extendedProperty = extendProperty(response.data);
				get().addProperty(extendedProperty);
				return extendedProperty;
			}
			const errorMsg =
				response.error || '❌ Error desconocido al buscar la propiedad.';
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return undefined;
		} catch (error) {
			const errorMsg = '❌ Error fatal al buscar la propiedad.';
			propertyLogger.error(errorMsg, { error });
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	fetchProperties: async () => {
		get().setLoading(true);
		get().setError(null);
		try {
			const response = await fetchPropertiesAction();
			if (response.success && response.data) {
				const extendedProperties = extendProperties(response.data);
				get().addProperties(extendedProperties);
				return extendedProperties;
			}
			const errorMsg =
				response.error || '❌ Error desconocido al obtener las propiedades.';
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return [];
		} catch (error) {
			const errorMsg = '❌ Error fatal al obtener las propiedades.';
			propertyLogger.error(errorMsg, { error });
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return [];
		} finally {
			get().setLoading(false);
		}
	},

	createProperty: async (data) => {
		get().setLoading(true);
		get().setError(null);
		try {
			const response = await createPropertyAction(data);
			if (response.success && response.data) {
				const extendedProperty = extendProperty(response.data);
				get().addProperty(extendedProperty);
				toastService.success(
					`La propiedad "${extendedProperty.name}" se ha creado.`,
				);
				return extendedProperty;
			}
			const errorMsg =
				response.error || '❌ Error desconocido al crear la propiedad.';
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return undefined;
		} catch (error) {
			const errorMsg = '❌ Error fatal al crear la propiedad.';
			propertyLogger.error(errorMsg, { error });
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	updateProperty: async (id, data) => {
		get().setLoading(true);
		get().setError(null);
		try {
			const response = await updatePropertyAction(id, data);
			if (response.success && response.data) {
				const extendedProperty = extendProperty(response.data);
				get().addProperty(extendedProperty);
				toastService.success(
					`La propiedad "${extendedProperty.name}" se ha actualizado.`,
				);
				return extendedProperty;
			}
			const errorMsg =
				response.error || '❌ Error desconocido al actualizar la propiedad.';
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return undefined;
		} catch (error) {
			const errorMsg = '❌ Error fatal al actualizar la propiedad.';
			propertyLogger.error(errorMsg, { error });
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	removeProperty: async (id) => {
		get().setLoading(true);
		get().setError(null);
		try {
			const propertyName = get().getProperty(id)?.name || id;
			const response = await deletePropertyAction(id);
			if (response.success) {
				get().deleteProperty(id);
				toastService.success(`La propiedad "${propertyName}" se ha eliminado.`);
				return true;
			}
			const errorMsg =
				response.error || '❌ Error desconocido al eliminar la propiedad.';
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return false;
		} catch (error) {
			const errorMsg = '❌ Error fatal al eliminar la propiedad.';
			propertyLogger.error(errorMsg, { error });
			get().setError(errorMsg);
			toastService.error(errorMsg);
			return false;
		} finally {
			get().setLoading(false);
		}
	},
});
