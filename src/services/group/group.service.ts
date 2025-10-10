/**
 * @file Servicio principal para la gestión de grupos (re-exports)
 * @module services/group
 */
// @ts-nocheck - Temporary suppression for implicit any parameter types

import { getGroupCardDataService, getRecentGroupMediaService } from './group-card';
import {
	createGroupService,
	deleteGroupService,
	getGroupService,
	getGroupStatsService,
	getGroupsByIdsService,
	updateGroupService,
} from './group-crud';
import { addItemToGroupService, removeItemFromGroupService } from './group-relations.service';
import { searchGroupsService } from './group-search.service';

export { getGroupCardDataService, getRecentGroupMediaService } from './group-card';
export {
	createGroupService,
	deleteGroupService,
	getGroupService,
	getGroupStatsService,
	getGroupsByIdsService,
	updateGroupService,
} from './group-crud';
// Re-exports para compatibilidad backward
export { createGroupError, GroupErrorCode } from './group-errors';
export { GROUP_EVENTS, notifyGroupChange } from './group-events';
export { addItemToGroupService, removeItemFromGroupService } from './group-relations.service';
export { searchGroupsService } from './group-search.service';

// Exportación de objetos agrupados para una interfaz más limpia
export const groupService = {
	// Operaciones principales
	get: getGroupService,
	getMany: getGroupsByIdsService,
	create: createGroupService,
	update: updateGroupService,
	delete: deleteGroupService,
	search: searchGroupsService,
	// Operaciones con elementos
	addItem: addItemToGroupService,
	removeItem: removeItemFromGroupService,
	// Operaciones adicionales
	getStats: getGroupStatsService,
	getRecentMedia: getRecentGroupMediaService,
	getCardData: getGroupCardDataService,
};

// Permitir el uso como importación predeterminada para mayor flexibilidad
export default groupService;
