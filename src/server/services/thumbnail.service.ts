import { count, desc, eq, isNull, not, sql, sum } from 'drizzle-orm';
import { existsSync } from 'fs';
import PQueue from 'p-queue';
import { thumbsConfig } from '@/config/thumbs';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema/index';
import type { ThumbnailResult as LibThumbResult } from '@/lib/image/thumbnail';
import { generateThumbnail } from '@/lib/image/thumbnail';
import { serverLogger } from '@/lib/logger/server-logger';
import { thumbnailMemoryCache } from '@/services/cache/memory-cache.service';
import {
	generateContentHash,
	readFromCache,
	writeToCache,
	initializeDiskCache,
} from '@/services/cache/disk-cache.service';
import { thumbnailService as baseThumbnailService } from '@/services/thumbnail/index';
import type { ThumbnailStats } from '@/types/stats';
import type { LastProcessedThumbnail, ProcessOptions } from '@/types/thumbnails';

const thumbLogger = serverLogger.withContext('ThumbnailService');

// Cola optimizada con prioridades y gestión avanzada
const queue = new PQueue({
	concurrency: thumbsConfig.concurrency,
	interval: 100, // Procesar cada 100ms para mejor responsiveness
	intervalCap: Math.max(2, Math.floor(thumbsConfig.concurrency / 2)), // Máximo 50% por intervalo
	timeout: 30_000, // 30 segundos timeout
	autoStart: true,
});

// Prioridades para la cola
const PRIORITY = {
	UI_REQUEST: 10, // Solicitudes directas de UI (máxima prioridad)
	BATCH_SMALL: 5, // Lotes pequeños (< 10 imágenes)
	BATCH_LARGE: 1, // Lotes grandes (< 50 imágenes)
	BACKGROUND: 0,  // Tareas de fondo (limpieza, optimización)
} as const;

// Métricas de performance
const metrics = {
	totalRequests: 0,
	cacheHits: 0,
	cacheMisses: 0,
	averageResponseTime: 0,
	requestTimes: [] as number[],
};

// Deduplicación de tareas en vuelo por clave (path+quality)
const inflight = new Map<string, Promise<LibThumbResult>>();

// Queue events para métricas
queue.on('add', () => {
	thumbLogger.debug(`🔄 Tarea añadida a cola. Pendientes: ${queue.size}, Activas: ${queue.pending}`);
});

queue.on('next', () => {
	thumbLogger.debug(`⚡ Procesando siguiente tarea. Restantes: ${queue.size}`);
});

queue.on('idle', () => {
	thumbLogger.debug(`😴 Cola vacía. Métricas: ${metrics.cacheHits} hits, ${metrics.cacheMisses} misses`);
});

queue.on('error', (error) => {
	thumbLogger.error('❌ Error en cola de thumbnails:', error);
});

// Inicializar sistema de cache al arrancar
let cacheInitialized = false;
async function ensureCacheInitialized() {
	if (!cacheInitialized && thumbsConfig.provider === 'disk') {
		await initializeDiskCache();
		cacheInitialized = true;
		thumbLogger.info('✅ Sistema de cache inicializado');
	}
}

// Función para determinar prioridad basada en contexto
function getPriority(context: 'ui' | 'batch-small' | 'batch-large' | 'background' = 'ui'): number {
	switch (context) {
		case 'ui': return PRIORITY.UI_REQUEST;
		case 'batch-small': return PRIORITY.BATCH_SMALL;
		case 'batch-large': return PRIORITY.BATCH_LARGE;
		case 'background': return PRIORITY.BACKGROUND;
		default: return PRIORITY.UI_REQUEST;
	}
}

