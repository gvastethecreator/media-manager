/**
 * @file Exportación centralizada del servicio de grupos
 * @module services/group-service-export
 * @description Exporta las funcionalidades del servicio de grupos desde un punto centralizado
 */

// Importar desde el servicio principal
import groupService from './group/group.service';

// Re-exportar el servicio como valor por defecto
export default groupService;

// Exportar funciones individuales para uso específico
export const {
        get: getGroup,
        getMany: getGroups,
        create: createGroup,
        update: updateGroup,
        delete: deleteGroup,
        addItem: addItemToGroup,
        removeItem: removeItemFromGroup,
        getStats: getGroupStats,
        search: searchGroups,
} = groupService;
