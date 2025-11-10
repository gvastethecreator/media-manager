/**
 * @file Sistema de eventos para personajes
 * @module services/character/character-events
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type { CharacterWithStats } from '@/types/entities/character';

const logger = serverLogger.withContext('CharacterEvents');

/**
 * Eventos del servicio de personajes
 */
export const CHARACTER_EVENTS = {
	CREATED: 'character:created',
	UPDATED: 'character:updated',
	DELETED: 'character:deleted',
	STATS_UPDATED: 'character:stats:updated',
} as const;

/**
 * Notifica cambios en los personajes a través del sistema de eventos
 */
export const notifyCharacterChange = async (
	action: 'create' | 'update' | 'delete',
	character: CharacterWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;
		switch (action) {
			case 'create':
				eventType = CHARACTER_EVENTS.CREATED;
				break;
			case 'update':
				eventType = CHARACTER_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = CHARACTER_EVENTS.DELETED;
				break;
			default:
				eventType = 'character:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: 'characters:modified',
			data: { action, character },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.CHARACTER_CHANGE);

		logger.info(`🔔 Notificado cambio en personaje: ${action}`, { characterId: character.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en personaje: ${action}`, { error, characterId: character.id });
	}
};
