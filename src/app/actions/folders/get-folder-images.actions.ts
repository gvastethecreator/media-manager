'use server';

import { getThumbnail } from '@/app/actions/images/image-thumbnails.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
	RelatedAlbum,
	RelatedCharacter,
	RelatedCollection,
	RelatedPlace,
	RelatedTag,
	RelatedWorldItem,
} from '@/types/file-item';
import { ThumbnailQuality } from '@/types/thumbnails';
import path from 'path';
import { z } from 'zod';

const imagesActionsLogger = serverLogger.withContext('FolderImagesActions');

/**
 * 🔒 API Response File Item - SEGURO PARA SERIALIZACIÓN
 * 
 * Esta interfaz define un formato seguro para enviar al cliente,
 * eliminando cualquier posibilidad de datos binarios no serializables.
 * 
 * ⚠️ IMPORTANTE: No usar spread de objetos de Prisma, solo campos explícitamente
 * transformados a tipos serializables.
 */
interface ApiResponseFileItem {
	id: string;
	name: string;
	path: string;
	type: 'image';
	size: number;
	width: number | null;
	height: number | null;
	metadata: string; // ¡String serializado JSON, nunca objeto!
	thumbnail: string | null; // ¡Siempre URL o base64, nunca Buffer!
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean; // Garantizamos tipo boolean
	isFavorite: boolean; // Garantizamos tipo boolean
	folderId: string;
	createdAt: string; // ¡ISO string, no objeto Date!
	updatedAt: string; // ¡ISO string, no objeto Date!
	modifiedAt: string; // ¡ISO string, no objeto Date!
	accessedAt: string; // ¡ISO string, no objeto Date!
	collections: RelatedCollection[];
	tags: RelatedTag[];
	albums: RelatedAlbum[];
	characters: RelatedCharacter[];
	places: RelatedPlace[];
	objects: RelatedWorldItem[];
}

// Validación con Zod para garantizar serialización segura
const apiResponseFileItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	path: z.string(),
	type: z.literal('image'),
	size: z.number(),
	width: z.number().nullable(),
	height: z.number().nullable(),
	metadata: z.string(), // JSON string
	thumbnail: z.string().nullable(), // String URL o base64
	thumbnailSize: z.number().nullable(),
	thumbnailWidth: z.number().nullable(),
	thumbnailHeight: z.number().nullable(),
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	folderId: z.string(),
	createdAt: z.string(), // ISO string
	updatedAt: z.string(),
	modifiedAt: z.string(),
	accessedAt: z.string(),
	collections: z.array(z.object({
		id: z.string(),
		name: z.string()
	})),
	tags: z.array(z.object({
		id: z.string(),
		name: z.string(),
		color: z.string()
	})),
	albums: z.array(z.object({
		id: z.string(),
		name: z.string()
	})),
	characters: z.array(z.object({
		id: z.string(),
		name: z.string()
	})),
	places: z.array(z.object({
		id: z.string(),
		name: z.string()
	})),
	objects: z.array(z.object({
		id: z.string(),
		name: z.string()
	}))
});

/**
 * 🔒 Obtiene las imágenes de una carpeta con formato seguro para serialización
 * 
 * Este Server Action realiza una transformación completa de los datos de Prisma
 * a un formato seguro para serialización, eliminando cualquier referencia a
 * objetos binarios (Buffer/Uint8Array) u otros tipos no serializables.
 * 
 * @param folderId ID de la carpeta
 * @returns Objeto con items (imágenes) y metadata de carpeta, 100% serializable
 */
