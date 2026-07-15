/**
 * Servicio para generar thumbnails de video usando mediabunny
 * Reemplaza la implementación anterior basada en ffmpeg
 */

import { readFile } from 'node:fs/promises';
import { ALL_FORMATS, BufferSource, CanvasSink, Input } from 'mediabunny';
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('MediabunnyThumbnailService');

/**
 * Genera un thumbnail de video en un timestamp específico
 */
export async function generateVideoThumbnail(
	filePath: string,
	timestampSeconds = 1,
	width = 320,
	height = 240
): Promise<Buffer | null> {
	try {
		// Leer archivo como buffer
		const fileBuffer = await readFile(filePath);

		// Crear input de mediabunny
		const input = new Input({
			source: new BufferSource(fileBuffer),
			formats: ALL_FORMATS,
		});

		// Obtener track de video principal
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			logger.warn('No se encontró track de video');
			return null;
		}

		// Verificar que el track se puede decodificar
		const canDecode = await videoTrack.canDecode();
		if (!canDecode) {
			logger.warn('Track de video no se puede decodificar');
			return null;
		}

		// Crear sink para canvas con redimensionamiento automático
		const sink = new CanvasSink(videoTrack, {
			width,
			height,
		});

		// Obtener duración para ajustar timestamp si es necesario
		const duration = await input.computeDuration();
		const safeTimestamp = Math.min(timestampSeconds, duration - 0.1); // 100ms antes del final

		// Generar thumbnail en el timestamp especificado
		const result = await sink.getCanvas(safeTimestamp);
		if (!result) {
			logger.warn('No se pudo generar canvas para el timestamp', { safeTimestamp });
			return null;
		}

		const canvas = result.canvas;

		// Convertir canvas a JPEG buffer
		let jpegBuffer: Buffer | null = null;

		if (canvas instanceof HTMLCanvasElement) {
			// En browser
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(
					(blob) => {
						if (blob) resolve(blob);
						else reject(new Error('Failed to create blob'));
					},
					'image/jpeg',
					0.8
				);
			});

			const arrayBuffer = await blob.arrayBuffer();
			jpegBuffer = Buffer.from(arrayBuffer);
		} else if (canvas instanceof OffscreenCanvas) {
			// En worker o Node.js con OffscreenCanvas
			const blob = await canvas.convertToBlob({
				type: 'image/jpeg',
				quality: 0.8,
			});

			const arrayBuffer = await blob.arrayBuffer();
			jpegBuffer = Buffer.from(arrayBuffer);
		} else {
			// Fallback: convertir usando context 2D si está disponible
			logger.warn('Tipo de canvas no soportado para conversión a JPEG', {
				canvasType: typeof canvas,
			});
			return null;
		}

		logger.info('✅ Thumbnail generado exitosamente', {
			timestamp: safeTimestamp,
			dimensions: `${width}x${height}`,
			bufferSize: jpegBuffer?.length || 0,
		});

		return jpegBuffer;
	} catch (error) {
		logger.error('Error generando thumbnail con mediabunny', {
			timestampSeconds,
			errorKind: error instanceof Error ? error.name : 'UnknownError',
		});
		return null;
	}
}

/**
 * Genera múltiples thumbnails de video en timestamps específicos
 */
export async function generateMultipleThumbnails(
	filePath: string,
	timestamps: number[],
	width = 320,
	height = 240
): Promise<Buffer[]> {
	try {
		const fileBuffer = await readFile(filePath);
		const input = new Input({
			source: new BufferSource(fileBuffer),
			formats: ALL_FORMATS,
		});

		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			return [];
		}

		const canDecode = await videoTrack.canDecode();
		if (!canDecode) {
			return [];
		}

		const sink = new CanvasSink(videoTrack, { width, height });
		const duration = await input.computeDuration();

		// Ajustar timestamps para estar dentro de la duración
		const safeTimestamps = timestamps.map((ts) => Math.min(ts, duration - 0.1));

		const thumbnails: Buffer[] = [];

		// Generar thumbnails para cada timestamp
		for await (const result of sink.canvasesAtTimestamps(safeTimestamps)) {
			if (!result) {
				continue;
			}

			const canvas = result.canvas;

			try {
				let jpegBuffer: Buffer | null = null;

				if (canvas instanceof OffscreenCanvas) {
					const blob = await canvas.convertToBlob({
						type: 'image/jpeg',
						quality: 0.8,
					});
					const arrayBuffer = await blob.arrayBuffer();
					jpegBuffer = Buffer.from(arrayBuffer);
				} else if ('toBlob' in canvas) {
					// HTMLCanvasElement
					const blob = await new Promise<Blob>((resolve, reject) => {
						(canvas as any).toBlob(
							(blob: Blob) => {
								if (blob) resolve(blob);
								else reject(new Error('Failed to create blob'));
							},
							'image/jpeg',
							0.8
						);
					});

					const arrayBuffer = await blob.arrayBuffer();
					jpegBuffer = Buffer.from(arrayBuffer);
				}

				if (jpegBuffer) {
					thumbnails.push(jpegBuffer);
				}
			} catch (error) {
				logger.warn('Error convirtiendo canvas individual a JPEG', { error });
			}
		}

		return thumbnails;
	} catch (error) {
		logger.error('Error generando múltiples thumbnails', {
			errorKind: error instanceof Error ? error.name : 'UnknownError',
		});
		return [];
	}
}
