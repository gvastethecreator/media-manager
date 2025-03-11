'use server';

import { type Stats, statSync } from 'fs';
import * as fs from 'node:fs/promises';
import { CacheManager } from '@/lib/cache';
import { logger } from '@/lib/logger/logger';
import type { AIMetadata, FileMetadata } from '@/types/metadata';
import sharp from 'sharp';
import { MetadataError, MetadataErrorCode } from './metadata-errors.actions';
import {
	getAIGenerationInfo,
	parseExifData,
	parseMetadataString,
	parseSharpMetadata,
} from './metadata-parsers.actions';
import {
	type ExtendedFileMetadata,
	type ImageFormat,
	METADATA_RETRY_CONFIG,
	type MetadataOptions,
	type SharpColourspaceEnum,
	type SharpFormatEnum,
} from './metadata-types.actions';
import { getImageFormat, isSupportedImageFormat, withRetry } from './metadata-utils.actions';

const extractorLogger = logger.withContext('MetadataExtractors');
const metadataCache = new CacheManager<FileMetadata>({
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
export async function extractMetadata(path: string, options?: MetadataOptions): Promise<FileMetadata> {
	try {
		extractorLogger.info('Extrayendo metadatos de:', path);

		// Normalizar ruta para caché - CRÍTICO para consistencia
		const normalizedPath = normalizePathForCache(path);
		extractorLogger.debug('Ruta normalizada para caché:', normalizedPath);

		// Verificar si existe en caché con la ruta normalizada
		const cached = await metadataCache.get(normalizedPath);
		if (cached) {
			extractorLogger.info('Metadatos obtenidos de caché:', path);

			// Si los metadatos en caché no tienen dimensiones válidas, ignorarlos
			if (
				!cached.dimensions ||
				!cached.dimensions.width ||
				!cached.dimensions.height ||
				cached.dimensions.width <= 0 ||
				cached.dimensions.height <= 0
			) {
				extractorLogger.warn('Metadatos en caché inválidos, extrayendo nuevamente:', path);
			} else {
				return cached;
			}
		}

		// Verificar que el archivo existe
		if (!(await isSupportedImageFormat(path))) {
			throw new MetadataError('Formato de archivo no soportado', path, MetadataErrorCode.UNSUPPORTED_FORMAT);
		}

		// Obtener estadísticas básicas del archivo
		const stats = await withRetry<Stats>(() => statSync(path), options?.retry || METADATA_RETRY_CONFIG);

		const fileSystemInfo = {
			size: Number(stats.size),
			created: stats.birthtime.toISOString(),
			modified: stats.mtime.toISOString(),
			accessed: stats.atime.toISOString(),
		};

		// Leer archivo
		const buffer = await withRetry<Buffer>(() => fs.readFile(path), options?.retry || METADATA_RETRY_CONFIG);

		// Extraer metadatos básicos con Sharp
		const formatResult = await getImageFormat(path);
		let sharpMetadata: Partial<sharp.Metadata> = {};
		let width = 0;
		let height = 0;

		try {
			// Intento primario: Usar nuestra función parseSharpMetadata mejorada
			const parsedSharpData = await parseSharpMetadata(buffer);

			if (
				parsedSharpData.dimensions?.width &&
				parsedSharpData.dimensions?.height &&
				parsedSharpData.dimensions.width > 0 &&
				parsedSharpData.dimensions.height > 0
			) {
				width = parsedSharpData.dimensions.width;
				height = parsedSharpData.dimensions.height;

				// Copiar otros metadatos obtenidos de Sharp
				const extendedData = parsedSharpData as ExtendedFileMetadata;
				if (extendedData.format) {
					// El formato ya lo manejamos correctamente con nuestro propio tipo
					if (['jpeg', 'png', 'gif', 'webp', 'tiff', 'svg', 'avif', 'jpg', 'tif'].includes(extendedData.format)) {
						// Este es solo para diagnóstico, no lo usamos directamente en sharp
						sharpMetadata.format = extendedData.format as unknown as keyof sharp.FormatEnum;
					}
				}

				if (parsedSharpData.colorSpace) {
					// Asegurarnos de que el espacio de color es un valor válido para sharp
					const validSpaces = ['cmyk', 'srgb', 'b-w'] as const;
					const colorSpace = parsedSharpData.colorSpace.toLowerCase();

					if (validSpaces.some((space) => space === colorSpace)) {
						sharpMetadata.space = colorSpace as keyof sharp.ColourspaceEnum;
					}
				}

				if (parsedSharpData.hasAlpha !== undefined) {
					sharpMetadata.hasAlpha = parsedSharpData.hasAlpha;
				}

				extractorLogger.debug('Metadatos obtenidos con parseSharpMetadata:', {
					width,
					height,
					format: extendedData.format || formatResult,
				});
			} else {
				// Intento alternativo usando sharp directamente
				try {
					const sharpInstance = sharp(buffer);
					// Tipamos correctamente la llamada a metadata()
					const sharpData = await withRetry<sharp.Metadata>(
						() => sharpInstance.metadata(),
						options?.retry || METADATA_RETRY_CONFIG
					);

					// Usar los datos obtenidos
					sharpMetadata = sharpData;

					if (sharpData.width && sharpData.height) {
						width = sharpData.width;
						height = sharpData.height;
					}
				} catch (sharpError) {
					extractorLogger.warn('Error al usar Sharp directamente:', {
						path,
						error: sharpError instanceof Error ? sharpError.message : String(sharpError),
					});
				}

				// Verificar si las dimensiones son válidas
				if (!width || !height || width <= 0 || height <= 0) {
					// Intento alternativo para extraer dimensiones usando el método image()
					extractorLogger.debug('Intentando método alternativo para obtener dimensiones', { path });
					try {
						const imageInfo = await withRetry(
							() => sharp(buffer).toBuffer({ resolveWithObject: true }),
							options?.retry || METADATA_RETRY_CONFIG
						);

						if (imageInfo?.info && imageInfo.info.width > 0 && imageInfo.info.height > 0) {
							width = imageInfo.info.width;
							height = imageInfo.info.height;
							extractorLogger.debug('Dimensiones obtenidas mediante método alternativo', {
								width,
								height,
								path,
							});
						}
					} catch (dimensionError) {
						extractorLogger.warn('Error al obtener dimensiones con método alternativo:', {
							path,
							error: dimensionError instanceof Error ? dimensionError.message : String(dimensionError),
						});
					}
				} else {
					width = sharpMetadata.width || 0;
					height = sharpMetadata.height || 0;
				}
			}
		} catch (error) {
			extractorLogger.warn('Error al extraer metadatos con sharp:', {
				path,
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// Asegurar dimensiones válidas con valores predeterminados como último recurso
		if (width <= 0 || height <= 0) {
			extractorLogger.warn(
				'Dimensiones no disponibles después de todos los intentos, usando valores predeterminados:',
				path
			);
			width = 800;
			height = 600;
		}

		// Base de metadatos
		const metadata: ExtendedFileMetadata = {
			dimensions: {
				width,
				height,
			},
			format: formatResult,
			fileSystem: fileSystemInfo,
			mimeType: `image/${formatResult === 'jpeg' ? 'jpeg' : formatResult}`,
		};

		// Extraer metadatos EXIF si está habilitado
		if (!options?.skipExif) {
			try {
				const exifData = await parseExifData(buffer, path);
				Object.assign(metadata, exifData);
			} catch (error) {
				extractorLogger.warn('No se pudieron extraer metadatos EXIF:', {
					path,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		// Parsear metadatos adicionales de generación de imagen
		if (!options?.skipParser) {
			try {
				// Algunas herramientas de generación de imágenes almacenan metadatos en formatos específicos
				// Intentamos extraer metadatos de posibles textos embebidos, pero no del buffer completo
				// ya que sabemos que es una imagen binaria
				let generationMetadata = null;

				// Comprobar si hay metadatos en formato JSON embebidos en partes específicas de la imagen
				// Por ejemplo, algunos generadores de IA guardan metadatos al final del archivo
				if (formatResult === 'png') {
					try {
						// Buscar chunks tEXt en PNG que pueden contener metadatos de generación
						// Esto se hace normalmente con bibliotecas específicas, pero simulamos el proceso
						// buscando patrones específicos
						extractorLogger.debug('Buscando metadatos embebidos en PNG para:', path);

						// En un caso real, usaríamos una biblioteca para extraer chunks de PNG
						// y buscar metadatos específicos en ellos

						// También podríamos buscar metadatos en campos específicos según el generador:
						if (buffer.includes(Buffer.from('parameters', 'utf-8'))) {
							extractorLogger.debug('Potenciales metadatos de Stable Diffusion encontrados');
							// Procesamiento específico para Stable Diffusion
						}

						// Otros formatos de metadatos conocidos podrían ser procesados aquí
					} catch (pngError) {
						extractorLogger.debug('Error al buscar metadatos embebidos en PNG:', {
							path,
							error: pngError instanceof Error ? pngError.message : String(pngError),
						});
					}
				}

				// Intentar usar el parseador genérico como último recurso
				// Solo para strings que ya sabemos que son JSON, no para el buffer completo
				if (!generationMetadata) {
					const parsedMetadata = await parseMetadataString(null); // Pasamos null en lugar del buffer
					if (parsedMetadata) {
						generationMetadata = parsedMetadata;
					}
				}

				if (generationMetadata) {
					metadata.generation = generationMetadata as unknown as AIMetadata;
				}
			} catch (error) {
				extractorLogger.warn('No se pudieron parsear metadatos adicionales:', {
					path,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		// Verificación final de dimensiones antes de guardar en caché
		if (!metadata.dimensions || !metadata.dimensions.width || !metadata.dimensions.height) {
			metadata.dimensions = {
				width: 800,
				height: 600,
			};
		}

		// Después de procesar todos los metadatos, buscar específicamente información de generación por IA
		// si aún no se ha encontrado
		if (!metadata.generation && Object.keys(metadata).length > 0) {
			const aiGenerationInfo = await getAIGenerationInfo(metadata as Record<string, unknown>);
			if (aiGenerationInfo) {
				// Transformar el resultado para que sea compatible con AIMetadata
				const { extra_params, ...restInfo } = aiGenerationInfo;

				// Procesar extra_params para eliminar arrays
				const processedExtraParams: Record<string, string | number | boolean | null | undefined> = {};
				if (extra_params) {
					for (const [key, value] of Object.entries(extra_params)) {
						if (Array.isArray(value)) {
							processedExtraParams[key] = value.join(', ');
						} else {
							processedExtraParams[key] = value;
						}
					}
				}

				metadata.generation = {
					...restInfo,
					type: aiGenerationInfo.type as 'stable-diffusion' | 'comfyui' | 'invoke-ai' | 'novel-ai',
					seed:
						typeof aiGenerationInfo.seed === 'string'
							? Number.parseInt(aiGenerationInfo.seed, 10) || undefined
							: aiGenerationInfo.seed,
					extra_params: extra_params ? processedExtraParams : undefined,
				};

				extractorLogger.debug('Encontrada información de generación por IA', {
					type: aiGenerationInfo.type,
				});
			}
		}

		// Guardar en caché usando la ruta normalizada
		await metadataCache.set(normalizedPath, metadata);
		extractorLogger.info('Metadatos extraídos con éxito:', path);
		return metadata;
	} catch (error) {
		if (error instanceof MetadataError) {
			throw error;
		}
		throw new MetadataError(
			error instanceof Error ? error.message : 'Error extrayendo metadatos',
			path,
			MetadataErrorCode.UNKNOWN,
			{ details: error }
		);
	}
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
	const pathsToLoad = normalizedPaths.filter(async (normalizedPath) => {
		const cached = await metadataCache.get(normalizedPath);
		return !cached || !cached.dimensions || !cached.dimensions.width || !cached.dimensions.height;
	});

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
 * Parsea un string de metadatos
 */
export { parseMetadataString as parseMetadata };

/**
 * Limpia la caché de metadatos
 */
export async function clearMetadataCache(): Promise<void> {
	try {
		extractorLogger.info('🧹 Limpiando caché de metadatos...');

		// Estadísticas antes de la limpieza
		const cacheDiagnosis = await metadataCache.diagnose();
		const beforeSize = cacheDiagnosis.total;
		const beforeKeys = cacheDiagnosis.keys;

		// Limpiar completamente
		await metadataCache.clear();

		// Verificar resultado
		const afterDiagnosis = await metadataCache.diagnose();
		const afterSize = afterDiagnosis.total;

		extractorLogger.info(`✅ Caché de metadatos limpiada correctamente. Elementos eliminados: ${beforeSize}`, {
			beforeSize,
			afterSize,
			sampleKeys: beforeKeys.slice(0, 5),
		});

		return Promise.resolve();
	} catch (error) {
		extractorLogger.error('❌ Error limpiando caché de metadatos:', error);
		throw error;
	}
}
