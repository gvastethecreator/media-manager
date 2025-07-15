import { EventSourcePolyfill } from 'event-source-polyfill';
import { useCallback, useEffect, useRef } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { ErrorResponse, FolderResponse, FolderStats, ProcessStatus } from '@/types/folders';

const eventsLogger = clientLogger.withContext('FoldersEvents');

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
 */
export function useFoldersEvents({
	onProgress = () => {},
	onError = () => {},
	onComplete = () => {},
	onStats = () => {},
	onReindexAllProgress = () => {},
}: FolderEventsCallbacks) {
	// Manejador de progreso (como respaldo al polling)
	const handleProgress = useCallback(
		(status: ProcessStatus) => {
			if (!status) {
				return;
			}

			// Este método ahora sólo actúa como respaldo, ya que el polling es la fuente principal
			eventsLogger.info('📊 Progreso del proceso vía eventos:', status);

			try {
				// Mostrar notificación de progreso si hay información significativa
				if (status.progress !== undefined && status.progress > 0) {
					const progressMessage = status.message || 'Procesando...';
					const progressPercent = Math.round(status.progress);

					// Solo mostrar notificación cada 25% para evitar spam
					if (progressPercent % 25 === 0 || progressPercent >= 90) {
						toastService.info(`📊 Progreso: ${progressPercent}%`, {
							description: progressMessage,
							duration: 2000, // Duración corta para no saturar
						});
					}
				}

				// Asegurarnos de que el evento llegue al manejador principal
				onProgress(status);
			} catch (error) {
				eventsLogger.error('Error procesando evento de progreso:', error);
			}
		},
		[onProgress]
	);

	// Manejador de errores
	const handleError = useCallback(
		(error: ErrorResponse) => {
			eventsLogger.error('❌ Error procesando carpeta:', error);

			try {
				onError(error);
			} catch (err) {
				eventsLogger.error('Error al manejar el evento de error:', err);
			}
		},
		[onError]
	);

	// Manejador de finalización
	const handleComplete = useCallback(
		(data: FolderResponse) => {
			if (!data) {
				return;
			}

			eventsLogger.info('✅ Proceso completado vía evento complete:', {
				folderId: data.folderId,
				success: data.success,
			});

			try {
				onComplete(data);
			} catch (error) {
				eventsLogger.error('Error al manejar el evento de finalización:', error);
			}
		},
		[onComplete]
	);

	// Manejador de estadísticas
	const handleStats = useCallback(
		(stats: FolderStats) => {
			eventsLogger.info('📊 Estadísticas actualizadas:', stats);
			onStats(stats);
		},
		[onStats]
	);

	const eventSourceRef = useRef<EventSourcePolyfill | null>(null);

	// Subscribirse a los eventos del servicio
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

			// Manejar eventos de folders
			eventSource.addEventListener('event', (event: MessageEvent) => {
				try {
					const eventData = JSON.parse(event.data);
					eventsLogger.info('📨 Evento SSE recibido:', eventData);

					// Manejar diferentes tipos de eventos
					switch (eventData.type) {
						case 'folder:progress':
							if (eventData.data) {
								handleProgress({
									status: eventData.data.status || 'processing',
									progress: eventData.data.progress || 0,
									totalFiles: eventData.data.totalFiles || 0,
									filesProcessed: eventData.data.filesProcessed || 0,
									message: eventData.data.message,
									folderId: eventData.data.folderId,
								});
							}
							break;

						case 'folder:reindexAll:progress':
							if (eventData.data) {
								eventsLogger.info('📊 Progreso de reindexado global:', eventData.data);
								onReindexAllProgress({
									status: eventData.data.phase || 'processing',
									progress: eventData.data.progress || 0,
									totalFiles: eventData.data.totalFiles || 0,
									filesProcessed: eventData.data.filesProcessed || 0,
									message: eventData.data.message,
									folderId: eventData.data.folderId,
									currentFolder: eventData.data.currentFolder,
									timestamp: eventData.data.timestamp || Date.now(),
								});
							}
							break;

						case 'folder:completed':
							if (eventData.data) {
								handleComplete(eventData.data as FolderResponse);
							}
							break;

						case 'folder:error':
							if (eventData.data) {
								handleError(eventData.data as ErrorResponse);
							}
							break;

						case 'folder:stats':
							if (eventData.data) {
								handleStats(eventData.data as FolderStats);
							}
							break;

						default:
							eventsLogger.debug('🤷 Evento no manejado:', eventData.type);
					}
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
	}, [handleProgress, handleError, handleComplete, handleStats]);

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
