import { EventSourcePolyfill } from 'event-source-polyfill';
import { useEffect } from 'react';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ProcessStatus, ThumbnailError } from '@/services/thumbnail-service-export';
import { useThumbnailStore } from '@/store/thumbnails.store';

const RETRY_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT = 30000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type EventSourceMessage = {
	data: string;
	type?: string;
};

export function useThumbnailEvents() {
	const { setProcessing, setStats, setError, setProcessStatus } = useThumbnailStore();

	useEffect(() => {
		let eventSource: EventSourcePolyfill | null = null;
		let heartbeatTimeout: NodeJS.Timeout;
		let retryTimeout: NodeJS.Timeout;
		let reconnectAttempts = 0;

		const resetHeartbeatTimeout = () => {
			if (heartbeatTimeout) {
				clearTimeout(heartbeatTimeout);
			}
			heartbeatTimeout = setTimeout(() => {
				serverLogger.warn('⚠️ No se ha recibido heartbeat en', HEARTBEAT_TIMEOUT);
				reconnect();
			}, HEARTBEAT_TIMEOUT);
		};

		const connect = () => {
			if (eventSource) {
				eventSource.close();
			}

			try {
				const url = new URL('/api/thumbnails/events', BASE_URL);
				eventSource = new EventSourcePolyfill(url.toString(), {
					heartbeatTimeout: HEARTBEAT_TIMEOUT,
					withCredentials: true,
					headers: {
						'Cache-Control': 'no-cache',
						Accept: 'text/event-stream',
					},
				});

				eventSource.onopen = () => {
					serverLogger.info('🔌 Conexión SSE establecida');
					reconnectAttempts = 0;
					resetHeartbeatTimeout();
				};

				eventSource.onerror = (error) => {
					serverLogger.error('❌ Error en conexión SSE:', error);
					setError('Error en la conexión de eventos');
					reconnect();
				};

				eventSource.addEventListener('heartbeat', () => {
					resetHeartbeatTimeout();
				});

				const handleEvent = (e: EventSourceMessage) => {
					try {
						if (!e.data) {
							return;
						}
						const data = JSON.parse(e.data);
						if (!data || typeof data !== 'object') {
							return;
						}
						return data;
					} catch (error: unknown) {
						serverLogger.error('❌ Error procesando evento:', error);
						return null;
					}
				};

				eventSource.onmessage = (e: EventSourceMessage) => {
					const data = handleEvent(e);
					if (!data) {
						return;
					}

					if (data.type === 'progress') {
						setProcessStatus(data as ProcessStatus);
					} else if (data.type === 'stats') {
						const stats = {
							...data,
							errors: data.errors?.map((error: ThumbnailError) => ({
								...error,
								timestamp: error.timestamp.toString(),
							})),
						};
						setStats(stats);
					} else if (data.type === 'complete') {
						setProcessing(false);
						setProcessStatus({
							status: 'Completado',
							progress: 100,
							...data,
						});
					} else if (data.type === 'error') {
						const errorMessage = data.message || data.details || 'Error desconocido';
						setError(errorMessage);
					}
				};
			} catch (error) {
				serverLogger.error('❌ Error creando conexión SSE:', error);
				setError(error instanceof Error ? error.message : 'Error al establecer la conexión');
				reconnect();
			}
		};

		const reconnect = () => {
			if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
				serverLogger.error('❌ Máximo número de intentos de reconexión alcanzado');
				setError('No se pudo restablecer la conexión después de varios intentos');
				return;
			}

			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}

			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}

			reconnectAttempts++;
			const delay = RETRY_INTERVAL * 2 ** (reconnectAttempts - 1);

			retryTimeout = setTimeout(() => {
				serverLogger.info(`🔄 Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
				connect();
			}, delay);
		};

		connect();

		return () => {
			if (eventSource) {
				eventSource.close();
			}
			if (heartbeatTimeout) {
				clearTimeout(heartbeatTimeout);
			}
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
		};
	}, [setProcessing, setStats, setError, setProcessStatus]);
}
