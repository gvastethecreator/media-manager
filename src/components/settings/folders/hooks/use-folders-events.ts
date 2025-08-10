import { EventSourcePolyfill } from 'event-source-polyfill';
import { useCallback, useEffect, useRef } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { ErrorResponse, FolderResponse, FolderStats, ProcessStatus } from '@/types/folders';

const eventsLogger = clientLogger.withContext('FoldersEvents');
// Simple rate limit para toasts/logs de progreso
let lastToastPct = -1;
let lastToastTime = 0;
const TOAST_MIN_INTERVAL = 1500; // ms

interface FolderEventsCallbacks {
	onProgress?: (status: ProcessStatus) => void;
	onError?: (error: ErrorResponse) => void;
	onComplete?: (data: FolderResponse) => void;
	onStats?: (stats: FolderStats) => void;
	onReindexAllProgress?: (
		status: ProcessStatus & {
			currentFolder?: string;
		}
	) => void;
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
		};
	}, [onProgress, onError, onComplete, onStats, onReindexAllProgress]);

	// Manejador de progreso estable
	const handleProgress = useCallback((status: ProcessStatus) => {
		if (!status) {
			return;
		}

		eventsLogger.debug('📊 Progreso del proceso vía eventos:', status);

		try {
			// Mostrar notificación de progreso si hay información significativa
			if (status.progress !== undefined && status.progress > 0) {
				const progressMessage = status.message || 'Procesando...';
				const progressPercent = Math.round(status.progress);

				// Mostrar notificación cada 25% y con intervalo mínimo para evitar spam
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

			// Usar callback desde ref para evitar dependencias
			callbacksRef.current.onProgress(status);
		} catch (error) {
			eventsLogger.error('Error procesando evento de progreso:', error);
		}
	}, []);

	// Manejador de errores estable
	const handleError = useCallback((error: ErrorResponse) => {
		eventsLogger.error('❌ Error procesando carpeta:', error);
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
			eventsLogger.error('Error al manejar el evento de finalización:', error);
		}
	}, []);

	// Manejador de estadísticas estable
	const handleStats = useCallback((stats: FolderStats) => {
		eventsLogger.info('📊 Estadísticas actualizadas:', stats);
		callbacksRef.current.onStats(stats);
	}, []);

	// Manejador de reindex all estable
	const handleReindexAllProgress = useCallback((status: ProcessStatus & { currentFolder?: string }) => {
		eventsLogger.info('📊 Progreso de reindexado global:', status);
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
				handleProgress({
					isProcessing: true,
					status: d.status || 'processing',
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
					isProcessing: true,
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

			const processSSEEvent = (eventData: any) => {
				if (!eventData) {
					return;
				}
				const { type, data } = eventData;
				if (!data) {
					eventsLogger.debug('Evento sin data:', type);
					return;
				}
				if (type === 'folder:progress') {
					onFolderProgress(data);
					return;
				}
				if (type === 'folder:reindexAll:progress') {
					onReindexAllProgressEvt(data);
					return;
				}
				if (type === 'folder:completed') {
					onCompleted(data);
					return;
				}
				if (type === 'folder:error') {
					onErrorEvt(data);
					return;
				}
				if (type === 'folder:stats') {
					onStatsEvt(data);
					return;
				}
				eventsLogger.debug('🤷 Evento no manejado:', type);
			};

			// Manejar eventos de folders
			eventSource.addEventListener('event', (event: any) => {
				try {
					const eventData = JSON.parse(event.data);
					eventsLogger.info('📨 Evento SSE recibido:', eventData);
					processSSEEvent(eventData);
				} catch (error) {
					eventsLogger.error('❌ Error procesando evento SSE:', error);
				}
			});

			// Manejar errores de conexión
			eventSource.addEventListener('error', (event) => {
				eventsLogger.error('❌ Error en conexión SSE:', event);
			});

			// Manejar heartbeat
			eventSource.addEventListener('heartbeat', () => {
				eventsLogger.debug('💓 Heartbeat SSE recibido');
			});
		} catch (error) {
			eventsLogger.error('❌ Error iniciando conexión SSE:', error);
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
	};
}
