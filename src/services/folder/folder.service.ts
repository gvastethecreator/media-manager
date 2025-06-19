import type { ErrorResponse, FolderResponse, IndexCallbacks, ProcessStatus } from '@/app/actions/folders';
import { createFolder as createFolderAction, deleteFolder as deleteFolderAction } from '@/app/actions/folders';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats-service-export';
import type { FolderStats } from '@/types/entities/folder';

const folderLogger = serverLogger.withContext('FolderService');

export enum FOLDER_EVENTS {
	PROGRESS = 'folder:progress',
	ERROR = 'folder:error',
	COMPLETE = 'folder:complete',
	STATS = 'folder:stats',
	FOLDER_ADDED = 'folder:added',
	FOLDER_DELETED = 'folder:deleted',
	FOLDER_MODIFIED = 'folder:modified',
	INDEXING_START = 'folder:indexing:start',
	INDEXING_FILE = 'folder:indexing:file',
	INDEXING_ERROR = 'folder:indexing:error',
	INDEXING_COMPLETE = 'folder:indexing:complete',
	REINDEX_ALL_START = 'folder:reindexAll:start',
	REINDEX_ALL_PROGRESS = 'folder:reindexAll:progress',
	REINDEX_ALL_COMPLETE = 'folder:reindexAll:complete',
}

// Debounce function para promesas con tipos específicos
const debounce = <T, U extends unknown[]>(fn: (...args: U) => Promise<T>, ms = 300) => {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: U): Promise<T> => {
		return new Promise((resolve, reject) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				fn(...args)
					.then(resolve)
					.catch(reject);
			}, ms);
		});
	};
};

// Definir tipos para los callbacks
type ProgressCallback = (status: ProcessStatus) => void;
type ErrorCallback = (error: ErrorResponse) => void;
type CompleteCallback = (data: FolderResponse) => void;
type StatsCallback = (stats: FolderStats) => void;

/**
 * @file Servicio de Folder
 * @module services/folder
 * @description Implementación del servicio de carpetas
 *
 * # Arquitectura del Servicio de Carpetas
 *
 * Este servicio implementa un enfoque de clase singleton, manteniendo
 * compatibilidad con el sistema de eventos central de la aplicación.
 *
 * ## Estructura Principal
 *
 * ```
 * ├── Estado interno
 * ├── Funciones auxiliares internas
 * │   ├── addCallback, removeCallback, emitEvent
 * │   ├── withConcurrencyControl
 * │   └── updateProgress, clearProgress
 * ├── Funciones públicas expuestas
 * │   ├── getFolders, addFolder, indexFolder...
 * │   └── API de eventos: on, off, onProgress...
 * └── Exportación del servicio como singleton
 * ```
 *
 * ## Sistema de Eventos
 *
 * El servicio implementa un sistema de eventos propio, pero también se integra
 * con el sistema de eventos central de la aplicación. Los eventos incluyen:
 *
 * - Eventos de progreso (PROGRESS)
 * - Eventos de error (ERROR)
 * - Eventos de finalización (COMPLETE)
 * - Eventos específicos de operaciones (INDEXING_START, FOLDER_ADDED, etc.)
 *
 * ## Control de Concurrencia
 *
 * Mediante el método `withConcurrencyControl`, se asegura que no se ejecuten
 * múltiples instancias de la misma operación concurrentemente, evitando conflictos
 * y efectos secundarios inesperados.
 *
 * ## Manejo de Errores
 *
 * Los errores se manejan de forma consistente utilizando la estructura de errores
 * definida en las acciones del servidor.
 *
 * ## Procesamiento por Lotes
 *
 * Para operaciones con grandes conjuntos de datos (como indexación), el servicio
 * implementa el procesamiento por lotes con control de concurrencia y monitoreo.
 */

// Nueva implementación sin extender de EventEmitter
class FolderServiceClass {
	private static instance: FolderServiceClass;
	private operationsInProgress = new Map<string, boolean>();
	private globalProgress = new Map<string, ProcessStatus>();
	private startTimes = new Map<string, number>();
	private eventCallbacks = new Map<string, Set<CallableFunction>>();
	private operationPromises = new Map<string, Promise<any>>();

