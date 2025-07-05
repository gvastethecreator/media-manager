/**
 * @file Servicio para operaciones con metadatos
 * @module services/metadata/metadata.service
 * ✅ MIGRADO A DRIZZLE - 2025-07-03
 * ✅ INCLUYE EXTRACCIÓN DE METADATOS - Migrado desde server actions
 */

import * as crypto from 'crypto';
import { desc, eq } from 'drizzle-orm';
// Imports para extracción de metadatos (migrados desde server actions)
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { NonExistentRelationError } from '#/lib/errors';
// Drizzle imports
import { db } from '@/lib/drizzle';
import { metadatas } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	mapCreateInputToDrizzle,
	mapUpdateInputToDrizzle,
	transformMetadata,
	transformMetadatas,
} from '@/transformers/metadata';
import { MetadataExtended, MetadataToCreate } from '@/types/entities/metadata/extended';
import { MetadataBase } from '@/types/entities/metadata/types';
import type { MediaMetadata } from '@/types/metadata.types';

const metadataLogger = serverLogger.withContext('MetadataService');

// Cache simple en memoria para metadatos (migrado desde server actions)
const metadataCache = new Map<string, MediaMetadata>();

export type MetadataOptions = {
	skipExif?: boolean;
	skipIptc?: boolean;
	skipXmp?: boolean;
	retry?: {
		maxRetries: number;
		delay: number;
	};
};

const DEFAULT_RETRY_CONFIG = {
	maxRetries: 3,
	delay: 1000,
};

/**
 * Obtiene todos los metadatos
 * @returns Array de metadatos extendidos
 */
export async function getAllMetadata(): Promise<MetadataExtended[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const drizzleMetadatas = await db
			.select({
				id: metadatas.id,
				entityType: metadatas.entityType,
				entityId: metadatas.entityId,
				key: metadatas.key,
				value: metadatas.value,
				type: metadatas.type,
				isPublic: metadatas.isPublic,
				category: metadatas.category,
				description: metadatas.description,
				createdAt: metadatas.createdAt,
				updatedAt: metadatas.updatedAt,
			})
			.from(metadatas)
			.orderBy(desc(metadatas.updatedAt));

		// Transformar a formato compatible con Prisma
		const transformedMetadatas = drizzleMetadatas.map((rawMetadata) => ({
			...rawMetadata,
			isPublic: Boolean(rawMetadata.isPublic),
		}));

		return transformMetadatas(transformedMetadatas as any);
	} catch (error) {
		console.error('Error al obtener metadatos:', error);
		return [];
	}
}

/**
 * Obtiene metadatos por ID de imagen
 * @param imageId - ID de la imagen
 * @returns Metadatos extendidos o null si no se encuentra
 */
export async function getMetadataByImageId(imageId: string): Promise<MetadataExtended | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const drizzleMetadata = await db
			.select({
				id: metadatas.id,
				entityType: metadatas.entityType,
				entityId: metadatas.entityId,
				key: metadatas.key,
				value: metadatas.value,
				type: metadatas.type,
				isPublic: metadatas.isPublic,
				category: metadatas.category,
				description: metadatas.description,
				createdAt: metadatas.createdAt,
				updatedAt: metadatas.updatedAt,
			})
			.from(metadatas)
			.where(eq(metadatas.entityId, imageId))
			.limit(1);

		if (drizzleMetadata.length === 0) {
			return null;
		}

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...drizzleMetadata[0],
			isPublic: Boolean(drizzleMetadata[0].isPublic),
		};

		return transformMetadata(transformedMetadata as any);
	} catch (error) {
		console.error(`Error al obtener metadatos para imagen ${imageId}:`, error);
		return null;
	}
}

/**
 * Obtiene metadatos por ID
 * @param id - ID de los metadatos
 * @returns Metadatos extendidos o null si no se encuentra
 */
export async function getMetadataById(id: string): Promise<MetadataExtended | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const drizzleMetadata = await db
			.select({
				id: metadatas.id,
				entityType: metadatas.entityType,
				entityId: metadatas.entityId,
				key: metadatas.key,
				value: metadatas.value,
				type: metadatas.type,
				isPublic: metadatas.isPublic,
				category: metadatas.category,
				description: metadatas.description,
				createdAt: metadatas.createdAt,
				updatedAt: metadatas.updatedAt,
			})
			.from(metadatas)
			.where(eq(metadatas.id, id))
			.limit(1);

		if (drizzleMetadata.length === 0) {
			return null;
		}

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...drizzleMetadata[0],
			isPublic: Boolean(drizzleMetadata[0].isPublic),
		};

		return transformMetadata(transformedMetadata as any);
	} catch (error) {
		console.error(`Error al obtener metadatos ${id}:`, error);
		return null;
	}
}

