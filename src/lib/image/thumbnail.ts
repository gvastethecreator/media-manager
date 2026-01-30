import { createHash } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import { extname, join } from 'path';
import sharp from 'sharp';
import { getThumbDirFor } from '@/config/thumbs';
import { THUMBNAIL_QUALITY_CONFIG, ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { serverLogger } from '@/lib/logger/server-logger';
import { formatBytes } from '@/lib/utils/format.utils';
import type { ImageFormat } from './image';

const thumbLogger = serverLogger.withContext('Thumbnail');

// Configuración de caché (centralizada)
const CACHE_DIR_BASE = join(process.cwd(), '.image-cache', 'thumbnails');

export interface ThumbnailOptions {
	quality: ThumbnailQuality;
	format?: ImageFormat;
	preserveMetadata?: boolean;
	background?: string;
	progressive?: boolean;
}

export interface ThumbnailResult {
	buffer: Buffer;
	width: number;
	height: number;
	format: ImageFormat;
	size: number;
	originalSize?: number;
}

export interface OptimizeResult {
	data: Buffer;
	size: number;
	width: number;
	height: number;
}

const SUPPORTED_FORMATS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

const DEFAULT_OPTIONS: Partial<ThumbnailOptions> = {
	quality: ThumbnailQuality.MEDIUM,
	format: 'webp',
	preserveMetadata: false,
	progressive: true,
};

const MAX_DIMENSION = 2048; // Máxima dimensión permitida
const MIN_DIMENSION = 16; // Mínima dimensión permitida

// Funciones de caché
async function ensureCacheDir(quality: ThumbnailQuality = ThumbnailQuality.MEDIUM) {
	try {
		const dir = getThumbDirFor(quality);
		await fs.mkdir(dir, { recursive: true });
	} catch (error) {
		thumbLogger.error('Error creando directorio de caché:', error);
	}
}

function getCacheKey(filePath: string, options: Partial<ThumbnailOptions>): string {
	const hash = createHash('md5');
	hash.update(filePath + JSON.stringify(options));
	return hash.digest('hex');
}

function getCachePath(cacheKey: string, quality: ThumbnailQuality = ThumbnailQuality.MEDIUM): string {
	return join(getThumbDirFor(quality), `${cacheKey}.webp`);
}

async function getFromCache(cacheKey: string, quality: ThumbnailQuality): Promise<ThumbnailResult | null> {
	const cachePath = getCachePath(cacheKey, quality);
	try {
		const stats = await fs.stat(cachePath);
		if (stats.isFile()) {
			const buffer = await fs.readFile(cachePath);
			const { info } = await sharp(buffer).toBuffer({ resolveWithObject: true });

			// Comprobar si las propiedades existen y proporcionar valores por defecto
			const width = info.width ?? 0;
			const height = info.height ?? 0;

			return {
				buffer,
				width,
				height,
				format: 'webp',
				size: buffer.length,
			};
		}
	} catch (_error) {
		return null;
	}
	return null;
}

async function saveToCache(cacheKey: string, buffer: Buffer, quality: ThumbnailQuality): Promise<void> {
	const cachePath = getCachePath(cacheKey, quality);
	try {
		await fs.writeFile(cachePath, buffer);
	} catch (error) {
		thumbLogger.error('Error guardando en caché:', error);
	}
}

/**
 * Valida y ajusta las dimensiones para el thumbnail
 */
function validateDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
	const aspectRatio = originalWidth / originalHeight;

	let width = originalWidth;
	let height = originalHeight;

	if (width > MAX_DIMENSION) {
		width = MAX_DIMENSION;
		height = Math.round(width / aspectRatio);
	}

	if (height > MAX_DIMENSION) {
		height = MAX_DIMENSION;
		width = Math.round(height * aspectRatio);
	}

	if (width < MIN_DIMENSION) {
		width = MIN_DIMENSION;
	}
	if (height < MIN_DIMENSION) {
		height = MIN_DIMENSION;
	}

	return { width, height };
}

/**
 * Optimiza una miniatura existente
 * @param buffer Buffer de la miniatura a optimizar
 * @returns Resultado de la optimización con el nuevo buffer y metadatos
 */
