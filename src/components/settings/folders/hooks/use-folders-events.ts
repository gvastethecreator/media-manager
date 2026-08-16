import { EventSourcePolyfill } from 'event-source-polyfill';
import { useCallback, useEffect, useRef } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { ErrorResponse, FolderResponse, FolderStats, ProcessStatus } from '@/types/folders';

const eventsLogger = clientLogger.withContext('FoldersEvents');
// ⛑️ OPTIMIZACIÓN: Throttle de logs para evitar saturar consola y bloquear UI
const lastFolderProgressRef: { current: { progress: number; phase?: string } } = { current: { progress: -1 } };
const lastGlobalProgressRef: { current: { progress: number; phase?: string } } = { current: { progress: -1 } };

// Helper para decidir si loggear
const folderProgressUtil = {
	should(prev: { progress: number; phase?: string }, progress?: number, phase?: string) {
		if (progress === undefined) {
			return false;
		}
		if (phase !== prev.phase || prev.progress === -1 || progress === 100) {
			return true;
		}
		return progress - prev.progress >= 5;
	},
	log(status: ProcessStatus) {
		eventsLogger.debug('📊 Progreso carpeta:', {
			p: status.progress,
			phase: status.phase,
			files: `${status.filesProcessed}/${status.totalFiles}`,
			folder: status.folderId,
		});
	},
};

function toastProgress(status: ProcessStatus) {
	if (status.progress === undefined || status.progress <= 0) {
		return;
	}
	const progressMessage = status.message || 'Processing...';
	const progressPercent = Math.round(status.progress);
	const now = Date.now();
	if (
		(progressPercent % 25 === 0 || progressPercent >= 95) &&
		(progressPercent !== lastToastPct || now - lastToastTime > TOAST_MIN_INTERVAL)
	) {
		toastService.info(`📊 Progreso: ${progressPercent}%`, {
			description: progressMessage,
			duration: 2000,
		});
		lastToastPct = progressPercent;
		lastToastTime = now;
	}
}
// Simple rate limit para toasts/logs de progreso
let lastToastPct = -1;
let lastToastTime = 0;
const TOAST_MIN_INTERVAL = 1500; // ms

// 🆕 Batching de eventos folder:progress
interface BufferedFolderProgress {
	lastUpdate: number;
	status: ProcessStatus;
}
const FOLDER_FLUSH_INTERVAL = 150; // ms ventana de coalescencia
const folderBufferRef: { current: Map<string, BufferedFolderProgress> } = { current: new Map() };
const flushScheduledRef = { current: false };
const lastFlushTimeRef = { current: 0 };

function scheduleFlush(cb: (batch: ProcessStatus[]) => void) {
	if (flushScheduledRef.current) {
		return;
	}
	flushScheduledRef.current = true;
	setTimeout(() => {
		flushScheduledRef.current = false;
		const now = Date.now();
		lastFlushTimeRef.current = now;
		const batch: ProcessStatus[] = [];
		for (const [key, entry] of folderBufferRef.current.entries()) {
			// Solo emitir si hay cambio significativo desde el último log global de carpeta
			batch.push(entry.status);
		}
		folderBufferRef.current.clear();
		if (batch.length) {
			cb(batch);
		}
	}, FOLDER_FLUSH_INTERVAL);
}

// Heurística de cambio mínimo para registrar en buffer (evita llenar buffer con pasos minúsculos)
function hasMeaningfulChange(prev: ProcessStatus | undefined, next: ProcessStatus): boolean {
	if (!prev) {
		return true;
	}
	if (next.phase && next.phase !== prev.phase) {
		return true;
	}
	const pPrev = prev.progress ?? -1;
	const pNext = next.progress ?? -1;
	if (pNext === 100 && pPrev !== 100) {
		return true;
	}
	return pNext - pPrev >= 2; // granularidad más fina que logs (5) pero evita spam
}

// Utilidad para insertar en buffer
function bufferFolderProgress(status: ProcessStatus) {
	// folderId puede venir undefined: usar 'unknown' para agrupar
	const key = status.folderId ?? 'unknown';
	const existing = folderBufferRef.current.get(key)?.status;
	if (!hasMeaningfulChange(existing, status)) {
		return;
	}
	folderBufferRef.current.set(key, { status, lastUpdate: Date.now() });
}

interface FolderEventsCallbacks {
	onComplete?: (data: FolderResponse) => void;
	onDirectoryDeleted?: (payload: { folderId?: string; path?: string }) => void;
	onError?: (error: ErrorResponse) => void;
	onProgress?: (status: ProcessStatus) => void;
	onReindexAllProgress?: (
		status: ProcessStatus & {
			currentFolder?: string;
		}
	) => void;
	onStats?: (stats: FolderStats) => void;
}