// Función para actualizar métricas
function updateMetrics(startTime: number, fromCache: boolean) {
	const responseTime = Date.now() - startTime;
	metrics.totalRequests++;
	
	if (fromCache) {
		metrics.cacheHits++;
	} else {
		metrics.cacheMisses++;
	}
	
	metrics.requestTimes.push(responseTime);
	if (metrics.requestTimes.length > 100) {
		metrics.requestTimes.shift(); // Mantener solo últimas 100 mediciones
	}
	
	metrics.averageResponseTime = metrics.requestTimes.reduce((a, b) => a + b, 0) / metrics.requestTimes.length;
}

export interface ThumbnailResponse {
	thumbnailUrl?: string;
	width?: number;
	height?: number;
	size?: number;
	mimeType?: string;
	error?: string;
}

export async function getThumbnail(
	id: string,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM,
	context: 'ui' | 'batch-small' | 'batch-large' | 'background' = 'ui'
): Promise<ThumbnailResponse> {
	const startTime = Date.now();
	
	try {
		// Validar que la calidad sea una de las opciones válidas
		let validQuality = quality;
		if (!Object.values(ThumbnailQuality).includes(quality as ThumbnailQuality)) {
			thumbLogger.warn('⚠️ Calidad inválida, usando MEDIUM por defecto:', quality);
			validQuality = ThumbnailQuality.MEDIUM;
		}

		// Validar el ID de forma estricta
		if (!id || typeof id !== 'string' || id.trim() === '') {
			const error = 'ID no proporcionado o inválido';
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		thumbLogger.debug('🔄 Obteniendo thumbnail:', { id, quality: validQuality, context });

		const image = await db.query.images.findFirst({
			where: eq(images.id, id),
			columns: {
				id: true,
				path: true,
				thumbnail: true,
				thumbnailSize: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailError: true,
				thumbnailMimeType: true,
			},
		});

		if (!image) {
			const error = `Imagen no encontrada: ${id}`;
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		// Si hay un error previo, intentar regenerar
		if (image.thumbnailError) {
			thumbLogger.warn('⚠️ Error previo detectado, intentando regenerar:', {
				id,
				error: image.thumbnailError,
			});
		}

		// Si ya tiene thumbnail en DB y el proveedor activo es DB, devolverlo
		if (image.thumbnail && thumbsConfig.provider === 'db') {
			// No devolver la base64, sino la URL de la API
			const thumbnailUrl = `/api/images/${image.id}/thumbnail`;

			thumbLogger.info('✅ Thumbnail encontrado en caché (servido por API):', {
				id,
				size: image.thumbnailSize,
				width: image.thumbnailWidth,
				height: image.thumbnailHeight,
				url: thumbnailUrl,
			});

			return {
				thumbnailUrl,
				width: image.thumbnailWidth || undefined,
				height: image.thumbnailHeight || undefined,
				size: image.thumbnailSize || undefined,
				mimeType: image.thumbnailMimeType || 'image/webp',
			};
		}

		// Validar que la ruta del archivo exista
		if (!(image.path && existsSync(image.path))) {
			const error = `Archivo no encontrado en ruta: ${image.path}`;
			// Registrar el error en la base de datos
			await db
				.update(images)
				.set({
					thumbnailError: error,
				})
				.where(eq(images.id, id));
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		// Si el proveedor es disco o no hay thumbnail en DB, generar/servir desde disco
		thumbLogger.info(`🔄 Generando/servidor thumbnail (provider=${thumbsConfig.provider}):`, {
			id,
			path: image.path,
		});

		try {
			// Asegurar que el cache esté inicializado
			await ensureCacheInitialized();

			// Clave por ruta + calidad para deduplicar y cachear
			const memKey = `${image.path}:${validQuality}`;
			const sizeKey = validQuality as keyof typeof thumbsConfig.sizes;

			// 1. Verificar cache en memoria primero
			const memCached = thumbnailMemoryCache.get(
				await generateContentHash(image.path + validQuality),
				validQuality
			);
			
			if (memCached) {
				thumbLogger.debug(`✅ Thumbnail servido desde memoria: ${id}`);
				updateMetrics(startTime, true);
				return {
					thumbnailUrl: `/api/images/${id}/thumbnail?quality=${validQuality}`,
					width: memCached.width,
					height: memCached.height,
					size: memCached.buffer.length,
					mimeType: `image/${memCached.format}`,
				};
			}

			// 2. Verificar cache en disco (si provider es disk)
			let thumbnail: LibThumbResult;
			const hash = await generateContentHash(image.path + validQuality);
			
			if (thumbsConfig.provider === 'disk') {
				const diskCached = await readFromCache(hash, sizeKey);
				
				if (diskCached) {
					// Cargar en memoria para próximos accesos
					const buffer = await require('fs').promises.readFile(diskCached.path);
					thumbnailMemoryCache.set(hash, validQuality, buffer, {
						width: diskCached.width,
						height: diskCached.height,
						format: 'webp',
					});
					
					thumbLogger.debug(`✅ Thumbnail servido desde disco: ${id}`);
					updateMetrics(startTime, true);
					return {
						thumbnailUrl: `/api/images/${id}/thumbnail?quality=${validQuality}`,
						width: diskCached.width,
						height: diskCached.height,
						size: diskCached.fileSize,
						mimeType: diskCached.mimeType,
					};
				}
			}

			// 3. Si no está en cache, verificar tareas en vuelo
			const existing = inflight.get(memKey);
			if (existing) {
				thumbnail = await existing;
				inflight.delete(memKey);
			} else {
				// 4. Generar nuevo thumbnail con prioridad según contexto
				const priority = getPriority(context);
				const newPromise = queue.add(
					async (): Promise<LibThumbResult> => {
						thumbLogger.debug(`🎯 Generando thumbnail: ${id} (prioridad: ${priority})`);
						const result = await generateThumbnail(image.path, { quality: validQuality });
						
						// Guardar en cache en memoria
						thumbnailMemoryCache.set(hash, validQuality, result.buffer, {
							width: result.width,
							height: result.height,
							format: result.format,
						});

						// Guardar en cache en disco si el provider es disk
						if (thumbsConfig.provider === 'disk') {
							await writeToCache(hash, sizeKey, result.buffer, {
								width: result.width,
								height: result.height,
							});
						}

						return result;
					},
					{
						priority,
					}
				) as Promise<LibThumbResult>;
				inflight.set(memKey, newPromise);
				thumbnail = await newPromise;
				inflight.delete(memKey);
			}

			updateMetrics(startTime, false);

			if (!thumbnail?.buffer) {
				throw new Error('No se pudo generar el thumbnail');
			}

			// Persistir en DB solo si el proveedor es DB
			if (thumbsConfig.provider === 'db') {
				// Normalizar almacenamiento: columna TEXT espera base64
				await db
					.update(images)
					.set({
						thumbnail: thumbnail.buffer.toString('base64'),
						thumbnailSize: thumbnail.buffer.length,
						thumbnailWidth: thumbnail.width,
						thumbnailHeight: thumbnail.height,
						thumbnailError: null, // Limpiar error previo si existía
						thumbnailMimeType: `image/${thumbnail.format}`,
					})
					.where(eq(images.id, id));
			} else {
				// Registrar metadatos mínimos para estadísticas
				await db
					.update(images)
					.set({
						thumbnailSize: thumbnail.buffer.length,
						thumbnailWidth: thumbnail.width,
						thumbnailHeight: thumbnail.height,
						thumbnailError: null,
						thumbnailMimeType: `image/${thumbnail.format}`,
					})
					.where(eq(images.id, id));
			}

			thumbLogger.info('✅ Nuevo thumbnail generado (servido por API):', {
				id,
				size: thumbnail.buffer.length,
				width: thumbnail.width,
				height: thumbnail.height,
			});

			// Responder URL consistente; si provider es disk, la ruta sigue siendo la misma
			return {
				thumbnailUrl: `/api/images/${id}/thumbnail`,
				width: thumbnail.width,
				height: thumbnail.height,
				size: thumbnail.buffer.length,
				mimeType: `image/${thumbnail.format}`,
			};
		} catch (genError) {
			// Registrar el error en la imagen
			const errorMessage = genError instanceof Error ? genError.message : 'Error desconocido';
			await db
				.update(images)
				.set({
					thumbnailError: errorMessage,
				})
				.where(eq(images.id, id));

			thumbLogger.error('❌ Error generando thumbnail:', genError);
			return {
				thumbnailUrl: '',
				error: errorMessage,
			};
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		thumbLogger.error('❌ Error obteniendo thumbnail:', { error: errorMessage, id });
		return {
			thumbnailUrl: '',
			error: errorMessage,
		};
	}
}

export async function optimizeThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando optimización de thumbnails');
		return await baseThumbnailService.optimizeThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error optimizando thumbnails:', error);
		throw error;
	}
}

export async function reprocessThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando reprocesamiento de thumbnails');
		return await baseThumbnailService.reprocessAll(options);
	} catch (error) {
		thumbLogger.error('❌ Error reprocesando thumbnails:', error);
		throw error;
	}
}

