import { existsSync } from 'fs';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { type NextRequest, NextResponse } from 'next/server';

const thumbLogger = logger.withContext('ThumbnailCleanupAPI');

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(_request: NextRequest) {
	const encoder = new TextEncoder();
	const stream = new TransformStream();
	const writer = stream.writable.getWriter();

	// Configurar la respuesta SSE
	const response = new NextResponse(stream.readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type',
			'X-Accel-Buffering': 'no',
		},
	});

	const writeEvent = async (event: string, data: Record<string, unknown>) => {
		try {
			const formattedData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
			await writer.write(encoder.encode(formattedData));
			thumbLogger.debug('📤 Evento enviado:', { type: event, data });
		} catch (error) {
			thumbLogger.error('❌ Error escribiendo evento:', error);
		}
	};

	try {
		// Enviar un ping inicial
		await writeEvent('ping', { timestamp: Date.now() });

		// Obtener imágenes con thumbnail
		const images = await prisma.image.findMany({
			where: {
				thumbnail: { not: null },
			},
			select: {
				id: true,
				path: true,
				thumbnailSize: true,
				thumbnail: true,
			},
		});

		const total = images.length;
		let current = 0;
		let cleaned = 0;
		let totalFreed = 0;

		// Enviar estado inicial
		await writeEvent('start', {
			total,
			status: 'Iniciando limpieza...',
		});

		// Procesar cada imagen
		for (const image of images) {
			current++;
			const progress = Math.round((current / total) * 100);

			try {
				// Verificar si el archivo original existe
				if (!existsSync(image.path)) {
					const thumbnailSize = image.thumbnailSize || 0;
					totalFreed += thumbnailSize;

					// Limpiar thumbnail
					await prisma.image.update({
						where: { id: image.id },
						data: {
							thumbnail: null,
							thumbnailSize: null,
							thumbnailWidth: null,
							thumbnailHeight: null,
							thumbnailError: 'Archivo original no encontrado',
							thumbnailErrorAt: new Date(),
							updatedAt: new Date(),
						},
					});

					cleaned++;
					thumbLogger.info('🧹 Thumbnail limpiado:', {
						id: image.id,
						path: image.path,
						freedSpace: thumbnailSize,
					});

					await writeEvent('progress', {
						current,
						total,
						progress,
						currentFile: image.path,
						status: `Limpiando ${current} de ${total}`,
						lastProcessed: {
							id: image.id,
							path: image.path,
							processedAt: new Date().toISOString(),
							freed: thumbnailSize,
						},
					});
				}

				// Enviar ping cada 10 imágenes
				if (current % 10 === 0) {
					await writeEvent('ping', { timestamp: Date.now() });
				}
			} catch (error) {
				thumbLogger.error('❌ Error limpiando imagen:', error);
				await writeEvent('error', {
					imageId: image.id,
					path: image.path,
					error: error instanceof Error ? error.message : 'Error desconocido',
				});
			}

			// Pequeña pausa para no sobrecargar
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Enviar evento de finalización
		await writeEvent('complete', {
			cleaned,
			total,
			totalFreed,
			timestamp: new Date().toISOString(),
		});

		await writer.close();
		return response;
	} catch (error) {
		thumbLogger.error('❌ Error en limpieza:', error);
		await writeEvent('error', {
			error: error instanceof Error ? error.message : 'Error desconocido',
			timestamp: new Date().toISOString(),
		});
		await writer.close();
		return response;
	}
}
