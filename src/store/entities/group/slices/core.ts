/**
 * @file Slice principal (core) para el store de Group.
 * @module store/entities/group/slices/core
 * @description Gestiona el estado y las acciones CRUD para la entidad Group.
 * @updated 2025-01-27
 */

import type { StateCreator } from 'zustand';
// Uso de cliente de API para grupos
import {
	createGroupInApi,
	deleteGroupFromApi,
	getGroupsFromApi,
	updateGroupInApi,
} from '@/lib/api/client/group.client';
import { clientLogger } from '@/lib/logger/client-logger';
import type { GroupCreateInput, GroupUpdateInput, GroupWithStats } from '@/types/entities/group';
import type { GroupCoreActions, GroupCoreState, GroupStore } from '../types';

export type GroupCoreSlice = GroupCoreState & GroupCoreActions;



const logger = clientLogger.withContext('GroupCoreSlice');

export const createGroupCoreSlice: StateCreator<
	GroupStore,
	[],
	[],
	GroupCoreSlice
> = (set, get) => ({
	// Estado inicial
	groups: [],
	isLoading: false,
	error: null,
	lastUpdated: null,

	loadGroups: async () => {
		set({ isLoading: true, error: null });
		try {
			const groups = await getGroupsFromApi();
			set({ groups: groups || [], lastUpdated: Date.now(), isLoading: false });
			logger.info(`✅ ${groups.length} grupos cargados.`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({ error: errorMessage, isLoading: false });
			logger.error('❌ Error al cargar grupos:', errorMessage);
		}
	},

	createGroup: async (data) => {
		try {
			const newGroup = await createGroupInApi(data);
			const currentGroups = get().groups;
			set({
				groups: [...currentGroups, newGroup],
				lastUpdated: Date.now(),
			});
			logger.info('✅ Grupo creado:', newGroup.name);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({ error: errorMessage });
			logger.error('❌ Error al crear grupo:', errorMessage);
			throw error;
		}
	},

	updateGroup: async (id, data) => {
		try {
			const updatedGroup = await updateGroupInApi(id, data);
			const currentGroups = get().groups;
			const groupIndex = currentGroups.findIndex(g => g.id === id);
			if (groupIndex !== -1) {
				const newGroups = [...currentGroups];
				newGroups[groupIndex] = updatedGroup;
				set({
					groups: newGroups,
					lastUpdated: Date.now(),
				});
			}
			logger.info('✅ Grupo actualizado:', updatedGroup.name);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({ error: errorMessage });
			logger.error('❌ Error al actualizar grupo:', errorMessage);
			throw error;
		}
	},

	deleteGroup: async (id) => {
		const currentGroups = get().groups;
		const groupName = currentGroups.find(g => g.id === id)?.name ?? id;
		set({ groups: currentGroups.filter(group => group.id !== id) });
		try {
			await deleteGroupFromApi(id);
			set({ lastUpdated: Date.now() });
			logger.info('✅ Grupo eliminado:', groupName);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			set({ error: errorMessage });
			logger.error('❌ Error al eliminar grupo:', errorMessage);
			throw error;
		}
	},
});