export async function cleanThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando limpieza de thumbnails');
		return await baseThumbnailService.cleanThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error limpiando thumbnails:', error);
		throw error;
	}
}

/**
 * 📊 Obtiene métricas del sistema de thumbnails
 */
export function getThumbnailMetrics() {
	return {
		queue: {
			size: queue.size,
			pending: queue.pending,
			isPaused: queue.isPaused,
		},
		performance: {
			totalRequests: metrics.totalRequests,
			cacheHitRate: metrics.totalRequests > 0 ? metrics.cacheHits / metrics.totalRequests : 0,
			cacheMissRate: metrics.totalRequests > 0 ? metrics.cacheMisses / metrics.totalRequests : 0,
			averageResponseTime: metrics.averageResponseTime,
		},
		memory: thumbnailMemoryCache.getStats(),
		inflight: inflight.size,
	};
}

export async function getLastProcessedThumbnails(limit = 9): Promise<LastProcessedThumbnail[]> {
	try {
		thumbLogger.info('🔄 Obteniendo últimas miniaturas procesadas:', { limit });

		const imagesData = await db.query.images.findMany({
			where: not(isNull(images.thumbnail)),
			orderBy: desc(images.updatedAt),
			limit,
			columns: {
				id: true,
				path: true,
				updatedAt: true,
				thumbnailSize: true,
			},
		});

		return imagesData.map((image: any) => ({
			id: image.id,
			path: image.path,
			processedAt: image.updatedAt,
			status: 'success' as const,
		}));
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo últimas miniaturas:', error);
		throw error;
	}
}

