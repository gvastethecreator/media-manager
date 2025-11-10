/**
 * @file Utilidades de procesamiento de imágenes con Sharp
 * @module services/image/utils
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { serverLogger } from '@/lib/logger/server-logger';
import { toServiceError, ServiceErrorCode } from '@/lib/utils/errors/service-errors';
import type { ImageProcessingOptions } from '../types/image-service.types';

const SERVICE_NAME = 'ImageService';
const imageLogger = serverLogger.withContext(SERVICE_NAME);

const CACHE_DIR = '.image-cache';

/**
 * Asegura que el directorio de caché existe
 */
export async function ensureCacheDir(): Promise<void> {
	try {
		await fs.mkdir(CACHE_DIR, { recursive: true });
	} catch (error) {
		throw toServiceError(error, {
			code: ServiceErrorCode.FILE_WRITE_ERROR,
			message: 'Error al crear directorio de caché',
			serviceName: SERVICE_NAME,
		});
	}
}

/**
 * Aplica redimensionamiento a la imagen
 */
export function applyResize(
	pipeline: sharp.Sharp,
	metadata: sharp.Metadata,
	options: ImageProcessingOptions
): sharp.Sharp {
	const width = metadata.width ?? 0;
	const height = metadata.height ?? 0;
	const hasResize = Boolean(options.width) || Boolean(options.height);
	if (!hasResize) {
		return pipeline;
	}
	const aspectRatio = width > 0 && height > 0 ? width / height : 1;
	let targetWidth = options.width;
	let targetHeight = options.height;
	if (aspectRatio > 1 && targetWidth) {
		targetHeight = Math.round(targetWidth / aspectRatio);
	} else if (targetHeight) {
		targetWidth = Math.round(targetHeight * aspectRatio);
	}
	return pipeline.resize(targetWidth, targetHeight, {
		fit: options.fit || 'cover',
		withoutEnlargement: true,
	});
}

/**
 * Aplica formato y compresión a la imagen
 */
export function applyFormat(pipeline: sharp.Sharp, options: ImageProcessingOptions): sharp.Sharp {
	switch (options.format) {
		case 'webp':
			// nearLossless genera archivos mayores; preferimos calidad moderada con esfuerzo razonable.
			return pipeline.webp({ quality: options.quality || 75, effort: 4 });
		case 'jpeg':
			return pipeline.jpeg({ quality: options.quality || 75, progressive: true, mozjpeg: true });
		case 'png':
			return pipeline.png({ progressive: true, compressionLevel: 9 });
		default:
			return pipeline;
	}
}

/**
 * Procesa una imagen con las opciones especificadas
 */
export async function processImage(
	inputPath: string,
	options: ImageProcessingOptions = {}
): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> {
	try {
		let pipeline = sharp(inputPath);
		const meta = await pipeline.metadata();
		pipeline = applyResize(pipeline, meta, options);
		pipeline = applyFormat(pipeline, options);
		const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
		return { buffer: data, metadata: info };
	} catch (error) {
		throw toServiceError(error, {
			code: ServiceErrorCode.FILE_READ_ERROR,
			message: 'Error al procesar imagen',
			context: { inputPath, options },
			serviceName: SERVICE_NAME,
		});
	}
}

export const IMAGE_CACHE_DIR = CACHE_DIR;
