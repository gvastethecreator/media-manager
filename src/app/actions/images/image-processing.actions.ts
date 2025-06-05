'use server';

import { existsSync } from 'fs';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { createEntityNotFoundError, createFileNotFoundError, toServiceError } from '@/utils/errors/service-errors';
import sharp from 'sharp';
import type { ImageProcessingOptions } from './image-types.actions';

const SERVER_ACTION_NAME = 'ImageProcessing';
const imageLogger = serverLogger.withContext(SERVER_ACTION_NAME);

/**
 * Procesa una imagen según las opciones especificadas
 */
export async function processImage(imageId: string, options: ImageProcessingOptions = {}): Promise<Buffer> {
	try {
		const image = await prisma.image.findUnique({
			where: { id: imageId },
			select: {
				path: true,
				width: true,
				height: true,
			},
		});

		if (!image) {
			throw createEntityNotFoundError('Imagen', imageId, SERVER_ACTION_NAME);
		}

		if (!existsSync(image.path)) {
			throw createFileNotFoundError(image.path, { imageId }, SERVER_ACTION_NAME);
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
			serviceName: SERVER_ACTION_NAME,
			message: 'Error al procesar la imagen',
			context: { imageId, options },
		});
	}
}
