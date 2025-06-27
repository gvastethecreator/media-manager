/**
 * @file Slice principal (core) para el store de Group.
 * @module store/entities/group/slices/core
 * @description Gestiona el estado y las acciones CRUD para la entidad Group.
 * @updated 2025-01-27
 */

import * as actions from '@/app/actions/groups/group.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast';
import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { GroupCoreActions, GroupCoreState, GroupStore } from '../types';

const logger = clientLogger.withContext('GroupCoreSlice');

const initialState: GroupCoreState = {
	groups: {},
	isLoading: false,
	error: null,
	lastUpdated: null,
};

export const createGroupCoreSlice: StateCreator<
	GroupStore,
	[['zustand/immer', never]],
	[],
	GroupCoreState & GroupCoreActions
> = (set, get) => ({
	...initialState,

	loadGroups: async () => {
		if (get().isLoading) return;
		set((state) => {
			state.isLoading = true;
			state.error = null;
		});

		try {
			const groups = await actions.getGroups();
			set((state) => {
				state.groups = groups.reduce(
					(acc, group) => {
						acc[group.id] = group;
						return acc;
					},
					{} as Record<string, (typeof groups)[0]>
				);
				state.lastUpdated = Date.now();
			});
			logger.info(`✅ ${groups.length} grupos cargados.`);
		} catch (error) {
			const errorMsg = '❌ Error al cargar los grupos.';
			logger.error(errorMsg, error);
			set((state) => {
				state.error = errorMsg;
			});
			toastService.error(errorMsg);
		} finally {
			set((state) => {
				state.isLoading = false;
			});
		}
	},

	createGroup: async (data) => {
		try {
			await actions.createGroup(data);
			toastService.success(`Grupo "${data.name}" creado.`);
			await get().loadGroups();
		} catch (error) {
			const errorMsg = `❌ Error al crear el grupo "${data.name}".`;
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	updateGroup: async (id, data) => {
		try {
			await actions.updateGroup(id, data);
			toastService.success(`Grupo actualizado.`);
			await get().loadGroups();
		} catch (error) {
			const errorMsg = '❌ Error al actualizar el grupo.';
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	deleteGroup: async (id) => {
		const groupName = get().groups[id]?.name ?? id;
		set(
			produce((draft) => {
				delete draft.groups[id];
			})
		);
		try {
			await actions.deleteGroup(id);
			toastService.success(`Grupo "${groupName}" eliminado.`);
		} catch (error) {
			const errorMsg = '❌ Error al eliminar el grupo.';
			logger.error(errorMsg, { id, error });
			toastService.error(errorMsg);
			await get().loadGroups(); // Revertir si falla
		}
	},
});
