import { eq } from 'drizzle-orm';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { createEntityNotFoundError, createFileNotFoundError, toServiceError } from '@/lib/utils/errors/service-errors';

const SERVICE_NAME = 'ImageProcessingService';
const imageLogger = serverLogger.withContext(SERVICE_NAME);

export interface ImageProcessingOptions {
	quality?: number;
	width?: number;
	height?: number;
	format?: 'jpeg' | 'png' | 'webp';
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Procesa una imagen según las opciones especificadas
 */
export async function processImage(imageId: string, options: ImageProcessingOptions = {}): Promise<Buffer> {
	try {
		const image = await db.query.images.findFirst({
			where: eq(images.id, imageId),
			columns: {
				path: true,
				width: true,
				height: true,
			},
		});

		if (!image) {
			throw createEntityNotFoundError('Imagen', imageId, SERVICE_NAME);
		}

		if (!existsSync(image.path)) {
			throw createFileNotFoundError(image.path, { imageId }, SERVICE_NAME);
		}

		// Valores por defecto
		const { quality = 90, width = image.width, height = image.height, format = 'jpeg', fit = 'inside' } = options;

		// Procesar la imagen
		let processor = sharp(image.path).rotate();

		// Redimensionar si es necesario
		if (width !== image.width || height !== image.height) {
			processor = processor.resize({
				width,
				height,
				fit: fit as keyof sharp.FitEnum,
				withoutEnlargement: true,
			});
		}

		// Aplicar formato
		switch (format) {
			case 'webp':
				processor = processor.webp({ quality });
				break;
			case 'png':
				processor = processor.png({ quality });
				break;
			default:
				processor = processor.jpeg({ quality, progressive: true });
				break;
		}

		// Generar buffer final
		const buffer = await processor.toBuffer();

		imageLogger.info('Imagen procesada:', {
			imageId,
			originalSize: `${image.width}x${image.height}`,
			newSize: `${width}x${height}`,
			format,
			quality,
		});

		return buffer;
	} catch (error) {
		throw toServiceError(error, {
			serviceName: SERVICE_NAME,
			message: 'Error al procesar la imagen',
			context: { imageId, options },
		});
	}
}
