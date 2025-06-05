/**
 * @file Slice principal para operaciones CRUD del store de grupos
 * @module store/entities/group/slices/core
 */

import { getGroup, getGroups } from '@/app/actions/groups/group.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { extendGroup, toPrismaGroup } from '@/transformers/group/serializers';
import type { CreateGroupData, Group, GroupBase, UpdateGroupData } from '@/types/entities/group';
import type { StateCreator } from 'zustand';
import type { GroupState } from '../types';

const groupLogger = clientLogger.withContext('GroupStore');

// Slice para operaciones CRUD básicas
export interface GroupCoreSlice {
	// Getters
	getGroup: (id: string) => Group | undefined;
	getGroups: () => Group[];
	getGroupItems: (groupId: string) => Array<{ id: string; type: 'image' | 'video' | 'note' | 'tag' }>;

	// Operaciones
	addGroup: (group: GroupBase) => void;
	addGroups: (groups: GroupBase[]) => void;
	updateGroup: (id: string, data: UpdateGroupData) => void;
	deleteGroup: (id: string) => void;

	// Gestión de elementos
	addItemToGroup: (groupId: string, itemId: string, itemType: 'image' | 'video' | 'note' | 'tag') => void;
	removeItemFromGroup: (groupId: string, itemId: string) => void;
	clearGroupItems: (groupId: string) => void;

	// Estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Acciones asíncronas
	fetchGroup: (id: string) => Promise<Group | undefined>;
	fetchGroups: () => Promise<Group[]>;
	createGroup: (data: CreateGroupData) => Promise<Group | undefined>;
	removeGroup: (id: string) => Promise<boolean>;
}

// Creador del slice
export const createGroupCoreSlice: StateCreator<GroupState, [], [], GroupCoreSlice> = (set, get) => ({
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
					[group.id]: extendGroup(group),
				},
				lastUpdated: new Date(),
			},
		}));
	},

	addGroups: (groups) => {
		groupLogger.info('✅ Añadiendo múltiples grupos al store', groups.length);
		const groupsMap = groups.reduce(
			(acc, group) => {
				acc[group.id] = extendGroup(group);
				return acc;
			},
			{} as Record<string, Group>
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
		set((state) => ({
			core: {
				...state.core,
				isLoading: true,
				error: null,
			},
		}));

		try {
			const group = await getGroup(id);
			if (group) {
				const extendedGroup = extendGroup(group as GroupBase);
				get().addGroup(extendedGroup);
				return extendedGroup;
			}
			return undefined;
		} catch (error) {
			groupLogger.error('❌ Error al obtener grupo:', error);
			set((state) => ({
				core: {
					...state.core,
					error: 'Error al obtener el grupo',
				},
			}));
			toastService.error('No se pudo cargar el grupo');
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

	fetchGroups: async () => {
		groupLogger.info('📋 Obteniendo listado de grupos');
		set((state) => ({
			core: {
				...state.core,
				isLoading: true,
				error: null,
			},
		}));

		try {
			const groups = await getGroups();
			const extendedGroups = extendGroups(groups as GroupBase[]);
			get().addGroups(extendedGroups);
			return extendedGroups;
		} catch (error) {
			groupLogger.error('❌ Error al obtener grupos:', error);
			set((state) => ({
				core: {
					...state.core,
					error: 'Error al obtener los grupos',
				},
			}));
			toastService.error('No se pudieron cargar los grupos');
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

	createGroup: async (data) => {
		groupLogger.info('📝 Creando nuevo grupo:', data.name);
		set((state) => ({
			core: {
				...state.core,
				isLoading: true,
				error: null,
			},
		}));

		try {
			// Mapear datos usando la función correcta
			const mappedData = toPrismaGroup(data);

			// Llamar al servidor (simulado)
			// En un entorno real, aquí llamaríamos a la API
			const createdGroup = {
				id: `group-${Date.now()}`,
				...mappedData,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Extender y añadir al store
			const extendedGroup = extendGroup(createdGroup as GroupBase);
			get().addGroup(extendedGroup);

			toastService.success(`Grupo "${data.name}" creado correctamente`);
			return extendedGroup;
		} catch (error) {
			groupLogger.error('❌ Error al crear grupo:', error);
			set((state) => ({
				core: {
					...state.core,
					error: 'Error al crear el grupo',
				},
			}));
			toastService.error('No se pudo crear el grupo');
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

	removeGroup: async (id) => {
		groupLogger.info('🗑️ Eliminando grupo:', id);
		set((state) => ({
			core: {
				...state.core,
				isLoading: true,
				error: null,
			},
		}));

		try {
			// Llamar al servidor (simulado)
			// En un entorno real, aquí llamaríamos a la API

			// Eliminar del store
			get().deleteGroup(id);

			toastService.success('Grupo eliminado correctamente');
			return true;
		} catch (error) {
			groupLogger.error('❌ Error al eliminar grupo:', error);
			set((state) => ({
				core: {
					...state.core,
					error: 'Error al eliminar el grupo',
				},
			}));
			toastService.error('No se pudo eliminar el grupo');
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