export async function getThumbnailStats(): Promise<ThumbnailStats> {
	try {
		thumbLogger.info('🔄 Obteniendo estadísticas de thumbnails');

		// Verificar la conexión a la base de datos antes de continuar
		try {
			// Consulta simple para verificar la conexión
			await db.execute(sql`SELECT 1`);
		} catch (dbError) {
			thumbLogger.error('❌ Error de conexión a la base de datos:', dbError);
			throw new Error('No se pudo conectar a la base de datos. Verifica tu conexión.');
		}

		const [totalFilesResult, withThumbnailResult, pendingResult, errorsData, totalSizeResult] = await Promise.all([
			db.select({ count: count() }).from(images),
			db
				.select({ count: count() })
				.from(images)
				.where(not(isNull(images.thumbnail))),
			db.select({ count: count() }).from(images).where(isNull(images.thumbnail)),
			db.query.images.findMany({
				where: not(isNull(images.thumbnailError)),
				columns: {
					id: true,
					path: true,
					thumbnailError: true,
					updatedAt: true,
				},
			}),
			db
				.select({ totalSize: sum(images.thumbnailSize) })
				.from(images)
				.where(not(isNull(images.thumbnailSize))),
		]);

		const totalFiles = totalFilesResult[0].count;
		const withThumbnail = withThumbnailResult[0].count;
		const pending = pendingResult[0].count;
		const errors = errorsData;
		const totalSize = totalSizeResult[0].totalSize || 0;

		return {
			total: totalFiles,
			processed: withThumbnail,
			pending,
			errors: errors.length,
			totalFiles,
			totalSize,
		};
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo estadísticas:', error);

		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Error al obtener estadísticas de miniaturas. Por favor, intenta más tarde.');
	}
}

