import {
	type GeneralStats,
	getImageStats,
	getSystemStats,
	incrementImageDownload,
	incrementImageView,
	invalidateStats,
} from '@/app/actions/stats/stats.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';

const statsLogger = serverLogger.withContext('StatsService');

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
// Esta será una implementación temporal para mantener compatibilidad con los servicios existentes
// mientras continuamos la migración
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
		// Usamos serverEvents.emit en el fondo
		void emit({
			type: (EVENT_TYPE_MAPPING[event] || 'update') as EventType,
			data: args.length === 1 ? args[0] : args,
		});
		return true;
	},
	setMaxListeners: () => {
		// No hace nada, solo mantiene compatibilidad
	},
};

// Versión migrada del servicio que no extiende de EventEmitter
export class StatsService {
	private static instance: StatsService;
	private isUpdating = false;
	private eventCallbacks = new Map<string, Set<CallableFunction>>();

	private constructor() {
		statsLogger.info('🚀 Inicializando StatsService');
	}

	static getInstance(): StatsService {
		if (!StatsService.instance) {
			StatsService.instance = new StatsService();
		}
		return StatsService.instance;
	}

	// Método privado para emitir eventos
	private async emitEvent(event: string, data: unknown): Promise<void> {
		// Emitir al sistema de eventos del servidor
		await emit({
			type: (EVENT_TYPE_MAPPING[event] || 'update') as EventType,
			data,
		});
	}

	async invalidateStats() {
		await invalidateStats();
	}

	async getGeneralStats(): Promise<GeneralStats> {
		try {
			const stats = await getSystemStats();
			if (!stats) {
				throw new Error('No se pudieron obtener las estadísticas del sistema');
			}
			await this.emitEvent(STATS_EVENTS.STATS_UPDATED, stats);
			return stats;
		} catch (error) {
			statsLogger.error('Error al obtener estadísticas generales', { error });
			await this.emitEvent('error', error);
			throw error;
		}
	}

	async getOrCreateImageStats(imageId: string) {
		try {
			return await getImageStats(imageId);
		} catch (error) {
			statsLogger.error('Error al obtener estadísticas de imagen', {
				error,
				imageId,
			});
			await this.emitEvent('error', error);
			throw error;
		}
	}

	async incrementViewCount(imageId: string) {
		try {
			const stats = await incrementImageView(imageId);
			await this.emitEvent(STATS_EVENTS.VIEW_INCREMENTED, { imageId, stats });
			return stats;
		} catch (error) {
			statsLogger.error('Error al incrementar vistas', { error, imageId });
			await this.emitEvent('error', error);
			throw error;
		}
	}

	async incrementDownloadCount(imageId: string) {
		try {
			const stats = await incrementImageDownload(imageId);
			await this.emitEvent(STATS_EVENTS.DOWNLOAD_INCREMENTED, { imageId, stats });
			return stats;
		} catch (error) {
			statsLogger.error('Error al incrementar descargas', { error, imageId });
			await this.emitEvent('error', error);
			throw error;
		}
	}
}

// Exportar la instancia del servicio
export const statsService = StatsService.getInstance();