/**
 * Crea nuevos metadatos
 * @param data - Datos para crear metadatos
 * @returns Metadatos creados o null si hay error
 */
export async function createMetadata(data: Partial<MetadataBase>): Promise<MetadataExtended | null> {
	try {
		const drizzleData = mapCreateInputToDrizzle(data);

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(metadatas)
			.values({
				id: crypto.randomUUID(),
				entityType: drizzleData.entityType,
				entityId: drizzleData.entityId,
				key: drizzleData.key,
				value: drizzleData.value || null,
				type: drizzleData.type || 'string',
				isPublic: drizzleData.isPublic || false,
				category: drizzleData.category || null,
				description: drizzleData.description || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newMetadata = result[0];

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...newMetadata,
			isPublic: Boolean(newMetadata.isPublic),
		};

		return transformMetadata(transformedMetadata as any);
	} catch (error) {
		console.error('Error al crear metadatos:', error);
		return null;
	}
}

/**
 * Actualiza metadatos existentes
 * @param id - ID de los metadatos
 * @param data - Datos para actualizar
 * @returns Metadatos actualizados o null si hay error
 */
export async function updateMetadata(
	id: string,
	data: Partial<Omit<MetadataBase, 'id' | 'entityId' | 'entityType'>>
): Promise<MetadataExtended | null> {
	try {
		const drizzleData = mapUpdateInputToDrizzle(data);
		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.update(metadatas)
			.set({ ...drizzleData, updatedAt: new Date() })
			.where(eq(metadatas.id, id))
			.returning();

		if (result.length === 0) {
			return null;
		}

		const updatedMetadata = result[0];

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...updatedMetadata,
			isPublic: Boolean(updatedMetadata.isPublic),
		};

		return transformMetadata(transformedMetadata as any);
	} catch (error) {
		console.error(`Error al actualizar metadatos ${id}:`, error);
		return null;
	}
}

/**
 * Actualiza múltiples metadatos en lote.
 * Reutiliza la función `updateMetadata` individual.
 * @param updates - Array de objetos con el id y los datos a actualizar.
 * @returns Un objeto con el número de actualizados y los errores.
 */
export async function updateMultipleMetadata(
	updates: { id: string; data: Partial<Omit<MetadataBase, 'id' | 'entityId' | 'entityType'>> }[]
): Promise<{ updated: number; errors: { id: string; error: string }[] }> {
	const results = await Promise.allSettled(updates.map(({ id, data }) => updateMetadata(id, data)));

	const updatedCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

	const errors = results
		.map((result, index) => ({ result, id: updates[index].id }))
		.filter(({ result }) => result.status === 'rejected' || !result.value)
		.map(({ result, id }) => ({
			id,
			error:
				result.status === 'rejected'
					? (result.reason as Error).message
					: 'La actualización no devolvió un resultado válido.',
		}));

	metadataLogger.info(`Actualización masiva completada. Éxito: ${updatedCount}, Fallos: ${errors.length}`);

	return { updated: updatedCount, errors };
}

/**
 * Elimina metadatos
 * @param id - ID de los metadatos
 * @returns true si se eliminó correctamente, false si hubo error
 */
export async function deleteMetadata(id: string): Promise<boolean> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		await db.delete(metadatas).where(eq(metadatas.id, id));

		return true;
	} catch (error) {
		console.error(`Error al eliminar metadatos ${id}:`, error);
		return false;
	}
}

/**
 * Elimina todos los metadatos asociados a una imagen
 * @param imageId - ID de la imagen
 * @returns true si se eliminaron correctamente, false si hubo error
 */
export async function deleteMetadataByImageId(imageId: string): Promise<boolean> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		await db.delete(metadatas).where(eq(metadatas.entityId, imageId));

		return true;
	} catch (error) {
		console.error(`Error al eliminar metadatos para imagen ${imageId}:`, error);
		return false;
	}
}

// ==========================================
// FUNCIONES DE EXTRACCIÓN DE METADATOS
// Migradas desde src/app/actions/metadata/
// ==========================================

/**
 * Función de reintento con backoff exponencial
 */
