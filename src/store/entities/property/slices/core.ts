/**
 * @file Slice principal (core) para el store de Property.
 * @module store/entities/property/slices/core
 * @description
 *   Gestiona el estado y las acciones CRUD para la entidad Property.
 *   Se comunica con las server actions para la persistencia de datos.
 */

import { clientLogger } from '@/lib/logger/client-logger';
// Se reemplaza el servicio del servidor por llamadas a la API REST
import {
    createPropertyInApi,
    deletePropertyFromApi,
    getPropertiesFromApi,
    updatePropertyInApi,
} from '@/lib/api/client/property.client';
import { toastService } from '@/lib/ui/toast';
import { PropertyWithStats } from '@/types/entities/property';
import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { PropertyCoreActions, PropertyCoreState, PropertyStore } from '../types';

const logger = clientLogger.withContext('PropertyCoreSlice');

const initialState: PropertyCoreState = {
	properties: {},
	isLoading: false,
	error: null,
	lastUpdated: null,
};

export const createPropertyCoreSlice: StateCreator<
	PropertyStore,
	[['zustand/immer', never]],
	[],
	PropertyCoreActions & {
		setProperties: (properties: PropertyWithStats[]) => void;
	}
> = (set, get) => ({
	...initialState,

	loadProperties: async () => {
		if (get().isLoading) return [];
		set(
			produce((draft) => {
				draft.isLoading = true;
				draft.error = null;
			})
		);
		try {
                        const properties = await getPropertiesFromApi();
			set(
				produce((draft) => {
					draft.properties = properties.reduce(
						(acc, p) => {
							acc[p.id] = p;
							return acc;
						},
						{} as Record<string, PropertyWithStats>
					);
					draft.lastUpdated = Date.now();
				})
			);
			logger.info(`✅ ${properties.length} propiedades cargadas.`);
			return properties;
		} catch (error) {
			const errorMsg = '❌ Error al cargar las propiedades.';
			logger.error(errorMsg, error);
			set(
				produce((draft) => {
					draft.error = errorMsg;
				})
			);
			toastService.error(errorMsg);
			return [];
		} finally {
			set(
				produce((draft) => {
					draft.isLoading = false;
				})
			);
		}
	},

	createProperty: async (data) => {
		if (get().isLoading) return null;
		set(
			produce((draft) => {
				draft.isLoading = true;
			})
		);
		try {
                        const newProperty = await createPropertyInApi(data);
			set(
				produce((draft) => {
					draft.properties[newProperty.id] = newProperty;
				})
			);
			toastService.success(`Propiedad "${newProperty.name}" creada.`);
			logger.info(`✅ Propiedad "${newProperty.name}" creada.`);
			return newProperty;
		} catch (error) {
			const errorMsg = `❌ Error al crear la propiedad "${data.name}".`;
			logger.error(errorMsg, error);
			set(
				produce((draft) => {
					draft.error = errorMsg;
				})
			);
			toastService.error(errorMsg);
			return null;
		} finally {
			set(
				produce((draft) => {
					draft.isLoading = false;
				})
			);
		}
	},

	updateProperty: async (id, data) => {
		set(
			produce((draft) => {
				const originalProperty = draft.properties[id];
				if (originalProperty) {
					// Optimistic update
					draft.properties[id] = { ...originalProperty, ...data, updatedAt: new Date() };
				}
			})
		);
		try {
                        const updatedProperty = await updatePropertyInApi(id, data);
			set(
				produce((draft) => {
					draft.properties[updatedProperty.id] = updatedProperty;
				})
			);
			toastService.success(`Propiedad "${updatedProperty.name}" actualizada.`);
			logger.info(`✅ Propiedad "${updatedProperty.name}" actualizada.`);
		} catch (error) {
			const errorMsg = '❌ Error al actualizar la propiedad.';
			logger.error(errorMsg, error);
			// Revert logic could be added here if needed
			toastService.error(errorMsg);
		}
	},

	deleteProperty: async (id) => {
		const propertyToDelete = get().properties[id];
		if (!propertyToDelete) return;

		set(
			produce((draft) => {
				delete draft.properties[id];
			})
		);
		try {
                        await deletePropertyFromApi(id);
			toastService.success(`Propiedad "${propertyToDelete.name}" eliminada.`);
			logger.info(`✅ Propiedad "${propertyToDelete.name}" eliminada.`);
		} catch (error) {
			const errorMsg = '❌ Error al eliminar la propiedad.';
			logger.error(errorMsg, { id, error });
			set(
				produce((draft) => {
					// Revert
					draft.properties[id] = propertyToDelete;
				})
			);
			toastService.error(errorMsg);
		}
	},

	setProperties: (properties) => {
		set(
			produce((draft) => {
				draft.properties = properties.reduce(
					(acc, p) => {
						acc[p.id] = p;
						return acc;
					},
					{} as Record<string, PropertyWithStats>
				);
			})
		);
	},
});
