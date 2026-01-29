/**
 * @deprecated Este archivo se mantiene solo para compatibilidad hacia atrás.
 * Use directamente las funciones desde `@/server/services/stats.service`
 * o los métodos de `OptimizedStatsService`.
 *
 * El StatsService legacy basado en apiClient ha sido eliminado.
 * El OptimizedStatsService proporciona la misma funcionalidad con mejor rendimiento.
 */

import { type EventType, emit } from '@/lib/server/events.server';

// Eventos de estadísticas
export const STATS_EVENTS = {
	VIEW_INCREMENTED: 'view_incremented',
	DOWNLOAD_INCREMENTED: 'download_incremented',
	STATS_UPDATED: 'stats_updated',
	COLLECTION_CHANGE: 'collection_change',
	TAG_CHANGE: 'tag_change',
	FAVORITE_CHANGE: 'favorite_change',
	STATS_UPDATE_NEEDED: 'stats_update_needed',
	FOLDER_CHANGE: 'folder_change',
	ALBUM_CHANGE: 'album_change',
	CHARACTER_CHANGE: 'character_change',
	PLACE_CHANGE: 'place_change',
	WORLD_ITEM_CHANGE: 'world_item_change',
	FILES_CHANGE: 'files_change',
	CONCEPT_CHANGE: 'concept_change',
	PROMPT_CHANGE: 'prompt_change',
	NOTE_CHANGE: 'note_change',
	GROUP_CHANGE: 'group_change',
	PROPERTY_CHANGE: 'property_change',
	WILDCARD_CHANGE: 'wildcard_change',
} as const;

// Mapeo de eventos internos a EventType compatible
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	// Eventos genéricos
	error: 'folder:error',
	// Mapeos específicos
	[STATS_EVENTS.VIEW_INCREMENTED]: 'update',
	[STATS_EVENTS.DOWNLOAD_INCREMENTED]: 'update',
	[STATS_EVENTS.STATS_UPDATED]: 'update',
	[STATS_EVENTS.COLLECTION_CHANGE]: 'collections:modified',
	[STATS_EVENTS.TAG_CHANGE]: 'tags:modified',
	[STATS_EVENTS.FAVORITE_CHANGE]: 'favorites:modified',
	[STATS_EVENTS.FOLDER_CHANGE]: 'folders:modified',
	[STATS_EVENTS.ALBUM_CHANGE]: 'albums:modified',
	[STATS_EVENTS.CHARACTER_CHANGE]: 'characters:modified',
	[STATS_EVENTS.PLACE_CHANGE]: 'places:modified',
	[STATS_EVENTS.WORLD_ITEM_CHANGE]: 'world-items:modified',
	[STATS_EVENTS.FILES_CHANGE]: 'files:modified',
	[STATS_EVENTS.PROMPT_CHANGE]: 'prompts:modified',
	[STATS_EVENTS.NOTE_CHANGE]: 'notes:modified',
	[STATS_EVENTS.PROPERTY_CHANGE]: 'properties:modified',
	[STATS_EVENTS.WILDCARD_CHANGE]: 'wildcards:modified',
} as const;

export type StatsEventType = (typeof STATS_EVENTS)[keyof typeof STATS_EVENTS];
export type StatsUpdateEvent =
	| 'collection_change'
	| 'tag_change'
	| 'favorite_change'
	| 'folder_change'
	| 'album_change'
	| 'character_change'
	| 'place_change'
	| 'world_item_change'
	| 'files_change'
	| 'concept_change'
	| 'prompt_change'
	| 'note_change';
export type StatsEvents = typeof STATS_EVENTS;

// Implementamos el nuevo sistema de eventos para estadísticas
export const statsEventEmitter = {
	// Omitimos nombres de parámetros para evitar errores de linter de "no utilizado"
	on: (_: string, __: (...args: unknown[]) => void) => {
		// Esta es una implementación mínima para mantener compatibilidad
		// No hace nada realmente, pero evita errores en código existente
	},
	off: (_: string, __: (...args: unknown[]) => void) => {
		// Esta es una implementación mínima para mantener compatibilidad
	},
	emit: (event: string, ...args: unknown[]) => {
		// Usamos serverEvents.emit en el fondo (promesa intencionalmente no esperada)
		emit({
			type: (EVENT_TYPE_MAPPING[event] || 'update') as EventType,
			data: args.length === 1 ? args[0] : args,
		});
		return true;
	},
	setMaxListeners: () => {
		// No hace nada, solo mantiene compatibilidad
	},
};

// Re-exportar la clase optimizada para compatibilidad
export { OptimizedStatsService as StatsService, OptimizedStatsService } from './optimized-stats.service';
export { optimizedStatsUtils } from './optimized-stats.service';

// Exportar instancia singleton
import { OptimizedStatsService } from './optimized-stats.service';
export const statsService = OptimizedStatsService.getInstance();
