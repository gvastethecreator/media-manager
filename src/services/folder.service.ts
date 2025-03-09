import {
	type FolderResponse,
	createFolder as createFolderAction,
	deleteFolder as deleteFolderAction,
	getFolders as getFoldersAction,
	indexFolder as indexFolderAction,
	reindexFolder as reindexFolderAction,
} from '@/app/actions/folders/folder.actions';
import { clientEvents } from '@/lib/client/events.client';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { ExtendedProcessStatus, ProcessStatus } from '@/types/process';

const folderLogger = logger.withContext('FolderService');

export interface ErrorResponse {
	message: string;
	details?: string;
	code?: string;
	timestamp?: number;
}

export interface IndexCallbacks {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: ErrorResponse) => void;
	onComplete?: (data: FolderResponse) => void;
}

export type { ProcessStatus, ExtendedProcessStatus, FolderResponse };

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
	REINDEX_ALL_START = 'folder:reindex:all:start',
	REINDEX_ALL_PROGRESS = 'folder:reindex:all:progress',
	REINDEX_ALL_COMPLETE = 'folder:reindex:all:complete',
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
type StatsCallback = (stats: Record<string, unknown>) => void;

// Nueva implementación sin extender de EventEmitter
class FolderServiceClass {
	private static instance: FolderServiceClass;
	private operationsInProgress = new Map<string, boolean>();
	private globalProgress = new Map<string, ProcessStatus>();
	private startTimes = new Map<string, number>();
	private eventCallbacks = new Map<string, Set<CallableFunction>>();

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
		const callbacks = this.eventCallbacks.get(event);
		if (callbacks) {
			for (const callback of callbacks) {
				callback(...args);
			}
		}