	private constructor() {
		folderLogger.info('🚀 Inicializando FolderService');
	}

	static getInstance(): FolderServiceClass {
		if (!FolderServiceClass.instance) {
			FolderServiceClass.instance = new FolderServiceClass();
		}
		return FolderServiceClass.instance;
	}

	// Método para limpiar todos los callbacks registrados
	offAll(): void {
		this.eventCallbacks.clear();
		folderLogger.info('🧹 Limpiados todos los callbacks de eventos');
	}

	// Método genérico para suscribirse a cualquier evento
	on(event: string, callback: CallableFunction): void {
		this.addCallback(event, callback);
	}

	// Método genérico para cancelar suscripción a cualquier evento
	off(event: string, callback: CallableFunction): void {
		this.removeCallback(event, callback);
	}

	onProgress(callback: ProgressCallback): void {
		this.addCallback(FOLDER_EVENTS.PROGRESS, callback);
	}

	offProgress(callback: ProgressCallback): void {
		this.removeCallback(FOLDER_EVENTS.PROGRESS, callback);
	}

	onError(callback: ErrorCallback): void {
		this.addCallback(FOLDER_EVENTS.ERROR, callback);
	}

	offError(callback: ErrorCallback): void {
		this.removeCallback(FOLDER_EVENTS.ERROR, callback);
	}

	onComplete(callback: CompleteCallback): void {
		this.addCallback(FOLDER_EVENTS.COMPLETE, callback);
	}

	offComplete(callback: CompleteCallback): void {
		this.removeCallback(FOLDER_EVENTS.COMPLETE, callback);
	}

	onStats(callback: StatsCallback): void {
		this.addCallback(FOLDER_EVENTS.STATS, callback);
	}

	offStats(callback: StatsCallback): void {
		this.removeCallback(FOLDER_EVENTS.STATS, callback);
	}

	// Métodos auxiliares para gestionar callbacks
	private addCallback(event: string, callback: CallableFunction): void {
		if (!this.eventCallbacks.has(event)) {
			this.eventCallbacks.set(event, new Set());
		}
		this.eventCallbacks.get(event)?.add(callback);
	}

	private removeCallback(event: string, callback: CallableFunction): void {
		this.eventCallbacks.get(event)?.delete(callback);
	}

	// Método para emitir eventos - reemplaza this.emit de EventEmitter
	private async emitEvent(event: string, ...args: unknown[]): Promise<void> {
		try {
			// Obtener los callbacks para este evento
			const callbacks = this.eventCallbacks.get(event);
			if (callbacks && callbacks.size > 0) {
				// Invocar cada callback
				for (const callback of callbacks) {
					try {
						if (typeof callback === 'function') {
							await callback(...args);
						}
					} catch (callbackError) {
						// Intentar loguear de forma más segura, extrayendo mensaje y stack si es posible
						const errorMessage = callbackError instanceof Error ? callbackError.message : String(callbackError);
						const errorStack = callbackError instanceof Error ? callbackError.stack : undefined;
						folderLogger.error(`Error en callback de evento ${event}: ${errorMessage}`, {
							stack: errorStack,
							originalArgs: args,
						});
					}
				}
			}

			// Mapeo de eventos locales a eventos del sistema central
			const serverEventType = event as EventType;
			const allowedServerEvents = Object.values(FOLDER_EVENTS) as string[];

			// Verificar si el evento es compatible con EventType
			const eventTypeValues: EventType[] = [
				'create',
				'update',
				'delete',
				'addImage',
				'removeImage',
				'collections:modified',
				'tags:modified',
				'albums:modified',
				'prompts:modified',
				'notes:modified',
				'characters:modified',
				'places:modified',
				'objects:modified',
				'world-items:modified',
				'favorites:modified',
				'images:modified',
				'files:modified',
				'folders:modified',
				'folder:progress',
				'folder:error',
				'folder:complete',
				'folder:stats',
				'folder:reindexAll:start',
				'folder:reindexAll:progress',
				'folder:reindexAll:complete',
				'uploaded-image:created',
				'uploaded-image:updated',
				'uploaded-image:deleted',
				'uploaded-images:changed',
			];

			// Solo emitir si el evento es un EventType válido
			if (eventTypeValues.includes(serverEventType)) {
				try {
					await emit({
						type: serverEventType,
						data: args[0],
					});
				} catch (emitError) {
					folderLogger.error(`Error al emitir evento ${event} al sistema central:`, emitError);
				}
			}
		} catch (error) {
			folderLogger.error(`Error fatal en emitEvent para ${event}:`, error);
		}
	}

