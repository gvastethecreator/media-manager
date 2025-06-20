'use server';

import { CacheManager } from '@/lib/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import type { MediaMetadata } from '@/types/metadata.types';
import { type Stats } from 'fs';
import * as fs from 'fs/promises';
import sharp from 'sharp';
import { MetadataError, MetadataErrorCode } from './metadata-errors.actions';
import { getAIGenerationInfo, parseExifData } from './metadata-parsers.actions';
import { METADATA_RETRY_CONFIG, type MetadataOptions } from './metadata-types.actions';
import { getImageFormat, isSupportedImageFormat, withRetry } from './metadata-utils.actions';

const extractorLogger = serverLogger.withContext('MetadataExtractors');
const metadataCache = new CacheManager<MediaMetadata>({
	name: 'metadata',
	ttl: 60 * 60 * 1000, // 1 hora
	maxSize: 100,
	updateAgeOnGet: true,
	allowStale: true,
});

/**
 * Normaliza una ruta para usarla como clave de caché
 * Esta función es crítica para mantener consistencia entre diferentes partes del código
 */
const normalizePathForCache = (path: string): string => {
	if (!path) {
		return '';
	}

	// 1. Normalizar separadores y eliminar duplicados
	let normalized = path
		.replace(/\\/g, '/') // Reemplazar todas las barras invertidas por barras normales
		.replace(/([a-z]):\/+/i, '$1:/') // Normalizar el formato de unidad Windows (C:/ o C:\)
		.replace(/\/+/g, '/'); // Eliminar barras duplicadas

	// 2. Convertir a minúsculas para comparación consistente
	normalized = normalized.toLowerCase();

	// 3. Corregir variaciones específicas observadas
	normalized = normalized
		.replace(/outpu+ts/gi, 'outputs') // Corregir cualquier variación de 'outputs' con múltiples 'u'
		.replace(/outp+uts/gi, 'outputs') // Corregir variaciones con múltiples 'p'
		.replace(/s+dmatrix/gi, 'sdmatrix'); // Corregir cualquier variación de 'sdmatrix'

	// 4. Asegurar estructura consistente para #outputs
	if (normalized.includes('#outputs') && !normalized.includes('/#outputs/')) {
		normalized = normalized.replace(/(.*)\/?#outputs\/?(.*)/, '$1/#outputs/$2');
	}

	extractorLogger.debug('Ruta normalizada:', { original: path, normalized });
	return normalized;
};



/**
 * Extrae metadatos de un archivo
 */
export async function extractMetadata(path: string, options?: MetadataOptions): Promise<MediaMetadata> {
	extractorLogger.info('Extrayendo metadatos de:', path);
	const normalizedPath = normalizePathForCache(path);

	const cached = await metadataCache.get(normalizedPath);
	if (cached?.width && cached.width > 0) {
		extractorLogger.info('Metadatos obtenidos de caché:', path);
		return cached;
	}

	if (!(await isSupportedImageFormat(path))) {
		throw new MetadataError('Formato de archivo no soportado', path, MetadataErrorCode.UNSUPPORTED_FORMAT);
	}

	const stats = await withRetry<Stats>(() => fs.stat(path), options?.retry || METADATA_RETRY_CONFIG);
	const buffer = await withRetry<Buffer>(() => fs.readFile(path), options?.retry || METADATA_RETRY_CONFIG);

	const _fileSystemInfo = {
		size: Number(stats.size),
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		accessed: stats.atime.toISOString(),
	};

	// Inicializar con valores por defecto requeridos por MediaMetadata
	const metadata: Partial<MediaMetadata> = {
		totalSize: Number(stats.size),
		itemCount: 1,
		lastModified: stats.mtime,
		fileSize: Number(stats.size),
		mimeType: 'image/unknown',
		format: 'unknown',
	};

	try {
		const sharpInstance = sharp(buffer);
		const sharpMeta = await withRetry<sharp.Metadata>(
			() => sharpInstance.metadata(),
			options?.retry || METADATA_RETRY_CONFIG
		);

		// Actualizar los campos relevantes
		if (sharpMeta.width) metadata.width = sharpMeta.width;
		if (sharpMeta.height) metadata.height = sharpMeta.height;
		if (sharpMeta.format) metadata.format = sharpMeta.format;
		if (sharpMeta.format) metadata.mimeType = `image/${sharpMeta.format}`;
	} catch (sharpError) {
		extractorLogger.warn('Error al extraer metadatos con sharp:', {
			path,
			error: sharpError instanceof Error ? sharpError.message : String(sharpError),
		});
	}

	if (!metadata.width || metadata.width <= 0) {
		try {
			const { info } = await withRetry(
				() => sharp(buffer).toBuffer({ resolveWithObject: true }),
				options?.retry || METADATA_RETRY_CONFIG
			);
			if (info.width > 0) metadata.width = info.width;
			if (info.height > 0) metadata.height = info.height;
		} catch (dimensionError) {
			extractorLogger.warn('Error al obtener dimensiones con método alternativo:', {
				path,
				error: dimensionError instanceof Error ? dimensionError.message : String(dimensionError),
			});
		}
	}

	const format = await getImageFormat(path);
	metadata.format = format;
	metadata.mimeType = `image/${format}`;

	// Valores por defecto si no se pudieron obtener
	if (!metadata.width) metadata.width = 800;
	if (!metadata.height) metadata.height = 600;

	// Los metadatos ya son MediaMetadata, no necesitamos conversión

	if (!options?.skipExif) {
		try {
			const exifData = await parseExifData(buffer, path);
			metadata.exif = exifData.exif;
		} catch (_error) {
			extractorLogger.warn('No se pudieron extraer metadatos EXIF', { path });
		}
	}

	if (!options?.skipIptc) {
		try {
			// Los metadatos IPTC se extraerán del buffer usando sharp si están disponibles
			metadata.iptc = {};
		} catch (_error) {
			extractorLogger.warn('No se pudieron extraer metadatos IPTC', { path });
		}
	}

	if (!options?.skipXmp) {
		try {
			// Los metadatos XMP se extraerán del buffer usando sharp si están disponibles
			metadata.xmp = {};
		} catch (_error) {
			extractorLogger.warn('No se pudieron extraer metadatos XMP', { path });
		}
	}

	// Obtener metadatos de IA
	try {
		const aiMetadata = await getAIGenerationInfo(metadata as Record<string, unknown>);
		if (aiMetadata) {
			// Convertir AIGenerationMetadata a AIMetadata
			const aiMeta: import('@/types/metadata.types').AIMetadata = {
				model: aiMetadata.model,
				prompt: aiMetadata.prompt,
				negativePrompt: aiMetadata.negative_prompt,
				seed: typeof aiMetadata.seed === 'string' ? parseInt(aiMetadata.seed, 10) : aiMetadata.seed,
				extraParameters: aiMetadata.extra_params,
			};
			metadata.ai = aiMeta;
		}
	} catch (_error) {
		extractorLogger.warn('No se pudieron extraer metadatos de IA', { path });
	}

	// Asegurar que todos los campos requeridos estén presentes
	const finalMetadata: MediaMetadata = {
		totalSize: metadata.totalSize!,
		itemCount: metadata.itemCount!,
		lastModified: metadata.lastModified!,
		fileSize: metadata.fileSize!,
		mimeType: metadata.mimeType!,
		format: metadata.format!,
		width: metadata.width,
		height: metadata.height,
		exif: metadata.exif,
		iptc: metadata.iptc,
		xmp: metadata.xmp,
		icc: metadata.icc,
		ai: metadata.ai,
		gps: metadata.gps,
		colorSpace: metadata.colorSpace,
		colorProfile: metadata.colorProfile,
		hasAlpha: metadata.hasAlpha,
		orientation: metadata.orientation,
		density: metadata.density,
		isAnimated: metadata.isAnimated,
		sizeInBytes: metadata.sizeInBytes,
		dimensions: metadata.dimensions,
		duration: metadata.duration,
		encoding: metadata.encoding,
		hash: metadata.hash,
		customFields: metadata.customFields,
	};

	await metadataCache.set(normalizedPath, finalMetadata);
	return finalMetadata;
}

/**
 * Precarga metadatos para una lista de rutas
 * Esta función es útil para cargar metadatos en paralelo y mejorar el rendimiento
 */
export async function preloadMetadata(paths: string[]): Promise<void> {
	if (!paths.length) {
		return;
	}

	extractorLogger.info(`Precargando metadatos para ${paths.length} archivos...`);
	const startTime = Date.now();
	const maxConcurrentTasks = 5; // Limitar concurrencia para no sobrecargar el sistema

	// Normalizar todas las rutas de la misma manera
	const normalizedPaths = paths.map(normalizePathForCache);

	// Filtrar solo rutas que no estén ya en caché o que tengan metadatos inválidos
	const pathsToLoad: string[] = [];

	for (const normalizedPath of normalizedPaths) {
		const cached = await metadataCache.get(normalizedPath);
		if (!cached || !cached.width || !cached.height) {
			pathsToLoad.push(normalizedPath);
		}
	}

	if (pathsToLoad.length === 0) {
		extractorLogger.info('Todos los metadatos ya están en caché y son válidos');
		return;
	}

	extractorLogger.info(`Precargando ${pathsToLoad.length} archivos (${paths.length - pathsToLoad.length} ya en caché)`);

	// Función para procesar un lote de archivos
	const processChunk = async (chunk: string[]) => {
		const promises = chunk.map(async (normalizedPath) => {
			try {
				// Encontrar la ruta original correspondiente
				const originalPath = paths[normalizedPaths.indexOf(normalizedPath)];
				if (!originalPath) {
					return;
				}

				await extractMetadata(originalPath, { skipExif: true });
			} catch (error) {
				extractorLogger.warn(`Error precargando metadatos: ${error instanceof Error ? error.message : String(error)}`);
			}
		});

		await Promise.all(promises);
	};

	// Dividir en chunks para procesar en paralelo pero con límite
	const chunks: string[][] = [];
	for (let i = 0; i < pathsToLoad.length; i += maxConcurrentTasks) {
		chunks.push(pathsToLoad.slice(i, i + maxConcurrentTasks));
	}

	// Procesar todos los chunks secuencialmente
	for (const chunk of chunks) {
		await processChunk(chunk);
	}

	const duration = Date.now() - startTime;
	extractorLogger.info(
		`Precarga completada en ${duration}ms (${(duration / pathsToLoad.length).toFixed(2)}ms/archivo)`
	);
}

/**
 * Limpia la caché de metadatos
 */
export async function clearMetadataCache(): Promise<void> {
	extractorLogger.info('Limpiando caché de metadatos');
	await metadataCache.clear();
	extractorLogger.info('Caché de metadatos limpiada');
}