export async function verifySignedToken(token: string): Promise<{ buffer: Buffer; mimeType: string }> {
	try {
		thumbLogger.info('🔄 Verificando token firmado:', token);

		// TODO: Implementar lógica real de verificación de token
		// Por ahora retornamos un placeholder
		throw new Error('Token verification not implemented yet');
	} catch (error) {
		thumbLogger.error('❌ Error verificando token:', error);
		throw new Error(`Token inválido: ${token}`);
	}
}

export async function bulkGenerateThumbnails(imageIds: string[], options?: ProcessOptions) {
	const quality = options?.quality as ThumbnailQuality || ThumbnailQuality.MEDIUM;
	const maxConcurrency = options?.maxConcurrency || thumbsConfig.concurrency;
	
	thumbLogger.info(`� Iniciando generación en lote: ${imageIds.length} imágenes`);
	
	// Determinar prioridad según el tamaño del lote
	const context = imageIds.length <= 10 ? 'batch-small' : 'batch-large';
	
	const success: string[] = [];
	const errors: Array<{ id: string; error: string }> = [];
	
	// Procesar en chunks para no sobrecargar el sistema
	const chunkSize = Math.min(maxConcurrency, 10);
	const chunks = [];
	
	for (let i = 0; i < imageIds.length; i += chunkSize) {
		chunks.push(imageIds.slice(i, i + chunkSize));
	}
	
	for (const chunk of chunks) {
		const promises = chunk.map(async (id) => {
			try {
				const result = await getThumbnail(id, quality, context);
				if (result.error) {
					errors.push({ id, error: result.error });
				} else {
					success.push(id);
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
				errors.push({ id, error: errorMsg });
			}
		});
		
		await Promise.all(promises);
		
		// Pequeña pausa entre chunks para permitir otras tareas
		if (chunks.length > 1) {
			await new Promise(resolve => setTimeout(resolve, 50));
		}
	}
	
	thumbLogger.info(`✅ Lote completado: ${success.length} éxitos, ${errors.length} errores`);
	
	return { 
		generated: success, 
		errors,
		metrics: getThumbnailMetrics()
	};
}

export async function deleteThumbnail(imageId: string): Promise<{ success: boolean; message: string }> {
	try {
		thumbLogger.info(`🗑️ Eliminando thumbnail para imagen: ${imageId}`);

		const image = await db.query.images.findFirst({
			where: eq(images.id, imageId),
			columns: { id: true, thumbnail: true },
		});

		if (!image) {
			return { success: false, message: 'Imagen no encontrada' };
		}

		if (!image.thumbnail) {
			return { success: true, message: 'Thumbnail no existe para esta imagen' };
		}

		await db
			.update(images)
			.set({
				thumbnail: null,
				thumbnailSize: null,
				thumbnailWidth: null,
				thumbnailHeight: null,
				thumbnailMimeType: null,
				thumbnailError: null,
			})
			.where(eq(images.id, imageId));

		thumbLogger.info(`✅ Thumbnail eliminado para imagen: ${imageId}`);
		return { success: true, message: 'Thumbnail eliminado exitosamente' };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		thumbLogger.error(`❌ Error eliminando thumbnail para imagen ${imageId}:`, error);
		return { success: false, message: `Error eliminando thumbnail: ${errorMessage}` };
	}
}