	// Control de concurrencia mejorado
	private async withConcurrencyControl<T>(operation: string, fn: () => Promise<T>): Promise<T> {
		if (this.operationsInProgress.get(operation)) {
			folderLogger.warn(`La operación "${operation}" ya está en progreso.`);
			// Devolver la promesa existente para que el llamante pueda esperar a que termine
			return this.operationPromises.get(operation) as Promise<T>;
		}

		this.operationsInProgress.set(operation, true);
		const promise = fn();
		this.operationPromises.set(operation, promise);

		try {
			return await promise;
		} finally {
			this.operationsInProgress.set(operation, false);
			this.operationPromises.delete(operation);
		}
	}

	// Métodos públicos
	async getFolders() {
		return this.withConcurrencyControl('getFolders', async () => {
			try {
				folderLogger.info('📁 Obteniendo carpetas...');
				const getFoldersAction = await import('@/app/actions/folders/get.actions').then((mod) => mod.getFolders);
				const folders = await getFoldersAction();
				folderLogger.info(`✅ ${folders.length} carpetas obtenidas`);
				return folders;
			} catch (error) {
				const isCriticalError =
					error instanceof Error &&
					!(error.message.includes('Operación') && error.message.includes('en progreso')) &&
					!error.message.includes('ECONNREFUSED') &&
					!error.message.includes('network') &&
					!error.message.includes('timeout');

				const errorResponse: ErrorResponse = {
					message: error instanceof Error ? error.message : 'Error desconocido al obtener carpetas',
					details: error instanceof Error ? error.stack : String(error),
					timestamp: Date.now(),
					type: isCriticalError ? 'critical' : 'transient',
				};

				// Solo usar error para errores críticos, usar warn para no críticos
				if (isCriticalError) {
					folderLogger.error('❌ Error getting folders:', errorResponse);
				} else {
					folderLogger.warn('⚠️ Problema al obtener carpetas:', errorResponse);
				}

				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				throw errorResponse;
			}
		});
	}

	async addFolder(path: string, callbacks?: IndexCallbacks) {
		return this.withConcurrencyControl(`addFolder:${path}`, async () => {
			if (callbacks?.onStart) callbacks.onStart({ status: 'starting' });
			await this.emitEvent(FOLDER_EVENTS.INDEXING_START, { path });

			try {
				const response = await createFolderAction(path);

				if ('error' in response) {
					await this.emitEvent(FOLDER_EVENTS.ERROR, response);
					if (callbacks?.onError) callbacks.onError(response);
					return;
				}

				await this.emitEvent(FOLDER_EVENTS.FOLDER_ADDED, response);
				await this.emitEvent(FOLDER_EVENTS.COMPLETE, response);

				if (response.data) {
					statsEventEmitter.emit(STATS_EVENTS.REQUEST_STATS_UPDATE, ['folders']);
					await this.indexFolder(response.data.id, callbacks);
				}

				return response.data;
			} catch (error) {
				const errorResponse =
					error instanceof Error ? { message: error.message } : { message: 'Error desconocido' };
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				if (callbacks?.onError) callbacks.onError(errorResponse);
			}
		});
	}

	private updateProgress(folderId: string, status: Partial<ProcessStatus>) {
		const currentStatus = this.globalProgress.get(folderId) || {
			status: 'idle',
			progress: 0,
			total: 0,
			current: 0,
		};
		const newStatus = { ...currentStatus, ...status, folderId };
		this.globalProgress.set(folderId, newStatus);
		this.emitEvent(FOLDER_EVENTS.PROGRESS, newStatus);
	}

