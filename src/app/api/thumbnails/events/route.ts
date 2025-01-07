import { NextRequest } from 'next/server';
import { thumbnailEventService } from '@/services/thumbnail-events.service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 15000; // 15 segundos

export async function GET(req: NextRequest) {
  try {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Función para enviar eventos al cliente
    const send = async (event: string, data: any) => {
      try {
        const message = `data: ${JSON.stringify({ type: event, payload: data })}\n\n`;
        await writer.write(encoder.encode(message));
      } catch (error) {
        logger.error('Error sending SSE message:', error);
        throw error;
      }
    };

    // Función para enviar heartbeat
    const sendHeartbeat = async () => {
      try {
        await writer.write(encoder.encode('data: heartbeat\n\n'));
      } catch (error) {
        logger.error('Error sending heartbeat:', error);
      }
    };

    // Iniciar heartbeat
    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Enviar un evento inicial para confirmar la conexión
    await send('connected', { status: 'ok' });
    await sendHeartbeat(); // Enviar heartbeat inicial

    // Manejadores de eventos
    const progressHandler = async (status: any) => {
      try {
        await send('progress', status);
      } catch (error) {
        logger.error('Error in progress handler:', error);
      }
    };

    const errorHandler = async (error: any) => {
      try {
        await send('error', error);
      } catch (err) {
        logger.error('Error in error handler:', err);
      }
    };

    const completeHandler = async (data: any) => {
      try {
        await send('complete', data);
      } catch (error) {
        logger.error('Error in complete handler:', error);
      }
    };

    const statsHandler = async (stats: any) => {
      try {
        await send('stats', stats);
      } catch (error) {
        logger.error('Error in stats handler:', error);
      }
    };

    // Suscribirse a eventos
    thumbnailEventService.onProgress(progressHandler);
    thumbnailEventService.onError(errorHandler);
    thumbnailEventService.onComplete(completeHandler);
    thumbnailEventService.onStats(statsHandler);

    // Cleanup al cerrar la conexión
    req.signal.addEventListener('abort', () => {
      clearInterval(heartbeatInterval);
      thumbnailEventService.offProgress(progressHandler);
      thumbnailEventService.offError(errorHandler);
      thumbnailEventService.offComplete(completeHandler);
      thumbnailEventService.offStats(statsHandler);
      writer.close().catch(error =>
        logger.error('Error closing writer:', error)
      );
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('Error in SSE connection:', error);
    return new Response(
      JSON.stringify({ error: 'Error establishing SSE connection' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}