import type { Profile } from '@prisma/client';
import { create } from 'zustand';
import {
	activateProfile as activateProfileAction,
	createProfile as createProfileAction,
	deleteProfile as deleteProfileAction,
	getActiveProfile,
	getProfiles,
	updateProfile as updateProfileAction,
} from '../app/actions/profiles/profile.actions';
import { logger } from '../lib/logger/logger';
import type { ProfileCreate, ProfileUpdate, ProfileWithStats } from '../services/profile.service';
import { createStoreFactory } from './store.factory';
import type { BaseEntity, BaseStore, ExtendedStore } from './types';

// Estado extendido específico para Profile
interface ProfileState {
	activeProfile: ProfileWithStats | null;
}

const profileLogger = logger.withContext('ProfileStore');

// Store base usando StoreFactory
const useBaseProfileStore = createStoreFactory<ProfileWithStats, ProfileState, ProfileCreate, ProfileUpdate>(
	{
		name: 'profiles',
		logger: profileLogger,
		initialState: {
			items: [],
			loading: false,
			error: null,
			currentPage: 1,
			totalPages: 1,
			itemsPerPage: 50,
			selectedItem: null,
			selectedItems: [],
			lastSelectedItem: null,
		},
		actions: {
			beforeCreate: async (data) => {
				// Validar datos antes de crear
				if (!data.name?.trim()) {
					throw new Error('El nombre es requerido');
				}
				return {
					...data,
					emoji: data.emoji || '👤',
					color: data.color || '#3b82f6',
					theme: data.theme || 'system',
					language: data.language || 'es',
					isActive: false,
				};
			},
			afterCreate: async (profile) => {
				profileLogger.info('Perfil creado exitosamente', { profile });
			},
			beforeUpdate: async (_id, data) => {
				// Validar datos antes de actualizar
				if (data.name !== undefined && !data.name.trim()) {
					throw new Error('El nombre no puede estar vacío');
				}
				return data;
			},
			afterUpdate: async (profile) => {
				profileLogger.info('Perfil actualizado exitosamente', { profile });
			},
			beforeDelete: async (id) => {
				// Verificar que no sea el perfil activo
				const activeProfile = await getActiveProfile();
				if (activeProfile?.id === id) {
					throw new Error('No se puede eliminar el perfil activo');
				}
				profileLogger.info('Preparando eliminación de perfil', { id });
			},
			afterDelete: async (id) => {
				profileLogger.info('Perfil eliminado exitosamente', { id });
			},
		},
	},
	{
		getItems: getProfiles,
		createItem: createProfileAction,
		updateItem: updateProfileAction,
		deleteItem: deleteProfileAction,
	}
);

// Crear el store extendido
type ProfileStore = ExtendedStore<ProfileWithStats, ProfileState, ProfileCreate, ProfileUpdate>;

// Exportar el hook con el nombre anterior para mantener compatibilidad
export const useProfilesStore = create<ProfileStore>((set, _get) => {
	const baseStore = useBaseProfileStore();

	return {
		...baseStore,
		activeProfile: null,

		// Acciones adicionales específicas de profiles
		activateProfile: async (id: string) => {
			try {
				set({ loading: true, error: null });
				await activateProfileAction(id);
				const activeProfile = await getActiveProfile();
				set({ activeProfile, loading: false });
				profileLogger.info('Perfil activado exitosamente', { id });
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				set({ error: new Error(errorMessage), loading: false });
				profileLogger.error('Error al activar perfil:', { id, error });
			}
		},

		loadActiveProfile: async () => {
			try {
				set({ loading: true, error: null });
				const activeProfile = await getActiveProfile();
				set({ activeProfile, loading: false });
				profileLogger.info('Perfil activo cargado exitosamente');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				set({ error: new Error(errorMessage), loading: false });
				profileLogger.error('Error al cargar perfil activo:', { error });
			}
		},
	};
});
