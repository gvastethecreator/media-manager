/**
 * @file Sistema de eventos para grupos
 * @module services/group/events
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type { GroupWithStats } from '@/types/entities/group/types';

const logger = serverLogger.withContext('GroupService');

// Eventos del servicio
export const GROUP_EVENTS = {
	CREATED: 'group:created',
	UPDATED: 'group:updated',
	DELETED: 'group:deleted',
	ITEMS_ADDED: 'group:items:added',
	ITEMS_REMOVED: 'group:items:removed',
	STATS_UPDATED: 'group:stats:updated',
} as const;

/**
 * Notificación de cambios en grupos
 */
export const notifyGroupChange = async (
	action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
	group: GroupWithStats | { id: string }
) => {
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
};
