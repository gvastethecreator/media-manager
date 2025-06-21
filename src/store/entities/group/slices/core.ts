/**
 * @file Slice principal para operaciones CRUD del store de grupos
 * @module store/entities/group/slices/core
 */

import {
    createGroup as createGroupAction,
    deleteGroup as deleteGroupAction,
    getGroup,
    getGroups,
} from '@/app/actions/groups/group.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import type { CreateGroupData, GroupWithStats } from '@/types/entities/group/types';
import type { StateCreator } from 'zustand';
import type { GroupStore } from '..';

const groupLogger = clientLogger.withContext('GroupStore');

// Slice para operaciones CRUD básicas
export interface GroupCoreSlice {
	// Getters
	getGroup: (id: string) => GroupWithStats | undefined;
	getGroups: () => GroupWithStats[];
	getGroupItems: (groupId: string) => Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>;

	// Operaciones
	addGroup: (group: GroupWithStats) => void;
	addGroups: (groups: GroupWithStats[]) => void;
	updateGroup: (id: string, data: Partial<GroupWithStats>) => void;
	deleteGroup: (id: string) => void;

	// Gestión de elementos
	addItemToGroup: (groupId: string, itemId: string, itemType: 'image' | 'video' | 'note' | 'tag') => void;
	removeItemFromGroup: (groupId: string, itemId: string) => void;
	clearGroupItems: (groupId: string) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchGroup: (id: string) => Promise<GroupWithStats | undefined>;
	fetchGroups: () => Promise<GroupWithStats[]>;
	createGroup: (data: CreateGroupData) => Promise<GroupWithStats | undefined>;
	removeGroup: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createGroupCoreSlice: StateCreator<GroupStore, [], [], GroupCoreSlice> = (set, get) => ({
	// Getters
	getGroup: (id) => {
		return get().core.groups[id];
	},

	getGroups: () => {
		const { groups } = get().core;
		return Object.values(groups);
	},

	getGroupItems: (groupId) => {
		return get().core.groupItems[groupId] || [];
	},

	// Operaciones
	addGroup: (group) => {
		groupLogger.info('✅ Añadiendo grupo al store:', group.name);
		set((state) => ({
			core: {
				...state.core,
				groups: {
					...state.core.groups,
					[group.id]: group,
				},
				lastUpdated: new Date(),
			},
		}));
	},

	addGroups: (groups) => {
		groupLogger.info('✅ Añadiendo múltiples grupos al store', groups.length);
		const groupsMap = groups.reduce(
			(acc, group) => {
				acc[group.id] = group;
				return acc;
			},
			{} as Record<string, GroupWithStats>
		);

		set((state) => ({
			core: {
				...state.core,
				groups: {
					...state.core.groups,
					...groupsMap,
				},
				lastUpdated: new Date(),
			},
		}));
	},

	updateGroup: (id, data) => {
		const group = get().core.groups[id];
		if (!group) {
			groupLogger.warn('⚠️ Intento de actualizar grupo inexistente:', id);
			return;
		}

		groupLogger.info('🔄 Actualizando grupo en el store:', id);
		set((state) => ({
			core: {
				...state.core,
				groups: {
					...state.core.groups,
					[id]: {
						...group,
						...data,
						updatedAt: new Date(),
					},
				},
				lastUpdated: new Date(),
			},
		}));
	},

	deleteGroup: (id) => {
		groupLogger.info('🗑️ Eliminando grupo del store:', id);
		set((state) => {
			const { [id]: _, ...restGroups } = state.core.groups;
			const { [id]: __, ...restGroupItems } = state.core.groupItems;

			return {
				core: {
					...state.core,
					groups: restGroups,
					groupItems: restGroupItems,
					lastUpdated: new Date(),
				},
			};
		});
	},

	// Gestión de elementos
	addItemToGroup: (groupId, itemId, itemType) => {
		groupLogger.info('➕ Añadiendo item al grupo:', { groupId, itemId, itemType });
		set((state) => {
			const currentItems = state.core.groupItems[groupId] || [];
			const existingItem = currentItems.find((item) => item.id === itemId);

			if (existingItem) {
				return state; // El item ya existe
			}

			return {
				core: {
					...state.core,
					groupItems: {
						...state.core.groupItems,
						[groupId]: [...currentItems, { id: itemId, type: itemType }],
					},
				},
			};
		});
	},

	removeItemFromGroup: (groupId, itemId) => {
		groupLogger.info('➖ Quitando item del grupo:', { groupId, itemId });
		set((state) => {
			const currentItems = state.core.groupItems[groupId] || [];
			return {
				core: {
					...state.core,
					groupItems: {
						...state.core.groupItems,
						[groupId]: currentItems.filter((item) => item.id !== itemId),
					},
				},
			};
		});
	},

	clearGroupItems: (groupId) => {
		groupLogger.info('🧹 Limpiando items del grupo:', groupId);
		set((state) => ({
			core: {
				...state.core,
				groupItems: {
					...state.core.groupItems,
					[groupId]: [],
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
	fetchGroup: async (id) => {
		groupLogger.info('🔍 Obteniendo grupo:', id);
		get().setLoading(true);

		try {
			const group = await getGroup(id);
			if (group) {
				get().addGroup(group);
			}
			return group;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al obtener el grupo';
			groupLogger.error('❌ Error al obtener grupo:', errorMessage);
			get().setError(errorMessage);
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	fetchGroups: async () => {
		groupLogger.info('🔍 Obteniendo todos los grupos');
		get().setLoading(true);

		try {
			const groups = await getGroups();
			get().addGroups(groups);
			return groups;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al obtener los grupos';
			groupLogger.error('❌ Error al obtener grupos:', errorMessage);
			get().setError(errorMessage);
			return [];
		} finally {
			get().setLoading(false);
		}
	},

	createGroup: async (data) => {
		groupLogger.info('✨ Creando nuevo grupo:', data.name);
		get().setLoading(true);

		try {
			const newGroup = await createGroupAction(data);
			get().addGroup(newGroup);
			toastService.show({
				title: 'Grupo Creado',
				message: `El grupo "${newGroup.name}" ha sido creado con éxito.`,
				type: 'success',
			});
			return newGroup;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al crear el grupo';
			groupLogger.error('❌ Error al crear grupo:', errorMessage);
			get().setError(errorMessage);
			toastService.show({
				title: 'Error al Crear',
				message: errorMessage,
				type: 'error',
			});
			return undefined;
		} finally {
			get().setLoading(false);
		}
	},

	removeGroup: async (id) => {
		groupLogger.info('🗑️ Solicitando eliminar grupo:', id);
		get().setLoading(true);

		try {
			await deleteGroupAction(id);
			get().deleteGroup(id);
			toastService.show({
				title: 'Grupo Eliminado',
				message: 'El grupo ha sido eliminado con éxito.',
				type: 'success',
			});
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el grupo';
			groupLogger.error('❌ Error al eliminar grupo:', errorMessage);
			get().setError(errorMessage);
			toastService.show({
				title: 'Error al Eliminar',
				message: errorMessage,
				type: 'error',
			});
			return false;
		} finally {
			get().setLoading(false);
		}
	},
});