	private clearProgress(folderId: string) {
		this.globalProgress.delete(folderId);
		this.startTimes.delete(folderId);
	}

	async indexFolder(id: string, callbacks?: IndexCallbacks) {
		return this.withConcurrencyControl(`index:${id}`, async () => {
			const { getFolder: getFolderAction, indexFile: indexFileAction } = await import(
				'@/app/actions/folders'
			);
			const response = await getFolderAction(id);
			if ('error' in response || !response.data) {
				const error = 'error' in response ? response : { message: 'Carpeta no encontrada' };
				await this.emitEvent(FOLDER_EVENTS.ERROR, error);
				if (callbacks?.onError) callbacks.onError(error);
				this.clearProgress(id);
				return;
			}

			const folder = response.data;
			const total = folder.imageCount ?? 0;
			this.startTimes.set(id, Date.now());

			if (callbacks?.onStart) callbacks.onStart({ total });
			this.updateProgress(id, {
				status: 'Iniciando indexación...',
				total,
				current: 0,
				progress: 0,
			});

			const BATCH_SIZE = 10;
			let processedCount = 0;
			const images = folder.images || [];

			for (let i = 0; i < images.length; i += BATCH_SIZE) {
				const batch = images.slice(i, i + BATCH_SIZE);
				const promises = batch.map((image) =>
					indexFileAction(image.id).then((result) => {
						processedCount++;
						this.updateProgress(id, {
							status: `Indexando ${processedCount}/${total}...`,
							current: processedCount,
							progress: (processedCount / total) * 100,
							currentFile: image.path,
						});
						if (callbacks?.onFile) callbacks.onFile(image.path, 'indexed');
						return result;
					}),
				);

				await Promise.all(promises);
			}

			const duration = (Date.now() - (this.startTimes.get(id) || Date.now())) / 1000;
			const finalStatus: ProcessStatus = {
				status: 'Completado',
				progress: 100,
				total,
				current: total,
				duration,
			};

			this.updateProgress(id, finalStatus);
			await this.emitEvent(FOLDER_EVENTS.INDEXING_COMPLETE, { folderId: id, ...finalStatus });

			if (callbacks?.onComplete) callbacks.onComplete({ ...folder, status: 'indexed' });
			statsEventEmitter.emit(STATS_EVENTS.REQUEST_STATS_UPDATE, ['folders', 'images']);

			this.clearProgress(id);
		});
	}

	async reindexFolder(id: string, callbacks?: IndexCallbacks) {
		return this.withConcurrencyControl(`reindex:${id}`, async () => {
			const { reindexFolder: reindexFolderAction } = await import('@/app/actions/folders');
			this.updateProgress(id, { status: 'starting' });
			try {
				const response = await reindexFolderAction(id);

				if ('error' in response) {
					await this.emitEvent(FOLDER_EVENTS.ERROR, response);
					if (callbacks?.onError) callbacks.onError(response);
					return;
				}

				if (response.data) {
					await this.listenToReindexingEvents(response.data.id, callbacks);
				}
			} catch (error) {
				const errorResponse =
					error instanceof Error ? { message: error.message } : { message: 'Error desconocido' };
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				if (callbacks?.onError) callbacks.onError(errorResponse);
			}
		});
	}

