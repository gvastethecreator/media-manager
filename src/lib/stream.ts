import { NextRequest } from 'next/server'

interface StreamData {
  stream: TransformStream;
  writer: WritableStreamDefaultWriter;
  isActive: boolean;
  lastActivity: number;
}

const streams = new Map<string, StreamData>();

export async function createStream(id: string, request: NextRequest): Promise<StreamData> {
  // Limpiar stream existente si hay uno
  if (streams.has(id)) {
    const existingStream = streams.get(id)!;
    existingStream.writer.close();
    streams.delete(id);
  }

  // Crear nuevo stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const streamData: StreamData = {
    stream,
    writer,
    isActive: true,
    lastActivity: Date.now()
  };

  streams.set(id, streamData);

  // Cleanup cuando el cliente se desconecta
  request.signal.addEventListener('abort', () => {
    console.log('Cliente desconectado, limpiando stream:', id);
    cleanupStream(id);
  });

  return streamData;
}

export function getStream(id: string): StreamData | undefined {
  return streams.get(id);
}

export async function cleanupStream(id: string) {
  const streamData = streams.get(id);
  if (streamData) {
    try {
      streamData.isActive = false;
      await streamData.writer.close();
    } catch (error) {
      console.error('Error cerrando stream:', error);
    } finally {
      streams.delete(id);
    }
  }
}

// Función para enviar eventos SSE
export async function sendSSEEvent(id: string, type: string, data: any) {
  const streamData = streams.get(id);
  if (!streamData || !streamData.isActive) {
    throw new Error('Stream no encontrado o inactivo');
  }

  try {
    const event = `data: ${JSON.stringify({ type, data })}\n\n`;
    await streamData.writer.write(new TextEncoder().encode(event));
    streamData.lastActivity = Date.now();
  } catch (error) {
    console.error('Error enviando evento SSE:', error);
    throw error;
  }
}

// Limpieza periódica de streams inactivos
const CLEANUP_INTERVAL = 60000; // 1 minuto
const INACTIVE_TIMEOUT = 300000; // 5 minutos

setInterval(() => {
  const now = Date.now();
  for (const [id, streamData] of streams.entries()) {
    if (now - streamData.lastActivity > INACTIVE_TIMEOUT) {
      console.log('Limpiando stream inactivo:', id);
      cleanupStream(id);
    }
  }
}, CLEANUP_INTERVAL);