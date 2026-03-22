import { existsSync } from 'fs';
import sharp from 'sharp';
import { serverLogger } from '@/lib/logger/server-logger';
import { formatBytes } from '@/lib/utils/format.utils';

export type ImageFormat = 'webp' | 'jpeg' | 'png';

export interface ProcessImageOptions {
	background?: string;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	format?: ImageFormat;
	height: number;
	position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
	quality: number;
	width: number;
	withMetadata?: boolean;
	withoutEnlargement?: boolean;
}

export interface ProcessImageResult {
	buffer: Buffer;
	format: ImageFormat;
	height: number;
	size: number;
	width: number;
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
		serverLogger.debug('Procesando imagen:', { path: imagePath, options: finalOptions });

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
			default:
				// Mantener configuración por defecto (webp)
				processor = processor.webp({
					quality: finalOptions.quality,
					effort: 4,
					lossless: finalOptions.quality >= 100,
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

		serverLogger.debug('Imagen procesada:', {
			path: imagePath,
			originalSize: metadata.size,
			newSize: formatBytes(buffer.length),
			dimensions: `${result.width}x${result.height}`,
		});

		return result;
	} catch (error) {
		serverLogger.error('Error procesando imagen:', {
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

		serverLogger.debug('Creando thumbnail:', { path: imagePath, options });

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

		serverLogger.warn('Thumbnail demasiado grande, reintentando con menor calidad:', {
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

		serverLogger.info('Thumbnail generado con calidad reducida:', {
			path: imagePath,
			originalSize: formatBytes(result.size),
			newSize: formatBytes(lowerQualityResult.size),
			quality: options.quality,
		});

		return lowerQualityResult;
	} catch (error) {
		serverLogger.error('Error creando thumbnail:', {
			path: imagePath,
			error: error instanceof Error ? error.message : error,
		});
		throw error instanceof Error ? error : new Error('Error creando thumbnail');
	}
}