/**
 * Hook para gestionar los eventos del servidor relacionados con carpetas
 * FIXED: Usa refs para evitar loops infinitos en reconexiones SSE
 */
export function useFoldersEvents({
	onProgress,
	onError,
	onComplete,
	onStats,
	onReindexAllProgress,
	onDirectoryDeleted,
}: FolderEventsCallbacks) {
	const eventSourceRef = useRef<EventSourcePolyfill | null>(null);

	// 🟢 FIX: Usar refs para mantener callbacks estables y evitar reconexiones
	const callbacksRef = useRef({
		onProgress:
			onProgress ||
			(() => {
				/* no-op */
			}),
		onError:
			onError ||
			(() => {
				/* no-op */
			}),
		onComplete:
			onComplete ||
			(() => {
				/* no-op */
			}),
		onStats:
			onStats ||
			(() => {
				/* no-op */
			}),
		onReindexAllProgress:
			onReindexAllProgress ||
			(() => {
				/* no-op */
			}),
		onDirectoryDeleted:
			onDirectoryDeleted ||
			(() => {
				/* no-op */
			}),
	});

	// Actualizar refs cuando cambien las callbacks
	useEffect(() => {
		callbacksRef.current = {
			onProgress:
				onProgress ||
				(() => {
					/* no-op */
				}),
			onError:
				onError ||
				(() => {
					/* no-op */
				}),
			onComplete:
				onComplete ||
				(() => {
					/* no-op */
				}),
			onStats:
				onStats ||
				(() => {
					/* no-op */
				}),
			onReindexAllProgress:
				onReindexAllProgress ||
				(() => {
					/* no-op */
				}),
			onDirectoryDeleted:
				onDirectoryDeleted ||
				(() => {
					/* no-op */
				}),
		};
	}, [onProgress, onError, onComplete, onStats, onReindexAllProgress, onDirectoryDeleted]);

	// Manejador de progreso estable
	const handleProgress = useCallback((status: ProcessStatus) => {
		if (!status) {
			return;
		}
		// Bufferizamos eventos de carpeta para flush periódico
		bufferFolderProgress(status);
		scheduleFlush((batch) => {
			// Emitir una sola vez por batch hacia el callback externo
			for (const s of batch) {
				const prev = lastFolderProgressRef.current;
				if (folderProgressUtil.should(prev, s.progress, s.phase)) {
					folderProgressUtil.log(s);
					lastFolderProgressRef.current = { progress: s.progress ?? prev.progress, phase: s.phase };
				}
				try {
					toastProgress(s);
					callbacksRef.current.onProgress(s);
				} catch (error) {
					eventsLogger.error('Could not process progress event (batch):', error);
				}
			}
		});
	}, []);

	// Manejador de errores estable
	const handleError = useCallback((error: ErrorResponse) => {
		eventsLogger.error('❌ Could not process folder:', error);
		try {
			callbacksRef.current.onError(error);
		} catch (err) {
			eventsLogger.error('Error al manejar el evento de error:', err);
		}
	}, []);

	// Manejador de finalización estable
	const handleComplete = useCallback((data: FolderResponse) => {
		if (!data) {
			return;
		}

		eventsLogger.info('✅ Proceso completado vía evento complete:', {
			folderId: data.folderId,
			success: data.success,
		});

		try {
			callbacksRef.current.onComplete(data);
		} catch (error) {
			eventsLogger.error('Could not handle completion event:', error);
		}
	}, []);

	// Manejador de estadísticas estable
	const handleStats = useCallback((stats: FolderStats) => {
		eventsLogger.info('📊 Estadísticas actualizadas:', stats);
		callbacksRef.current.onStats(stats);
	}, []);

	// Manejador de reindex all estable
	const handleReindexAllProgress = useCallback((status: ProcessStatus & { currentFolder?: string }) => {
		const prev = lastGlobalProgressRef.current;
		if (folderProgressUtil.should(prev, status.progress, status.phase)) {
			eventsLogger.debug('🌍 Progreso global:', {
				p: status.progress,
				phase: status.phase,
				currentFolder: status.currentFolder,
			});
			lastGlobalProgressRef.current = { progress: status.progress ?? prev.progress, phase: status.phase };
		}
		callbacksRef.current.onReindexAllProgress(status);
	}, []);

	// 🟢 FIX: useEffect con dependencias estables - solo se ejecuta una vez
	useEffect(() => {
		eventsLogger.info('🎯 Suscribiéndose a eventos del servidor');

		try {
			// Crear conexión SSE
			const eventSource = new EventSourcePolyfill('/api/events/stream', {
				headers: {
					'Cache-Control': 'no-cache',
				},
			});

			eventSourceRef.current = eventSource;

			// Manejar conexión establecida
			eventSource.addEventListener('connected', () => {
				eventsLogger.info('✅ Conectado a eventos SSE');
			});

			// Handlers simplificados para bajar complejidad
			const onFolderProgress = (d: any) => {
				// Construimos el status sin forzar logs inmediatos; se procesará vía batch
				handleProgress({
					isProcessing: true,
					status: d.status || 'processing',
					phase: d.phase || 'processing',
					progress: Math.max(0, Math.min(100, d.progress || 0)),
					totalFiles: d.totalFiles || 0,
					filesProcessed: d.filesProcessed || 0,
					message: d.message,
					folderId: d.folderId,
					timestamp: d.timestamp || Date.now(),
				});
			};
			const onReindexAllProgressEvt = (d: any) => {
				eventsLogger.debug('📊 Progreso de reindexado global:', d);
				handleReindexAllProgress({
					// Usar el valor real del servidor; no forzar true
					isProcessing: Boolean(d.isProcessing),
					status: d.status || 'processing',
					phase: d.phase || 'processing',
					progress: Math.max(0, Math.min(100, d.progress || 0)),
					totalFiles: d.totalFiles || 0,
					filesProcessed: d.filesProcessed || 0,
					message: d.message,
					folderId: d.folderId,
					currentFolder: d.currentFolder,
					timestamp: d.timestamp || Date.now(),
				});
			};
			const onCompleted = (d: any) => handleComplete(d as FolderResponse);
			const onErrorEvt = (d: any) => handleError(d as ErrorResponse);
			const onStatsEvt = (d: any) => handleStats(d as FolderStats);
			const onReindexAllStartEvt = (d: any) => onReindexAllProgressEvt(d);
			const onReindexAllCompleteEvt = (d: any) => onReindexAllProgressEvt({ ...d, isProcessing: false, progress: 100 });
			const onDirectoryDeletedEvt = (d: any) => {
				try {
					callbacksRef.current.onDirectoryDeleted({ folderId: d.folderId, path: d.path });
				} catch (err) {
					eventsLogger.error('Error al manejar directory:deleted:', err);
				}
			};

			const processSSEEvent = (eventData: any) => {
				if (!eventData) {
					return;
				}
				const { type, data } = eventData;
				if (!data) {
					eventsLogger.debug('Evento sin data:', type);
					return;
				}
				const handlers: Record<string, (payload: any) => void> = {
					'folder:progress': onFolderProgress,
					'folder:reindexAll:progress': onReindexAllProgressEvt,
					'folder:complete': onCompleted,
					'folder:reindexAll:start': onReindexAllStartEvt,
					'folder:reindexAll:complete': onReindexAllCompleteEvt,
					'folder:error': onErrorEvt,
					'folder:stats': onStatsEvt,
					'directory:deleted': onDirectoryDeletedEvt,
				};
				const handler = handlers[type as keyof typeof handlers];
				if (handler) {
					handler(data);
				} else {
					eventsLogger.debug('🤷 Evento no manejado:', type);
				}
			};

			// Manejar eventos de folders (log reducido)
			eventSource.addEventListener('event', (event: any) => {
				try {
					const eventData = JSON.parse(event.data);
					// Log mínimo por evento
					eventsLogger.debug('evt', eventData.type);
					processSSEEvent(eventData);
				} catch (error) {
					eventsLogger.error('❌ Could not process SSE event:', error);
				}
			});

			// Manejar errores de conexión
			eventSource.addEventListener('error', (event) => {
				eventsLogger.error('❌ SSE connection error:', event);
			});

			// Manejar heartbeat
			eventSource.addEventListener('heartbeat', () => {
				eventsLogger.debug('💓 Heartbeat SSE recibido');
			});
		} catch (error) {
			eventsLogger.error('❌ Could not start SSE connection:', error);
		}

		// Cleanup
		return () => {
			eventsLogger.info('🧹 Limpiando suscripciones de eventos');
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
		};
	}, [handleProgress, handleError, handleComplete, handleStats, handleReindexAllProgress]); // Dependencias estables

	// También devolvemos funciones útiles para depuración
	return {
		emitManualProgress: (status: ProcessStatus) => {
			eventsLogger.info('🧪 Emitiendo evento de progreso manual:', status);
			handleProgress(status);
		},
		emitManualComplete: (data: FolderResponse) => {
			eventsLogger.info('🧪 Emitiendo evento de finalización manual:', data);
			handleComplete(data);
		},
		flushManual: () => {
			// Forzar flush inmediato (útil en tests)
			if (folderBufferRef.current.size === 0) {
				return;
			}
			const batch: ProcessStatus[] = [];
			for (const v of folderBufferRef.current.values()) {
				batch.push(v.status);
			}
			folderBufferRef.current.clear();
			for (const s of batch) {
				callbacksRef.current.onProgress(s);
			}
		},
	};
}