async function withRetry<T>(operation: () => Promise<T>, config = DEFAULT_RETRY_CONFIG): Promise<T> {
	let lastError: Error = new Error('Operación fallida después de múltiples reintentos');

	for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt === config.maxRetries) {
				break;
			}

			// Backoff exponencial
			const delay = config.delay * 2 ** (attempt - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Normaliza la ruta para el cache
 */
function normalizePathForCache(path: string): string {
	// Convertir separadores a formato estándar y normalizar
	return path.replace(/\\/g, '/').toLowerCase();
}

/**
 * Verifica si el formato de imagen es soportado
 */
async function isSupportedImageFormat(path: string): Promise<boolean> {
	const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif'];
	const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
	return supportedExtensions.includes(ext);
}

/**
 * Obtiene el formato de imagen
 */
async function getImageFormat(path: string): Promise<string> {
	try {
		const buffer = await fs.readFile(path);
		const metadata = await sharp(buffer).metadata();
		return metadata.format || 'unknown';
	} catch (error) {
		metadataLogger.warn('Error al detectar formato:', { path, error });
		// Fallback basado en extensión
		const ext = path.toLowerCase().substring(path.lastIndexOf('.') + 1);
		return ext || 'unknown';
	}
}

/**
 * Extrae metadatos EXIF básicos
 */
async function parseExifData(buffer: Buffer, path: string): Promise<{ exif: Record<string, unknown> }> {
	try {
		const metadata = await sharp(buffer).metadata();
		const exif: Record<string, unknown> = {};

		if (metadata.exif) {
			// Sharp proporciona algunos metadatos EXIF básicos
			exif.orientation = metadata.orientation;
			exif.density = metadata.density;
		}

		return { exif };
	} catch (error) {
		metadataLogger.warn('Error al extraer EXIF:', { path, error });
		return { exif: {} };
	}
}

/**
 * Extrae información de generación por IA
 */
async function getAIGenerationInfo(metadata: Record<string, unknown>): Promise<any | null> {
	// Buscar patrones comunes de metadatos de IA
	const aiKeys = ['parameters', 'prompt', 'model', 'seed', 'steps'];
	const aiData: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(metadata)) {
		const lowerKey = key.toLowerCase();
		if (aiKeys.some((aiKey) => lowerKey.includes(aiKey))) {
			aiData[key] = value;
		}
	}

	return Object.keys(aiData).length > 0 ? aiData : null;
}

/**
 * Extrae metadatos completos de un archivo de imagen
 * ✅ MIGRADO desde src/app/actions/metadata/metadata-extractors.actions.ts
 */