export async function optimizeThumbnail(buffer: Buffer): Promise<OptimizeResult> {
	try {
		// Procesar con sharp
		const image = sharp(buffer);
		const metadata = await image.metadata();

		// Optimizar manteniendo calidad pero reduciendo tamaño
		const optimized = await image
			.webp({
				quality: 80,
				effort: 4,
				nearLossless: true,
				smartSubsample: true,
			})
			.toBuffer();

		return {
			data: Buffer.from(optimized),
			size: optimized.length,
			width: metadata.width || 0,
			height: metadata.height || 0,
		};
	} catch (error) {
		thumbLogger.error('Error optimizando thumbnail:', error);
		throw error;
	}
}

/**
 * Genera un thumbnail optimizado de una imagen
 * @param filePath Ruta del archivo de imagen
 * @param options Opciones de generación
 * @returns Resultado con el buffer y dimensiones
 */
export async function generateThumbnail(
	filePath: string,
	options: Partial<ThumbnailOptions> = {}
): Promise<ThumbnailResult> {
	try {
		// 🟡 Logging de diagnóstico: primero existencia, luego permisos
		thumbLogger.info('🔍 Verificando acceso al archivo para thumbnail:', filePath);

		// Protección contra rutas inválidas (ej. base64 pasado como path)
		if (filePath.length > 1024) {
			thumbLogger.error(`❌ Ruta de archivo demasiado larga (${filePath.length} chars). Posible data corrupta.`);
			throw new Error('Ruta de archivo inválida (demasiado larga)');
		}

		// Protección adicional para existsSync que puede lanzar en algunas versiones de Node con paths muy largos
		let exists = false;
		try {
			exists = existsSync(filePath);
		} catch (e) {
			thumbLogger.error(
				`❌ Error verificando existencia de archivo (posible ruta inválida): ${filePath.substring(0, 100)}...`,
				e
			);
			throw new Error(`Error verificando archivo: ${e instanceof Error ? e.message : 'Unknown error'}`);
		}

		thumbLogger.info('🟡 existsSync:', exists);
		if (!exists) {
			thumbLogger.error(`Archivo no encontrado: ${filePath}`);
			throw new Error(`Archivo no encontrado: ${filePath}`);
		}
		try {
			await fs.access(filePath, fs.constants.R_OK);
			thumbLogger.info('🟢 Permiso de lectura OK para:', filePath);
		} catch (permError: any) {
			const code = permError?.code;
			if (code === 'EACCES' || code === 'EPERM') {
				thumbLogger.error('🔴 Permiso denegado al leer:', { path: filePath, code, message: permError.message });
				throw new Error(`Permiso denegado: ${filePath}`);
			}
			// Otros errores inesperados de access
			thumbLogger.error('🔴 Error comprobando acceso de lectura:', {
				path: filePath,
				code,
				message: permError instanceof Error ? permError.message : String(permError),
			});
			throw permError;
		}
		thumbLogger.info('🟡 Usuario proceso:', process.env.USERNAME || process.env.USER || 'N/A');

		const ext = extname(filePath).toLowerCase();
		if (!SUPPORTED_FORMATS.has(ext)) {
			thumbLogger.error(`Formato no soportado: ${ext}`);
			throw new Error(`Formato no soportado: ${ext}`);
		}

		// Combinar opciones
		const finalOptions = { ...DEFAULT_OPTIONS, ...options };
		const config = THUMBNAIL_QUALITY_CONFIG[finalOptions.quality as ThumbnailQuality];
		if (!config) {
			thumbLogger.error(`Calidad inválida: ${finalOptions.quality}`);
			throw new Error(`Calidad inválida: ${finalOptions.quality}`);
		}

		// Verificar caché
		await ensureCacheDir(finalOptions.quality as ThumbnailQuality);
		const cacheKey = getCacheKey(filePath, finalOptions);
		const cached = await getFromCache(cacheKey, finalOptions.quality as ThumbnailQuality);
		if (cached) {
			thumbLogger.debug('Thumbnail recuperado de caché:', {
				path: filePath,
				dimensions: `${cached.width}x${cached.height}`,
				size: formatBytes(cached.size),
			});
			return cached;
		}

		thumbLogger.debug('Generando thumbnail:', {
			path: filePath,
			options: finalOptions,
			config,
		});

		// Nota: logs de depuración de consola eliminados; usar thumbLogger si es necesario

		// Inicializar sharp
		const image = sharp(filePath, {
			failOn: 'none',
			animated: true, // Preservar animaciones
			limitInputPixels: MAX_DIMENSION ** 2, // Limitar tamaño máximo
		});

		// Obtener metadata
		const metadata = await image.metadata();
		if (!(metadata.width && metadata.height)) {
			thumbLogger.error('No se pudieron obtener las dimensiones de la imagen', { filePath });
			throw new Error('No se pudieron obtener las dimensiones de la imagen');
		}

		// Calcular dimensiones con valores seguros
		const width = metadata.width || 100; // valor por defecto si falta
		const height = metadata.height || 100; // valor por defecto si falta
		const aspectRatio = width / height;

		let targetWidth = config.width;
		let targetHeight = config.height;

		if (aspectRatio > 1) {
			// Imagen horizontal
			targetHeight = Math.round(targetWidth / aspectRatio);
		} else {
			// Imagen vertical o cuadrada
			targetWidth = Math.round(targetHeight * aspectRatio);
		}

		// Validar dimensiones finales
		const validDimensions = validateDimensions(targetWidth, targetHeight);

		// Configurar el pipeline de procesamiento
		let processor = image.resize(validDimensions.width, validDimensions.height, {
			fit: 'inside',
			withoutEnlargement: true,
		});

		// Configurar opciones de salida según el formato deseado
		let outputOptions: any = {};
		const format = finalOptions.format || 'webp';

		// Crear configuración específica del formato
		switch (format) {
			case 'webp':
				outputOptions = {
					quality: config.quality,
					effort: 4,
					smartSubsample: true,
					reductionEffort: 4,
				};
				processor = processor.webp(outputOptions);
				break;

			case 'jpeg':
				outputOptions = {
					quality: config.quality,
					progressive: finalOptions.progressive,
					mozjpeg: true,
				};
				processor = processor.jpeg(outputOptions);
				break;

			case 'png':
				outputOptions = {
					compressionLevel: 9,
					progressive: finalOptions.progressive,
				};
				processor = processor.png(outputOptions);
				break;

			default:
				processor = processor.webp({
					quality: config.quality,
					effort: 4,
				});
		}

		// Generar thumbnail
		try {
			const { data, info } = await processor.toBuffer({ resolveWithObject: true });

			// Guardar en caché para futuros usos
			await saveToCache(cacheKey, data, finalOptions.quality as ThumbnailQuality);

			// Nota: logs de depuración de consola eliminados; usar thumbLogger.debug si se requiere

			// Devolver resultado
			return {
				buffer: data,
				width: info.width,
				height: info.height,
				format: format as ImageFormat,
				size: data.length,
				originalSize: metadata.size,
			};
		} catch (processingError) {
			thumbLogger.error('Error procesando imagen:', processingError);
			throw new Error(
				`Error procesando imagen: ${processingError instanceof Error ? processingError.message : String(processingError)}`
			);
		}
	} catch (error) {
		thumbLogger.error('Error generando thumbnail:', error);
		throw error;
	}
}

/**
 * Limpia la caché de thumbnails
 */
export async function clearThumbnailCache(): Promise<void> {
	try {
		const dirs = [getThumbDirFor('low' as any), getThumbDirFor('medium' as any), getThumbDirFor('high' as any)];
		for (const dir of dirs) {
			await fs.mkdir(dir, { recursive: true }); // Asegurarse de que existe
			const files = await fs.readdir(dir);
			await Promise.all(files.map((file) => fs.unlink(join(dir, file))));
		}
		thumbLogger.info('Caché de thumbnails limpiada');
	} catch (error) {
		thumbLogger.error('Error limpiando caché:', error);
		throw error;
	}
}