		// Emitir eventos al sistema general según corresponda
		if (event === FOLDER_EVENTS.PROGRESS) {
			await emit({
				type: 'folder:progress',
				data: args[0],
			});
		} else if (event === FOLDER_EVENTS.ERROR) {
			await emit({
				type: 'folder:error',
				data: args[0],
			});
		} else if (event === FOLDER_EVENTS.COMPLETE) {
			await emit({
				type: 'folder:complete',
				data: args[0],
			});
		} else if (
			event === FOLDER_EVENTS.FOLDER_ADDED ||
			event === FOLDER_EVENTS.FOLDER_DELETED ||
			event === FOLDER_EVENTS.FOLDER_MODIFIED
		) {
			await emit({
				type: 'folders:modified',
				data: { action: event, entity: args[0] },
			});
		}
	}

	// Control de concurrencia mejorado
	private async withConcurrencyControl<T>(operation: string, fn: () => Promise<T>): Promise<T> {
		if (this.operationsInProgress.get(operation)) {
			throw new Error(`Operación ${operation} en progreso`);
		}

		this.operationsInProgress.set(operation, true);
		try {
			return await fn();
		} finally {
			this.operationsInProgress.delete(operation);
		}
	}

	// Métodos públicos
	async getFolders() {
		return this.withConcurrencyControl('getFolders', async () => {
			try {
				folderLogger.info('📂 Obteniendo lista de carpetas...');
				const folders = await getFoldersAction();

				folderLogger.info(`✅ ${folders.length} carpetas obtenidas`);
				await this.emitEvent(FOLDER_EVENTS.STATS, { totalFolders: folders.length });
				return folders;
			} catch (error) {
				const errorResponse: ErrorResponse = {
					message: error instanceof Error ? error.message : 'Error obteniendo carpetas',
					details: error instanceof Error ? error.stack : String(error),
					timestamp: Date.now(),
				};
				folderLogger.error('❌ Error getting folders:', errorResponse);
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				throw errorResponse;
			}
		});
	}

	async addFolder(path: string, callbacks?: IndexCallbacks) {
		return this.withConcurrencyControl('addFolder', async () => {
			try {
				folderLogger.info('📁 Agregando nueva carpeta:', path);

				const folder = await createFolderAction(path);
				folderLogger.info('✅ Carpeta creada:', folder);

				if (!folder || !folder.id) {
					throw { message: 'Respuesta inválida al crear carpeta' };
				}

				// Emitir eventos con el nuevo sistema
				await this.emitEvent(FOLDER_EVENTS.FOLDER_ADDED, folder);
				statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
				statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['FOLDER_CHANGE']);

				// Iniciar indexación
				return this.indexFolder(folder.id, callbacks);
			} catch (error) {
				const errorResponse: ErrorResponse = {
					message: error instanceof Error ? error.message : 'Error agregando carpeta',
					details: error instanceof Error ? error.stack : String(error),
					timestamp: Date.now(),
				};
				folderLogger.error('❌ Error adding folder:', errorResponse);
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				throw errorResponse;
			}
		});
	}

	private updateProgress(folderId: string, status: Partial<ProcessStatus>) {
		const currentProgress = this.globalProgress.get(folderId) || {};
		const startTime = this.startTimes.get(folderId) || Date.now();

		const updatedStatus: ProcessStatus = {
			...currentProgress,
			...status,
			timestamp: Date.now(),
			startTime,
		};

		// Calcular métricas adicionales
		if (updatedStatus.filesProcessed && updatedStatus.totalFiles) {
			const elapsedTime = (Date.now() - startTime) / 1000; // en segundos
			updatedStatus.processingSpeed = updatedStatus.filesProcessed / elapsedTime;

			const remainingFiles = updatedStatus.totalFiles - updatedStatus.filesProcessed;
			updatedStatus.estimatedTimeRemaining = remainingFiles / updatedStatus.processingSpeed;
		}

		this.globalProgress.set(folderId, updatedStatus);
		// Usar el nuevo sistema para emitir eventos de progreso
		this.emitEvent(FOLDER_EVENTS.PROGRESS, updatedStatus);
	}

	private clearProgress(folderId: string) {
		this.globalProgress.delete(folderId);
		this.startTimes.delete(folderId);
	}

	async indexFolder(id: string, callbacks?: IndexCallbacks) {
		return this.withConcurrencyControl(`indexFolder:${id}`, async () => {
			try {
				this.startTimes.set(id, Date.now());

				const initialStatus: ProcessStatus = {
					status: 'Iniciando indexación...',
					progress: 0,
					current: 0,
					total: 0,
					folderId: id,
					phase: 'scanning',
					startTime: Date.now(),
				};

				await this.emitEvent(FOLDER_EVENTS.INDEXING_START, initialStatus);
				this.updateProgress(id, initialStatus);
				callbacks?.onProgress?.(initialStatus);

				const result = await indexFolderAction(id);

				// Emitir eventos relevantes con el nuevo sistema
				await this.emitEvent(FOLDER_EVENTS.INDEXING_COMPLETE, result);
				await this.emitEvent(FOLDER_EVENTS.COMPLETE, result);
				await emit({
					type: 'files:modified',
					data: { action: 'index', folderId: id },
				});
				await emit({
					type: 'folders:modified',
					data: { action: 'index', folder: result.folder },
				});

				this.clearProgress(id);
				callbacks?.onComplete?.(result);
				return result;
			} catch (error) {
				const errorResponse: ErrorResponse = {
					message: error instanceof Error ? error.message : 'Error indexando carpeta',
					details: error instanceof Error ? error.stack : String(error),
					timestamp: Date.now(),
				};
				folderLogger.error('❌ Error indexing folder:', errorResponse);

				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				callbacks?.onError?.(errorResponse);

				this.clearProgress(id);
				throw errorResponse;
			}
		});
	}

	async reindexFolder(id: string, callbacks?: IndexCallbacks) {
		return this.withConcurrencyControl(`reindexFolder:${id}`, async () => {
			try {
				folderLogger.info('🔄 Reindexando carpeta:', id);
				this.startTimes.set(id, Date.now());

				// Notificar inicio del proceso
				const initialStatus: ProcessStatus = {
					status: 'Iniciando reindexación...',
					progress: 0,
					current: 0,
					total: 0,
					folderId: id,
					phase: 'scanning',
					startTime: Date.now(),
				};

				this.emitEvent(FOLDER_EVENTS.PROGRESS, initialStatus);
				this.updateProgress(id, initialStatus);
				callbacks?.onProgress?.(initialStatus);

				const result = await reindexFolderAction(id);

				// Emitir eventos relevantes
				this.emitEvent(FOLDER_EVENTS.COMPLETE, result);
				await emit({
					type: 'files:modified',
					data: { action: 'reindex', folderId: id },
				});
				await emit({
					type: 'folders:modified',
					data: { action: 'reindex', folder: result.folder },
				});

				this.clearProgress(id);
				callbacks?.onComplete?.(result);
				return result;
			} catch (error) {
				const errorResponse: ErrorResponse = {
					message: error instanceof Error ? error.message : 'Error reindexando carpeta',
					details: error instanceof Error ? error.stack : String(error),
					timestamp: Date.now(),
				};
				folderLogger.error('❌ Error reindexing folder:', errorResponse);
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				callbacks?.onError?.(errorResponse);
				this.clearProgress(id);
				throw errorResponse;
			}
		});
	}

	async deleteFolder(id: string) {
		return this.withConcurrencyControl(`deleteFolder:${id}`, async () => {
			try {
				folderLogger.info('🗑️ Eliminando carpeta:', id);
				await deleteFolderAction(id);

				// Emitir eventos
				await this.emitEvent(FOLDER_EVENTS.FOLDER_DELETED, { id });
				await emit({
					type: 'files:modified',
					data: { action: 'delete', folderId: id },
				});
				await emit({
					type: 'folders:modified',
					data: { action: 'delete', folder: { id } },
				});
				statsEventEmitter.emit(STATS_EVENTS.FOLDER_CHANGE);
				statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATE_NEEDED, ['FOLDER_CHANGE']);

				folderLogger.info('✅ Carpeta eliminada correctamente', { folderId: id });
			} catch (error) {
				const errorResponse: ErrorResponse = {
					message: error instanceof Error ? error.message : 'Error eliminando carpeta',
					details: error instanceof Error ? error.stack : String(error),
					timestamp: Date.now(),
				};
				folderLogger.error('❌ Error deleting folder:', errorResponse);
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				throw errorResponse;
			}
		});
	}

	async reindexAll() {
		return this.withConcurrencyControl('reindexAll', async () => {
			try {
				folderLogger.info('🔄 Iniciando reindexación de todas las carpetas');
				const folders = await this.getFolders();
				const totalFolders = folders.length;

				if (totalFolders === 0) {
					folderLogger.info('⚠️ No hay carpetas para reindexar');
					const emptyResult = {
						success: true,
						processedFolders: 0,
						totalFolders: 0,
						errors: [],
					};
					this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, emptyResult);
					return emptyResult;
				}

				// Notificar inicio de proceso
				folderLogger.info(`🔄 Reindexando ${totalFolders} carpetas`);
				this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_START, { totalFolders });

				let processedFolders = 0;
				const errors: Array<{ folderId: string; error: string }> = [];
				const startTime = Date.now();

				for (const folder of folders) {
					const folderStartTime = Date.now();
					try {
						folderLogger.info(`🔄 Reindexando carpeta: ${folder.name} (${processedFolders + 1}/${totalFolders})`);

						// Emisión de progreso global
						const progressStatus = {
							current: processedFolders,
							total: totalFolders,
							progress: Math.round((processedFolders / totalFolders) * 100),
							currentFolder: folder.name,
							phase: 'scanning',
							status: `Reindexando ${folder.name}...`,
							timestamp: Date.now(),
							elapsedTime: Date.now() - startTime,
						};

						this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, progressStatus);

						// Reindexar carpeta individual con callbacks
						await this.reindexFolder(folder.id, {
							onProgress: (status) => {
								// Crear un estado combinado con progreso global y local
								const updatedStatus = {
									...status,
									globalProgress: {
										current: processedFolders,
										total: totalFolders,
										progress: Math.round((processedFolders / totalFolders) * 100),
										elapsedTime: Date.now() - startTime,
									},
								};

								// Emisión de progreso detallado para la carpeta actual
								this.emitEvent(FOLDER_EVENTS.PROGRESS, updatedStatus);

								// Actualizar también el progreso global con detalles de la fase actual
								this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_PROGRESS, {
									...progressStatus,
									phase: status.phase,
									status: status.status,
									progress: Math.min(
										99,
										Math.round((processedFolders / totalFolders) * 100) + (status.progress / 100) * (100 / totalFolders)
									),
								});

								this.updateProgress(folder.id, updatedStatus);
							},
							onError: (error) => {
								folderLogger.error(`❌ Error en carpeta ${folder.name}:`, error);
								errors.push({
									folderId: folder.id,
									error: error.message,
								});
							},
							onComplete: (result) => {
								folderLogger.info(
									`✅ Carpeta ${folder.name} reindexada en ${Math.round((Date.now() - folderStartTime) / 1000)}s`
								);
								folderLogger.debug('Resultados:', result);
							},
						});

						processedFolders++;
					} catch (error) {
						folderLogger.error(`❌ Error reindexando carpeta ${folder.name}:`, error);
						errors.push({
							folderId: folder.id,
							error: error instanceof Error ? error.message : 'Error desconocido',
						});
					}
				}

				const totalTime = Math.round((Date.now() - startTime) / 1000);
				const completionStatus = {
					processedFolders,
					totalFolders,
					errors,
					progress: 100,
					status:
						errors.length > 0
							? `Completado con ${errors.length} errores en ${totalTime}s`
							: `Completado exitosamente en ${totalTime}s`,
					timestamp: Date.now(),
					elapsedTime: Date.now() - startTime,
				};

				folderLogger.info(
					`✅ Reindexación global completada: ${processedFolders}/${totalFolders} carpetas procesadas en ${totalTime}s`
				);
				if (errors.length > 0) {
					folderLogger.warn(`⚠️ Ocurrieron ${errors.length} errores durante la reindexación`);
				}

				this.emitEvent(FOLDER_EVENTS.REINDEX_ALL_COMPLETE, completionStatus);

				return {
					success: processedFolders === totalFolders && errors.length === 0,
					processedFolders,
					totalFolders,
					errors,
					elapsedTime: Date.now() - startTime,
				};
			} catch (error) {
				folderLogger.error('❌ Error en el proceso global de reindexación:', error);
				const errorResponse: ErrorResponse = {
					message: error instanceof Error ? error.message : 'Error reindexando todas las carpetas',
					details: error instanceof Error ? error.stack : String(error),
					timestamp: Date.now(),
				};
				await this.emitEvent(FOLDER_EVENTS.ERROR, errorResponse);
				throw errorResponse;
			}
		});
	}
}

// Instancia única del servicio de carpetas
export const folderService = FolderServiceClass.getInstance();

// Versión con debounce de getFolders
export const getFolders = debounce(() => folderService.getFolders(), 300);
