import { NextRequest, NextResponse } from 'next/server'
import { createStream } from '@/lib/stream'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  console.log('Iniciando ruta de eventos SSE...');

  try {
    // Extraer y validar el ID
    const { searchParams } = new URL(request.url);
    const folderId = context.params.id || searchParams.get('id');

    console.log('Parámetros de ruta:', {
      contextId: context.params.id,
      queryId: searchParams.get('id'),
      resolvedId: folderId
    });

    if (!folderId) {
      console.error('ID de carpeta no encontrado');
      return new NextResponse(JSON.stringify({ error: 'ID de carpeta requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Creando stream SSE para carpeta:', folderId);
    const streamData = await createStream(folderId, request);
    console.log('Stream creado correctamente');

    // Enviar evento inicial de conexión
    const encoder = new TextEncoder();
    const initialEvent = `data: ${JSON.stringify({ type: 'connected', data: { id: folderId } })}\n\n`;
    await streamData.writer.write(encoder.encode(initialEvent));
    console.log('Evento inicial enviado');

    const response = new NextResponse(streamData.stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

    console.log('Respuesta SSE preparada');
    return response;
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