export async function getFolderImages(folderId: string) {
	try {
		imagesActionsLogger.info('⚡ Server Action: getFolderImages', { folderId });

		// Paso 1: Obtener datos de Prisma
		const folderData = await prisma.folder.findUnique({
			where: { id: folderId },
			include: {
				images: {
					orderBy: { name: 'asc' },
					include: {
						stats: true,
						tags: { select: { id: true, name: true, color: true } },
						collections: { select: { id: true, name: true, color: true } },
					},
				},
			},
		});

		// Paso 2: Validar existencia de la carpeta
		if (!folderData) {
			imagesActionsLogger.error('❌ Carpeta no encontrada:', { folderId });
			return { error: 'Carpeta no encontrada', status: 404, items: [], folder: null };
		}

		imagesActionsLogger.info('✅ Carpeta encontrada:', {
			id: folderData.id,
			name: folderData.name,
			imageCount: folderData.images.length,
		});				// Paso 3: Transformar cada imagen a formato seguro
		const safeFiles: ApiResponseFileItem[] = await Promise.all(
			folderData.images.map(async (imgRecord) => {
				// 📊 Procesar metadata como string JSON
				const metadataObj = imgRecord.metadata ? JSON.parse(imgRecord.metadata) : {};
				const safeMetadata = {
					mimeType: metadataObj.mimeType || 'image/jpeg',
					size: imgRecord.size,
					dimensions: imgRecord.width && imgRecord.height 
						? { width: imgRecord.width, height: imgRecord.height } 
						: undefined,
					fileSystem: {
						size: imgRecord.size,
						created: imgRecord.createdAt.toISOString(),
						modified: imgRecord.updatedAt.toISOString(),
						accessed: imgRecord.updatedAt.toISOString(),
					},
					extension: imgRecord.path ? path.extname(imgRecord.path).slice(1) : undefined,
					exif: metadataObj.exif || undefined,
					generation: metadataObj.generation || undefined,
				};

				// 🔗 Transformar relaciones a formato seguro
				const safeCollections: RelatedCollection[] = imgRecord.collections.map((c) => ({
					id: c.id,
					name: c.name,
				}));
				
				const safeTags: RelatedTag[] = imgRecord.tags.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#808080',
				}));

				// 🖼️ Obtener o crear thumbnail serializable
				let thumbnailUrl: string | null = null;
				try {
					thumbnailUrl = await getThumbnail(imgRecord.id, ThumbnailQuality.MEDIUM);
				} catch (err) {
					imagesActionsLogger.warn('No se pudo obtener thumbnail para imagen', { 
						imageId: imgRecord.id, 
						error: err 
					});
				}

				// 🏞️ Determinar valor final del thumbnail (siempre string o null)
				let safeThumbnail: string | null = null;
				
				if (thumbnailUrl) {
					// Caso 1: Tenemos URL directa (mejor opción)
					safeThumbnail = thumbnailUrl;
				} else if (imgRecord.thumbnail) {
					// Caso 2: Tenemos buffer que debemos convertir a base64
					// Verificamos el tipo para evitar intentar convertir si ya es string
					const thumbnailBuffer = typeof imgRecord.thumbnail === 'string'
						? Buffer.from(imgRecord.thumbnail) // Si ya es string por alguna razón
						: Buffer.from(imgRecord.thumbnail); // Si es Buffer/Uint8Array

					const mimeType = safeMetadata.mimeType || 'image/webp';
					safeThumbnail = `data:${mimeType};base64,${thumbnailBuffer.toString('base64')}`;
				}

				// Determinar si la imagen es pública y favorita
				// Aseguramos valores booleanos explícitos
				const isPublic = Boolean(
					'isPublic' in imgRecord ? imgRecord.isPublic : false
				);
				
				const isFavorite = Boolean(
					'isFavorite' in imgRecord ? imgRecord.isFavorite : false
				);

				// 🛡️ Crear objeto completamente nuevo (sin spread del objeto de Prisma)
				// con tipos explícitamente seguros para serialización
				const safeFileItem: ApiResponseFileItem = {
					id: imgRecord.id,
					name: imgRecord.name || 'Sin nombre',
					path: imgRecord.path || '',
					type: 'image',
					size: imgRecord.size || 0,
					width: imgRecord.width || null,
					height: imgRecord.height || null,
					metadata: JSON.stringify(safeMetadata),
					thumbnail: safeThumbnail,
					thumbnailSize: 'thumbnailSize' in imgRecord ? imgRecord.thumbnailSize : null,
					thumbnailWidth: 'thumbnailWidth' in imgRecord ? imgRecord.thumbnailWidth : null,
					thumbnailHeight: 'thumbnailHeight' in imgRecord ? imgRecord.thumbnailHeight : null,
					isPublic: isPublic,
					isFavorite: isFavorite,
					folderId: folderData.id,
					createdAt: imgRecord.createdAt.toISOString(),
					updatedAt: imgRecord.updatedAt.toISOString(),
					modifiedAt: imgRecord.updatedAt.toISOString(),
					accessedAt: imgRecord.updatedAt.toISOString(),
					collections: safeCollections,
					tags: safeTags,
					albums: [],
					characters: [],
					places: [],
					objects: [],
				};

				// ✅ Validar que el objeto cumple con el esquema (en desarrollo)
				if (process.env.NODE_ENV === 'development') {
					try {
						apiResponseFileItemSchema.parse(safeFileItem);
					} catch (validationError) {
						imagesActionsLogger.error('❌ Error validación de schema de imagen:', { 
							imageId: imgRecord.id,
							error: validationError
						});
					}
				}

				return safeFileItem;
			})
		);

		// Paso 4: Crear respuesta final con carpeta segura para serialización
		const safeResponse = {
			items: safeFiles,
			folder: {
				id: folderData.id,
				name: folderData.name,
				path: folderData.path,
				totalFiles: folderData.totalFiles || 0,
				totalSize: folderData.totalSize || 0,
			},
			status: 200,
		};

		return safeResponse;
	} catch (error) {
		imagesActionsLogger.error('❌ Error obteniendo imágenes de carpeta:', error);
		return {
			error: `Error interno del servidor: ${error instanceof Error ? error.message : String(error)}`,
			status: 500,
			items: [],
			folder: null,
		};
	}
}
