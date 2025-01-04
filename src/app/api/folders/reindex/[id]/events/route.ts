import { NextRequest, NextResponse } from 'next/server'
import { createStream } from '@/lib/stream'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'ID de carpeta requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Iniciando stream SSE para carpeta:', id);
    const streamData = await createStream(id, request);

    // Enviar evento inicial de conexión
    const initialEvent = JSON.stringify({ type: 'connected', data: { id } });
    await streamData.writer.write(streamData.encoder.encode(`data: ${initialEvent}\n\n`));

    return new NextResponse(streamData.stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error) {
    console.error('Error configurando SSE:', error);
    return new NextResponse(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}