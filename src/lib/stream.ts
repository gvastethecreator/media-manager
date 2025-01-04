import { NextRequest } from 'next/server'

interface StreamData {
  stream: TransformStream;
  writer: WritableStreamDefaultWriter;
  isActive: boolean;
  lastActivity: number;
  encoder: TextEncoder;
}

const activeStreams = new Map<string, StreamData>();
const STREAM_TIMEOUT = 30000; // 30 segundos

export async function createStream(id: string, request: NextRequest) {
  // Limpiar stream existente si hay uno
  await cleanupStream(id);

  // Crear nuevo stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Guardar el stream con estado activo
  const streamData: StreamData = {
    stream,
    writer,
    isActive: true,
    lastActivity: Date.now(),
    encoder
  };
  activeStreams.set(id, streamData);

  // Configurar limpieza cuando el cliente se desconecte
  request.signal.addEventListener('abort', () => {
    console.log('Cliente desconectado, limpiando recursos:', id);
    cleanupStream(id).catch(console.error);
  });

  // Iniciar heartbeat para mantener la conexión viva
  startHeartbeat(id);

  return streamData;
}

function startHeartbeat(id: string) {
  const interval = setInterval(async () => {
    const streamData = activeStreams.get(id);
    if (!streamData || !streamData.isActive) {
      clearInterval(interval);
      return;
    }

    // Si no hay actividad reciente, enviar heartbeat
    if (Date.now() - streamData.lastActivity > STREAM_TIMEOUT / 2) {
      try {
        await sendEvent(id, 'heartbeat', { timestamp: Date.now() });
      } catch (error) {
        console.error('Error en heartbeat:', error);
        clearInterval(interval);
        cleanupStream(id).catch(console.error);
      }
    }
  }, 5000);

  // Asegurarse de que el intervalo se limpie cuando el stream se cierre
  const streamData = activeStreams.get(id);
  if (streamData) {
    const originalClose = streamData.writer.close.bind(streamData.writer);
    streamData.writer.close = async () => {
      clearInterval(interval);
      return originalClose();
    };
  }
}

export async function cleanupStream(id: string) {
  const streamData = activeStreams.get(id);
  if (streamData) {
    try {
      streamData.isActive = false;
      await streamData.writer.close();
    } catch (error) {
      console.error('Error cerrando writer:', error);
    } finally {
      activeStreams.delete(id);
    }
  }
}

export async function sendEvent(id: string, type: string, data: any) {
  const streamData = activeStreams.get(id);
  if (!streamData) {
    console.warn('No hay stream activo para el folderId:', id);
    return;
  }

  try {
    if (!streamData.isActive) {
      console.warn('Stream marcado como inactivo:', id);
      return;
    }

    const event = JSON.stringify({ type, data });
    await streamData.writer.write(streamData.encoder.encode(`data: ${event}\n\n`));
    streamData.lastActivity = Date.now();
    console.log('Evento enviado:', { type, data });
  } catch (error) {
    console.error('Error enviando evento:', error);
    streamData.isActive = false;
    throw error;
  }
}

export function getActiveStream(id: string) {
  const streamData = activeStreams.get(id);
  return streamData?.isActive ? streamData : undefined;
}

export function hasActiveStream(id: string) {
  const streamData = activeStreams.get(id);
  return streamData?.isActive === true;
}

export function checkStreamStatus(id: string) {
  const streamData = activeStreams.get(id);
  if (!streamData) {
    return { exists: false, isActive: false, lastActivity: null };
  }

  return {
    exists: true,
    isActive: streamData.isActive,
    lastActivity: new Date(streamData.lastActivity)
  };
}