export async function extractMetadata(path: string, options?: MetadataOptions): Promise<MediaMetadata> {
	metadataLogger.info('Extrayendo metadatos de:', path);
	const normalizedPath = normalizePathForCache(path);

	// Verificar cache
	const cached = metadataCache.get(normalizedPath);
	if (cached?.width && cached.width > 0) {
		metadataLogger.info('Metadatos obtenidos de caché:', path);
		return cached;
	}

	// Verificar soporte del formato
	if (!(await isSupportedImageFormat(path))) {
		throw new Error(`Formato de archivo no soportado: ${path}`);
	}

	// Obtener estadísticas del archivo
	const stats = await withRetry<fs.Stats>(() => fs.stat(path), options?.retry || DEFAULT_RETRY_CONFIG);
	const buffer = await withRetry<Buffer>(() => fs.readFile(path), options?.retry || DEFAULT_RETRY_CONFIG);

	// Inicializar metadatos base
	const metadata: Partial<MediaMetadata> = {
		totalSize: Number(stats.size),
		itemCount: 1,
		lastModified: stats.mtime,
		fileSize: Number(stats.size),
		mimeType: 'image/unknown',
		format: 'unknown',
	};

	try {
		// Extraer metadatos con Sharp
		const sharpInstance = sharp(buffer);
		const sharpMeta = await withRetry<sharp.Metadata>(
			() => sharpInstance.metadata(),
			options?.retry || DEFAULT_RETRY_CONFIG
		);

		// Actualizar campos relevantes
		if (sharpMeta.width) metadata.width = sharpMeta.width;
		if (sharpMeta.height) metadata.height = sharpMeta.height;
		if (sharpMeta.format) {
			metadata.format = sharpMeta.format;
			metadata.mimeType = `image/${sharpMeta.format}`;
		}
		if (sharpMeta.density) metadata.density = sharpMeta.density;
		if (sharpMeta.hasAlpha !== undefined) metadata.hasAlpha = sharpMeta.hasAlpha;
		if (sharpMeta.orientation) metadata.orientation = sharpMeta.orientation;
		if (sharpMeta.space) metadata.colorSpace = sharpMeta.space;
	} catch (sharpError) {
		metadataLogger.warn('Error al extraer metadatos con Sharp:', {
			path,
			error: sharpError instanceof Error ? sharpError.message : String(sharpError),
		});
	}

	// Valores por defecto si no se pudieron obtener
	if (!metadata.width) metadata.width = 800;
	if (!metadata.height) metadata.height = 600;

	// Extraer metadatos adicionales si no están deshabilitados
	if (!options?.skipExif) {
		try {
			const exifData = await parseExifData(buffer, path);
			metadata.exif = exifData.exif;
		} catch (error) {
			metadataLogger.warn('No se pudieron extraer metadatos EXIF', { path });
		}
	}

	// Extraer metadatos de IA
	try {
		const aiMetadata = await getAIGenerationInfo(metadata as Record<string, unknown>);
		if (aiMetadata) {
			metadata.ai = aiMetadata;
		}
	} catch (error) {
		metadataLogger.warn('No se pudieron extraer metadatos de IA', { path });
	}

	// Asegurar que todos los campos requeridos estén presentes
	const finalMetadata: MediaMetadata = {
		totalSize: metadata.totalSize !== undefined && metadata.totalSize !== null ? metadata.totalSize : 0,
		itemCount: metadata.itemCount !== undefined && metadata.itemCount !== null ? metadata.itemCount : 0,
		lastModified: metadata.lastModified !== undefined && metadata.lastModified !== null ? metadata.lastModified : new Date(),
		fileSize: metadata.fileSize !== undefined && metadata.fileSize !== null ? metadata.fileSize : 0,
		mimeType: metadata.mimeType !== undefined && metadata.mimeType !== null ? metadata.mimeType : 'image/unknown',
		format: metadata.format !== undefined && metadata.format !== null ? metadata.format : 'unknown',
		width: metadata.width !== undefined && metadata.width !== null ? metadata.width : undefined,
		height: metadata.height !== undefined && metadata.height !== null ? metadata.height : undefined,
		exif: metadata.exif !== undefined && metadata.exif !== null ? metadata.exif : undefined,
		iptc: metadata.iptc !== undefined && metadata.iptc !== null ? metadata.iptc : undefined,
		xmp: metadata.xmp !== undefined && metadata.xmp !== null ? metadata.xmp : undefined,
		icc: metadata.icc !== undefined && metadata.icc !== null ? metadata.icc : undefined,
		ai: metadata.ai !== undefined && metadata.ai !== null ? metadata.ai : undefined,
		gps: metadata.gps !== undefined && metadata.gps !== null ? metadata.gps : undefined,
		colorSpace: metadata.colorSpace !== undefined && metadata.colorSpace !== null ? metadata.colorSpace : undefined,
		colorProfile: metadata.colorProfile !== undefined && metadata.colorProfile !== null ? metadata.colorProfile : undefined,
		hasAlpha: metadata.hasAlpha !== undefined && metadata.hasAlpha !== null ? metadata.hasAlpha : undefined,
		orientation: metadata.orientation !== undefined && metadata.orientation !== null ? metadata.orientation : undefined,
		density: metadata.density !== undefined && metadata.density !== null ? metadata.density : undefined,
		isAnimated: metadata.isAnimated !== undefined && metadata.isAnimated !== null ? metadata.isAnimated : undefined,
		sizeInBytes: metadata.sizeInBytes !== undefined && metadata.sizeInBytes !== null ? metadata.sizeInBytes : undefined,
		dimensions: metadata.dimensions !== undefined && metadata.dimensions !== null ? metadata.dimensions : undefined,
		duration: metadata.duration !== undefined && metadata.duration !== null ? metadata.duration : undefined,
		encoding: metadata.encoding !== undefined && metadata.encoding !== null ? metadata.encoding : undefined,
		hash: metadata.hash !== undefined && metadata.hash !== null ? metadata.hash : undefined,
		customFields: metadata.customFields !== undefined && metadata.customFields !== null ? metadata.customFields : undefined,
	};

	// Guardar en cache
	metadataCache.set(normalizedPath, finalMetadata);
	return finalMetadata;
}

/**
 * Limpia el cache de metadatos
 * ✅ MIGRADO desde src/app/actions/metadata/metadata-utils.actions.ts
 */
export async function clearMetadataCache(imageId?: string): Promise<void> {
	if (imageId) {
		// Limpiar cache específico (necesitaríamos mapear imageId a path)
		metadataLogger.info('Limpiando cache para imagen específica:', imageId);
		// Por ahora, limpiar todo el cache
		metadataCache.clear();
	} else {
		// Limpiar todo el cache
		metadataLogger.info('Limpiando todo el cache de metadatos');
		metadataCache.clear();
	}
}
