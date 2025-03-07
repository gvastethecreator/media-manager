import { createStream } from '@/lib/stream';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest, context: { params: { id: string } }) {
	try {
		// Esperar y extraer los parámetros de manera asíncrona
		const params = await Promise.resolve(context.params);
		const folderId = params.id;

		if (!folderId) {
			console.error('ID de carpeta no encontrado');
			return new NextResponse(JSON.stringify({ error: 'ID de carpeta requerido' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		const streamData = await createStream(folderId, request);

		// Configurar headers de respuesta
		const headers = new Headers({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
		});

		// Crear respuesta con stream
		const response = new NextResponse(streamData.stream, { headers });

		// Enviar evento inicial de conexión
		const encoder = new TextEncoder();
		const initialEvent = `data: ${JSON.stringify({ type: 'connected', data: { id: folderId } })}\n\n`;
		await streamData.writer.write(encoder.encode(initialEvent));

		// Manejar desconexión del cliente
		request.signal.addEventListener('abort', () => {
			streamData.writer.close().catch(console.error);
		});
		return response;
	} catch (error) {
		console.error('Error configurando SSE:', error);
		return new NextResponse(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Error desconocido',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}
