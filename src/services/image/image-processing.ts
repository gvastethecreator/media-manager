/**
 * @file Procesamiento de imágenes con Sharp
 * @module services/image/image-processing
 * @description Pipeline de procesamiento, redimensionamiento y conversión de formato
 */

import sharp from 'sharp';
import { imageConfig } from '@/lib/config';
import { ServiceErrorCode, toServiceError } from '@/lib/utils/errors/service-errors';
import { SERVICE_NAME } from './image-utils';

/**
 * Opciones para el procesamiento de imágenes
 */
export interface ImageProcessingOptions {
	fit?: 'cover' | 'contain' | 'inside' | 'outside';
	format?: 'webp' | 'jpeg' | 'png';
	height?: number;
	quality?: number;
	type?: string;
	width?: number;
}

/**
 * Resultado del procesamiento de imagen
 */
export interface ProcessedImage {
	buffer: Buffer;
	metadata: sharp.OutputInfo;
}

/**
 * Re-export de configuración de calidad de thumbnails
 */
export const THUMBNAIL_QUALITY_CONFIG = imageConfig.thumbnail.qualities;

/**
 * Procesa una imagen aplicando redimensionamiento y conversión de formato
 *
 * @param inputPath - Ruta de la imagen a procesar
 * @param options - Opciones de procesamiento (tamaño, calidad, formato)
 * @returns Buffer procesado y metadata
 * @throws ServiceError si falla el procesamiento
 */
export async function processImage(inputPath: string, options: ImageProcessingOptions = {}): Promise<ProcessedImage> {
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

/**
 * Aplica redimensionamiento manteniendo aspect ratio
 *
 * @param pipeline - Pipeline de Sharp
 * @param metadata - Metadata de la imagen original
 * @param options - Opciones de redimensionamiento
 * @returns Pipeline con redimensionamiento aplicado
 */
function applyResize(pipeline: sharp.Sharp, metadata: sharp.Metadata, options: ImageProcessingOptions): sharp.Sharp {
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
 * Aplica conversión de formato con opciones de calidad
 *
 * @param pipeline - Pipeline de Sharp
 * @param options - Opciones de formato (webp/jpeg/png)
 * @returns Pipeline con conversión de formato aplicada
 */
function applyFormat(pipeline: sharp.Sharp, options: ImageProcessingOptions): sharp.Sharp {
	switch (options.format) {
		case 'webp':
			// nearLossless genera archivos mayores; preferimos calidad moderada con esfuerzo razonable
			return pipeline.webp({ quality: options.quality || 75, effort: 4 });
		case 'jpeg':
			return pipeline.jpeg({ quality: options.quality || 75, progressive: true, mozjpeg: true });
		case 'png':
			return pipeline.png({ progressive: true, compressionLevel: 9 });
		default:
			return pipeline;
	}
}
