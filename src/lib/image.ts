import { existsSync } from 'fs';
import sharp from 'sharp';
import { logger } from './logger/logger';
import { formatBytes } from './utils/utils';

export type ImageFormat = 'webp' | 'jpeg' | 'png';

export interface ProcessImageOptions {
	width: number;
	height: number;
	quality: number;
	format?: ImageFormat;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
	background?: string;
	withoutEnlargement?: boolean;
	withMetadata?: boolean;
}

export interface ProcessImageResult {
	buffer: Buffer;
	width: number;
	height: number;
	format: ImageFormat;
	size: number;
}

const DEFAULT_OPTIONS: Partial<ProcessImageOptions> = {
	format: 'webp',
	fit: 'inside',
	position: 'center',
	withoutEnlargement: true,
	withMetadata: false,
};

const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB
const MIN_QUALITY = 40;
const QUALITY_REDUCTION_STEP = 20;

/**
 * Procesa una imagen aplicando transformaciones
 * @param imagePath Ruta de la imagen
 * @param options Opciones de procesamiento
 * @returns Resultado del procesamiento
 */
export async function processImage(imagePath: string, options: ProcessImageOptions): Promise<ProcessImageResult> {
	try {
		if (!existsSync(imagePath)) {
			throw new Error(`Archivo no encontrado: ${imagePath}`);
		}

		const finalOptions = { ...DEFAULT_OPTIONS, ...options };
		logger.debug('Procesando imagen:', { path: imagePath, options: finalOptions });

		const image = sharp(imagePath, {
			failOn: 'none',
			animated: true, // Preservar animaciones si es posible
		});

		// Obtener metadata original
		const metadata = await image.metadata();
		if (!metadata) {
			throw new Error('No se pudo obtener metadata de la imagen');
		}

		// Aplicar transformaciones
		let processor = image.resize(finalOptions.width, finalOptions.height, {
			fit: finalOptions.fit,
			position: finalOptions.position,
			background: finalOptions.background,
			withoutEnlargement: finalOptions.withoutEnlargement,
		});

		if (finalOptions.withMetadata) {
			processor = processor.withMetadata();
		}

		// Aplicar formato y calidad
		const format = finalOptions.format || 'webp';
		switch (format) {
			case 'webp':
				processor = processor.webp({
					quality: finalOptions.quality,
					effort: 4, // Balance entre velocidad y compresión
					lossless: finalOptions.quality >= 100,
				});
				break;
			case 'jpeg':
				processor = processor.jpeg({
					quality: finalOptions.quality,
					progressive: true,
					optimizeCoding: true,
				});
				break;
			case 'png':
				processor = processor.png({
					quality: finalOptions.quality,
					progressive: true,
					compressionLevel: 9,
				});
				break;
		}

		const buffer = await processor.toBuffer();

		if (!buffer || buffer.length === 0) {
			throw new Error('Error generando buffer de imagen');
		}

		const result: ProcessImageResult = {
			buffer,
			width: metadata.width || 0,
			height: metadata.height || 0,
			format,
			size: buffer.length,
		};

		logger.debug('Imagen procesada:', {
			path: imagePath,
			originalSize: metadata.size,
			newSize: formatBytes(buffer.length),
			dimensions: `${result.width}x${result.height}`,
		});

		return result;
	} catch (error) {
		logger.error('Error procesando imagen:', {
			path: imagePath,
			error: error instanceof Error ? error.message : error,
		});
		throw error instanceof Error ? error : new Error('Error procesando imagen');
	}
}

/**
 * Crea un thumbnail optimizado de una imagen
 * @param imagePath Ruta de la imagen
 * @param options Opciones de procesamiento
 * @returns Resultado del procesamiento
 */
export async function createThumbnail(imagePath: string, options: ProcessImageOptions): Promise<ProcessImageResult> {
	try {
		if (!imagePath) {
			throw new Error('Path de imagen requerido');
		}

		if (!existsSync(imagePath)) {
			throw new Error(`Archivo no encontrado: ${imagePath}`);
		}

		logger.debug('Creando thumbnail:', { path: imagePath, options });

		// Primer intento con opciones originales
		const result = await processImage(imagePath, {
			...options,
			format: 'webp', // Forzar WebP para thumbnails
			withMetadata: false, // No necesitamos metadata en thumbnails
		});

		// Validar tamaño máximo
		if (result.size <= MAX_THUMBNAIL_SIZE) {
			return result;
		}

		logger.warn('Thumbnail demasiado grande, reintentando con menor calidad:', {
			path: imagePath,
			size: formatBytes(result.size),
			maxSize: formatBytes(MAX_THUMBNAIL_SIZE),
		});

		// Reintentar con menor calidad
		const lowerQualityResult = await processImage(imagePath, {
			...options,
			quality: Math.max(options.quality - QUALITY_REDUCTION_STEP, MIN_QUALITY),
			format: 'webp',
			withMetadata: false,
		});

		if (lowerQualityResult.size > MAX_THUMBNAIL_SIZE) {
			throw new Error('No se pudo generar un thumbnail de tamaño aceptable');
		}

		logger.info('Thumbnail generado con calidad reducida:', {
			path: imagePath,
			originalSize: formatBytes(result.size),
			newSize: formatBytes(lowerQualityResult.size),
			quality: options.quality,
		});

		return lowerQualityResult;
	} catch (error) {
		logger.error('Error creando thumbnail:', {
			path: imagePath,
			error: error instanceof Error ? error.message : error,
		});
		throw error instanceof Error ? error : new Error('Error creando thumbnail');
	}
}
