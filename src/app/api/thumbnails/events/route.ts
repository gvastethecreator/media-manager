import { NextRequest } from 'next/server';
import { thumbnailEventService } from '@/services/thumbnail-events.service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 15000; // 15 segundos

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let isConnectionActive = true;

  try {
    // Función para enviar eventos al cliente
    const send = async (event: string, data: any) => {
      if (!isConnectionActive) return;

      try {
        const message = `data: ${JSON.stringify({ type: event, payload: data })}\n\n`;
        await writer.write(encoder.encode(message));
      } catch (error) {
        logger.error('Error sending SSE message:', error);
        isConnectionActive = false;
        throw error;
      }
    };

    // Función para enviar heartbeat
    const sendHeartbeat = async () => {
      if (!isConnectionActive) return;

      try {
        await writer.write(encoder.encode('data: heartbeat\n\n'));
        logger.debug('💓 Heartbeat enviado');
      } catch (error) {
        logger.error('Error sending heartbeat:', error);
        isConnectionActive = false;
      }
    };

    // Iniciar heartbeat más frecuente
    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Enviar un evento inicial y heartbeat
    await send('connected', { status: 'ok', timestamp: Date.now() });
    await sendHeartbeat();

    // Manejadores de eventos con control de errores mejorado
    const wrapEventHandler = (handler: Function) => async (...args: any[]) => {
      if (!isConnectionActive) return;
      try {
        await handler(...args);
      } catch (error) {
        logger.error('Error in event handler:', error);
        isConnectionActive = false;
      }
    };

    const progressHandler = wrapEventHandler(async (status: any) => {
      await send('progress', { ...status, timestamp: Date.now() });
    });

    const errorHandler = wrapEventHandler(async (error: any) => {
      await send('error', { ...error, timestamp: Date.now() });
    });

    const completeHandler = wrapEventHandler(async (data: any) => {
      await send('complete', { ...data, timestamp: Date.now() });
    });

    const statsHandler = wrapEventHandler(async (stats: any) => {
      await send('stats', { ...stats, timestamp: Date.now() });
    });

    // Suscribirse a eventos
    thumbnailEventService.onProgress(progressHandler);
    thumbnailEventService.onError(errorHandler);
    thumbnailEventService.onComplete(completeHandler);
    thumbnailEventService.onStats(statsHandler);

    // Cleanup mejorado
    req.signal.addEventListener('abort', () => {
      isConnectionActive = false;
      clearInterval(heartbeatInterval);
      thumbnailEventService.offProgress(progressHandler);
      thumbnailEventService.offError(errorHandler);
      thumbnailEventService.offComplete(completeHandler);
      thumbnailEventService.offStats(statsHandler);
      writer.close().catch(error => logger.error('Error closing writer:', error));
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      },
    });
  } catch (error) {
    isConnectionActive = false;
    logger.error('Error in SSE connection:', error);
    return new Response(
      JSON.stringify({
        error: 'Error establishing SSE connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}