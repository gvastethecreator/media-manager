/**
 * @file Servicio para la gestión de grupos (modularizado)
 * @module services/group
 */

import { serverLogger } from '@/lib/logger/server-logger';

// 📦 Re-exports desde módulos
export { GROUP_EVENTS, notifyGroupChange } from './events/group-events';
export { GroupErrorCode, createGroupError } from './types/group-service.types';
export type {
	GroupCreateInput,
	GroupSearchResult,
	GroupUpdateInput,
	GroupWithStats,
} from './types/group-service.types';

// 🔍 Funciones de consulta
export { getGroupService, getGroupsByIdsService, searchGroupsService } from './queries/group-queries';

// ✏️ Funciones de modificación (CRUD)
export { createGroupService, updateGroupService, deleteGroupService } from './mutations/group-mutations';

// 📦 Funciones de items
export { addItemToGroupService, removeItemFromGroupService } from './items/group-items';

// 📸 Funciones de media
export { getGroupImages, getRecentGroupMediaService, getGroupCardDataService } from './media/group-media';

// 🛠️ Funciones auxiliares de cálculo
export {
	calculateRarityLevel,
	calculateGroupPower,
	calculateHealth,
	calculateMana,
	calculateOrganizationLevel,
	determineOrganizationType,
} from './utils/group-helpers';

// Logger específico para el servicio de grupos
const logger = serverLogger.withContext('GroupService');

/**
 * Obtiene estadísticas de un grupo
 */
import { getGroupService } from './queries/group-queries';
import { GroupErrorCode, createGroupError } from './types/group-service.types';
import type { GroupWithStats } from './types/group-service.types';

export const getGroupStatsService = async (id: string): Promise<GroupWithStats | null> => {
	try {
		logger.info(`📊 Obteniendo estadísticas del grupo: ${id}`);

		// Reutilizar la lógica de getGroupService que ya está migrada
		const group = await getGroupService(id);

		if (!group) {
			throw createGroupError(`No se encontró el grupo con ID: ${id}`, GroupErrorCode.NOT_FOUND);
		}

		logger.info(`✅ Estadísticas obtenidas para grupo: ${id}`);
		return group;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas del grupo', { error, groupId: id });
		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}
		throw createGroupError(
			`Error al obtener estadísticas: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

// 📦 Exportar servicio agregado (para compatibilidad con código existente)
import {
	createGroupService,
	deleteGroupService,
	updateGroupService,
} from './mutations/group-mutations';
import {
	getGroupsByIdsService,
	searchGroupsService,
} from './queries/group-queries';
import { addItemToGroupService, removeItemFromGroupService } from './items/group-items';
import { getGroupCardDataService, getGroupImages, getRecentGroupMediaService } from './media/group-media';

export const groupService = {
	get: getGroupService,
	getByIds: getGroupsByIdsService,
	search: searchGroupsService,
	create: createGroupService,
	update: updateGroupService,
	delete: deleteGroupService,
	getStats: getGroupStatsService,
	addItem: addItemToGroupService,
	removeItem: removeItemFromGroupService,
	getImages: getGroupImages,
	getRecentMedia: getRecentGroupMediaService,
	getCardData: getGroupCardDataService,
};

export default groupService;
