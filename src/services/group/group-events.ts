/**
 * @file Sistema de eventos para grupos
 * @module services/group/group-events
 * @description Gestión de eventos y notificaciones para el servicio de grupos
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats/stats.service';
import type { GroupWithStats } from '@/types/entities/group/types';

const logger = serverLogger.withContext('GroupService');

/**
 * Constantes de eventos de grupos
 */
export const GROUP_EVENTS = {
	CREATED: 'group:created',
	UPDATED: 'group:updated',
	DELETED: 'group:deleted',
	ITEMS_ADDED: 'group:items:added',
	ITEMS_REMOVED: 'group:items:removed',
	STATS_UPDATED: 'group:stats:updated',
} as const;

/**
 * Notifica cambios en grupos al sistema central de eventos
 *
 * @param action - Tipo de acción realizada
 * @param group - Grupo afectado (completo o solo con ID)
 */
export const notifyGroupChange = async (
	action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
	group: GroupWithStats | { id: string }
): Promise<void> => {
	try {
		// Usar EventType válido del sistema central
		const eventType = 'update'; // Tipo válido para grupos según EventType

		// Emitir evento
		await emit({
			type: eventType,
			data: { action, group },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.GROUP_CHANGE);

		logger.info(`🔔 Notificado cambio en grupo: ${action}`, { groupId: group.id });
	} catch (error) {
		logger.error('Error notificando cambio de grupo:', { action, groupId: group.id, error });
	}
};
