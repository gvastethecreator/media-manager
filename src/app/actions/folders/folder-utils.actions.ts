'use server';

import { existsSync } from 'fs';
import { join, normalize, sep } from 'node:path';
import { logger } from '@/lib/logger/logger';
import { checkPathExists, generatePathVariants, normalizePath } from '@/lib/path-utils';
import type {
	FileItem,
	RelatedAlbum,
	RelatedCharacter,
	RelatedCollection,
	RelatedPlace,
	RelatedTag,
	RelatedWorldItem,
} from '@/types/file-item';
import { revalidatePath } from 'next/cache';
import type { ImageWithRelations } from './folder-types.actions';

const folderLogger = logger.withContext('FolderUtils');

const REVALIDATE_PATHS = ['/settings', '/folders', '/folders/[id]'] as const;

export async function revalidateAllPaths() {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	folderLogger.info('🔄 Rutas revalidadas');
}

// Interfaz extendida para añadir compatibilidad sin usar 'any'
interface FileItemWithSrc extends FileItem {
	src: string;
}

/**
 * Transforma un objeto de imagen a un objeto FileItem
 */
export async function transformImageToFileItem(image: ImageWithRelations): Promise<FileItemWithSrc> {
	try {
		if (!image || typeof image !== 'object') {
			throw new Error('Invalid image object');
		}

		// Asegurar que el ID de la carpeta esté presente, es un campo requerido
		if (!image.folderId) {
			folderLogger.warn('⚠️ Imagen sin folderId, usando valor por defecto:', image.id);
		}

		// Preparar los metadatos como string JSON
		let metadataString: string | null = null;
		if (image.metadata) {
			try {
				if (typeof image.metadata === 'string') {
					// Verificar que es un JSON válido
					JSON.parse(image.metadata);
					metadataString = image.metadata;
				} else {
					// Convertir el objeto a string JSON
					metadataString = JSON.stringify({
						dimensions: {
							width: Number(image.width) || 0,
							height: Number(image.height) || 0,
						},
						...image.metadata,
					});
				}
			} catch (err) {
				folderLogger.warn('⚠️ Error al procesar metadata, ignorando:', err);
				metadataString = JSON.stringify({
					dimensions: {
						width: Number(image.width) || 0,
						height: Number(image.height) || 0,
					},
				});
			}
		}

		// Transformar colecciones
		const collections: RelatedCollection[] = Array.isArray(image.collections)
			? image.collections.map((c) => ({
					id: c?.id || '',
					name: c?.name || '',
				}))
			: [];

		// Transformar tags
		const tags: RelatedTag[] = Array.isArray(image.tags)
			? image.tags.map((t) => ({
					id: t?.id || '',
					name: t?.name || '',
					color: '#94a3b8', // Color por defecto para tags
				}))
			: [];

		// Transformar álbumes
		const albums: RelatedAlbum[] = Array.isArray(image.albums)
			? image.albums.map((a) => ({
					id: a?.id || '',
					name: a?.name || '',
				}))
			: [];

		// Transformar personajes
		const characters: RelatedCharacter[] = Array.isArray(image.characters)
			? image.characters.map((c) => ({
					id: c?.id || '',
					name: c?.name || '',
				}))
			: [];

		// Transformar lugares
		const places: RelatedPlace[] = Array.isArray(image.places)
			? image.places.map((p) => ({
					id: p?.id || '',
					name: p?.name || '',
				}))
			: [];

		// Transformar objetos del mundo (worldItems)
		const worldItems: RelatedWorldItem[] = Array.isArray(image.worldItems)
			? image.worldItems.map((wi) => ({
					id: wi?.id || '',
					name: wi?.name || '',
				}))
			: [];

		// Crear un objeto FileItem que cumpla con la interfaz definida en types/file-item.ts
		const fileItem: FileItemWithSrc = {
			id: image.id || '',
			name: image.name || '',
			path: image.path || '',
			type: 'image',
			size: Number(image.size) || 0,
			width: image.width ? Number(image.width) : null,
			height: image.height ? Number(image.height) : null,
			metadata: metadataString,
			thumbnail: image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : null,
			thumbnailSize: image.thumbnailSize ? Number(image.thumbnailSize) : null,
			thumbnailWidth: image.thumbnailWidth ? Number(image.thumbnailWidth) : null,
			thumbnailHeight: image.thumbnailHeight ? Number(image.thumbnailHeight) : null,
			isPublic: Boolean(image.isPublic),
			isFavorite: Boolean(image.isFavorite),
			folderId: image.folderId || 'default', // Asegurar que siempre haya un folderId
			createdAt: image.createdAt instanceof Date ? image.createdAt : new Date(image.createdAt || Date.now()),
			updatedAt: image.updatedAt instanceof Date ? image.updatedAt : new Date(image.updatedAt || Date.now()),
			modifiedAt: image.updatedAt instanceof Date ? image.updatedAt : new Date(image.updatedAt || Date.now()),
			accessedAt: image.updatedAt instanceof Date ? image.updatedAt : new Date(image.updatedAt || Date.now()),
			collections,
			tags,
			albums,
			characters,
			places,
			worldItems,
			src: image.path || '',
		};

		return fileItem;
	} catch (error) {
		folderLogger.error('❌ Error transformando imagen:', error);
		throw new Error(`Error transformando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Versión asíncrona para verificar si una ruta existe
 * Esta función simplemente envuelve checkPathExists en una función asíncrona
 * para cumplir con los requisitos de Server Actions
 */
export async function verifyPathExists(
	normalizedPath: string,
	originalPath: string
): Promise<{
	exists: boolean;
	foundPath?: string;
	checkedPaths: string[];
}> {
	return checkPathExists(normalizedPath, originalPath);
}