	private async listenToReindexingEvents(folderId: string, callbacks?: IndexCallbacks) {
		const endpoint = `/api/folders/reindex/${folderId}/events`;
		const eventSource = new EventSource(endpoint);

		const progressHandler = (status: ProcessStatus) => {
			this.updateProgress(folderId, status);
			if (callbacks?.onProgress) callbacks.onProgress(status);
		};

		const errorHandler = (error: ErrorResponse) => {
			this.emitEvent(FOLDER_EVENTS.ERROR, error);
			if (callbacks?.onError) callbacks.onError(error);
			eventSource.close();
			this.clearProgress(folderId);
		};

		const completeHandler = (data: FolderResponse) => {
			this.emitEvent(FOLDER_EVENTS.COMPLETE, data);
			if (callbacks?.onComplete) callbacks.onComplete(data);
			eventSource.close();
			this.clearProgress(folderId);
			statsEventEmitter.emit(STATS_EVENTS.REQUEST_STATS_UPDATE, ['folders', 'images']);
		};

		eventSource.addEventListener('progress', (event) => {
			try {
				const data = JSON.parse(event.data);
				progressHandler(data);
			} catch (e) {
				folderLogger.error('Error parseando evento de progreso', e);
			}
		});

		eventSource.addEventListener('error', (event) => {
			try {
				const data = JSON.parse(event.data);
				errorHandler(data);
			} catch (e) {
				folderLogger.error('Error parseando evento de error', e);
				errorHandler({ message: 'Error de comunicación con el servidor' });
			}
		});

		eventSource.addEventListener('complete', (event) => {
			try {
				const data = JSON.parse(event.data);
				completeHandler(data);
			} catch (e) {
				folderLogger.error('Error parseando evento de completado', e);
				errorHandler({ message: 'Error de comunicación al finalizar' });
			}
		});

		eventSource.onerror = () => {
			errorHandler({ message: 'Conexión perdida con el servidor de eventos' });
		};

		if (callbacks?.onStart) {
			callbacks.onStart({ status: 'Reindexación iniciada...' });
		}
	}

	async deleteFolder(id: string) {
		return this.withConcurrencyControl(`delete:${id}`, async () => {
			folderLogger.info(`Eliminando carpeta con ID: ${id}`);
			try {
				const response = await deleteFolderAction(id);

				if ('error' in response) {
					await this.emitEvent(FOLDER_EVENTS.ERROR, response);
					return response;
				}

				await this.emitEvent(FOLDER_EVENTS.FOLDER_DELETED, { id });
				statsEventEmitter.emit(STATS_EVENTS.REQUEST_STATS_UPDATE, ['folders']);

				folderLogger.info(`Carpeta ${id} eliminada correctamente`);
				return { success: true };
			} catch (error) {
				const errorResponse = {
					message: error instanceof Error ? error.message : 'Error desconocido al eliminar carpeta',
				};
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				return { error: errorResponse };
			}
		});
	}

	async reindexAll() {
		return this.withConcurrencyControl('reindexAll', async () => {
			const { reindexAllFolders } = await import('@/app/actions/folders');
			folderLogger.info('Iniciando reindexación de todas las carpetas');
			try {
				const response = await reindexAllFolders();
				this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_START, {});
				return response;
			} catch (error) {
				const errorResponse = {
					message: error instanceof Error ? error.message : 'Error desconocido al reindexar todo',
				};
				this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				throw error;
			}
		});
	}

	async updateFolder(id: string, data: Partial<import('@/types/entities/folder').Folder>) {
		return this.withConcurrencyControl(`update:${id}`, async () => {
			const { updateFolder: updateFolderAction } = await import('@/app/actions/folders');
			folderLogger.info(`Actualizando carpeta con ID: ${id}`);
			try {
				const response = await updateFolderAction(id, data);

				if ('error' in response) {
					await this.emitEvent(FOLDER_EVENTS.ERROR, response);
					return response;
				}

				await this.emitEvent(FOLDER_EVENTS.FOLDER_MODIFIED, response);
				statsEventEmitter.emit(STATS_EVENTS.REQUEST_STATS_UPDATE, ['folders']);

				folderLogger.info(`Carpeta ${id} actualizada correctamente`);
				return response;
			} catch (error) {
				const errorResponse = {
					message: error instanceof Error ? error.message : 'Error desconocido al actualizar carpeta',
				};
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				return { error: errorResponse };
			}
		});
	}
}

// Instancia única del servicio de carpetas
export const folderService = FolderServiceClass.getInstance();

// Versión con debounce de getFolders
export const getFolders = debounce(() => folderService.getFolders(), 300);
