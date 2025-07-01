import { serverLogger } from '@/lib/logger/server-logger';
import type { ProcessStatus, ThumbnailError } from '@/services/thumbnail';
import { thumbnailService } from '@/services/thumbnail';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 15000;

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SSE_HEADERS = {
	'Content-Type': 'text/event-stream',
	'Cache-Control': 'no-cache, no-transform',
	Connection: 'keep-alive',
	'X-Accel-Buffering': 'no',
	...CORS_HEADERS,
};

const ERROR_HEADERS = {
	'Content-Type': 'application/json',
	...CORS_HEADERS,
};

const eventLogger = serverLogger.withContext('ThumbnailEventsAPI');

// Definir los tipos que necesitamos pero que no están exportados
type CompleteData = Record<string, unknown>;
type StatsData = Record<string, unknown>;

export async function OPTIONS() {
	return new Response(null, { headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
	try {
		const encoder = new TextEncoder();
		let heartbeatInterval: NodeJS.Timeout;

		const stream = new ReadableStream({
			start(controller) {
				// Función para enviar eventos
				const send = (event: string, data: Record<string, unknown> | string) => {
					try {
						const formattedData = typeof data === 'string' ? data : JSON.stringify(data);
						const message = `event: ${event}\ndata: ${formattedData}\n\n`;
						controller.enqueue(encoder.encode(message));
						eventLogger.debug('📤 Evento enviado:', { event, data });
					} catch (error) {
						eventLogger.error('❌ Error enviando evento:', { event, error });
					}
				};

				// Enviar heartbeat periódicamente
				heartbeatInterval = setInterval(() => {
					send('heartbeat', { timestamp: Date.now() });
				}, HEARTBEAT_INTERVAL);

				// Manejadores de eventos
				const progressHandler = (status: ProcessStatus) => {
					send('progress', status as unknown as Record<string, unknown>);
				};

				const errorHandler = (error: ThumbnailError | Error | string | unknown) => {
					if (error instanceof Error) {
						send('error', {
							message: error.message,
							stack: error.stack,
						});
					} else if (typeof error === 'string') {
						send('error', { message: error });
					} else {
						send('error', error as Record<string, unknown>);
					}
				};

				const completeHandler = (data: CompleteData) => {
					send('complete', data);
				};

				const statsHandler = (stats: StatsData) => {
					send('stats', stats);
				};

				// Registrar manejadores
				thumbnailService.onProgress(progressHandler);
				thumbnailService.onError(errorHandler as (error: ThumbnailError) => void);
				thumbnailService.onComplete(completeHandler);
				thumbnailService.onStats(statsHandler);

				// Cleanup cuando se cierra la conexión
				req.signal.addEventListener('abort', () => {
					eventLogger.info('🔌 Conexión SSE cerrada por el cliente');
					if (heartbeatInterval) {
						clearInterval(heartbeatInterval);
					}
					thumbnailService.offProgress(progressHandler);
					thumbnailService.offError(errorHandler as (error: ThumbnailError) => void);
					thumbnailService.offComplete(completeHandler);
					thumbnailService.offStats(statsHandler);
					controller.close();
				});

				// Enviar evento inicial
				send('connected', { timestamp: Date.now() });
			},
			cancel() {
				eventLogger.info('🛑 Stream cancelado');
				if (heartbeatInterval) {
					clearInterval(heartbeatInterval);
				}
			},
		});

		return new Response(stream, { headers: SSE_HEADERS });
	} catch (error) {
		eventLogger.error('❌ Error en conexión SSE:', error);
		return new Response(
			JSON.stringify({
				error: 'Error interno del servidor',
				details: error instanceof Error ? error.message : 'Error desconocido',
			}),
			{
				status: 500,
				headers: ERROR_HEADERS,
			}
		);
	}
}
