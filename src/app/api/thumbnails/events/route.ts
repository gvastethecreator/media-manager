import { NextRequest } from 'next/server';
import { thumbnailEventService } from '@/services/thumbnail-events.service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 15000;
const HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};

const eventLogger = logger.withContext('ThumbnailEventsAPI');

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let heartbeatInterval: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      // Función para enviar eventos
      const send = (event: string, data: any) => {
        try {
          const formattedData = typeof data === 'string' ? data : JSON.stringify(data);
          const message = `event: ${event}\ndata: ${formattedData}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          eventLogger.error('Error enviando evento:', { event, error });
        }
      };

      // Enviar heartbeat periódicamente
      heartbeatInterval = setInterval(() => {
        send('heartbeat', { timestamp: Date.now() });
      }, HEARTBEAT_INTERVAL);

      // Manejadores de eventos
      const progressHandler = (status: any) => {
        send('progress', status);
      };

      const errorHandler = (error: any) => {
        send('error', {
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      };

      const completeHandler = (data: any) => {
        send('complete', data);
      };

      const statsHandler = (stats: any) => {
        send('stats', stats);
      };

      // Registrar manejadores
      thumbnailEventService.onProgress(progressHandler);
      thumbnailEventService.onError(errorHandler);
      thumbnailEventService.onComplete(completeHandler);
      thumbnailEventService.onStats(statsHandler);

      // Cleanup cuando se cierra la conexión
      req.signal.addEventListener('abort', () => {
        eventLogger.info('Conexión SSE cerrada por el cliente');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        thumbnailEventService.offProgress(progressHandler);
        thumbnailEventService.offError(errorHandler);
        thumbnailEventService.offComplete(completeHandler);
        thumbnailEventService.offStats(statsHandler);
        controller.close();
      });

      // Enviar evento inicial
      send('connected', { timestamp: Date.now() });
    },
    cancel() {
      eventLogger.info('Stream cancelado');
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
  });

  return new Response(stream, { headers: HEADERS });
}