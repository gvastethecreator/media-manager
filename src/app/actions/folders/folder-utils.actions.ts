'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { checkPathExists } from '@/lib/path-utils';
import type {
	FileItem,
	RelatedAlbum,
	RelatedCharacter,
	RelatedCollection,
	RelatedConcept,
	RelatedNote,
	RelatedPlace,
	RelatedPrompt,
	RelatedTag,
	RelatedWorldItem,
} from '@/types/file-item';
import { revalidatePath } from 'next/cache';
import type { ImageWithRelations } from './folder-types';

const folderLogger = serverLogger.withContext('FolderUtils');

const REVALIDATE_PATHS = ['/settings', '/folders', '/folders/[id]'] as const;

export async function revalidateAllPaths() {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	folderLogger.info('🔄 Rutas revalidadas');
}

// Interfaz extendida para añadir compatibilidad sin usar 'any'
// Esta interfaz extiende FileItem para incluir la propiedad 'src' que es necesaria
// para la visualización de imágenes en la interfaz de usuario
interface FileItemWithSrc extends FileItem {
	src: string;
}

/**
 * Transforma un objeto de imagen a un objeto FileItem
 */
export async function transformImageToFileItem(image: ImageWithRelations): Promise<FileItemWithSrc> {
	try {
		serverLogger.debug('🏞️ Transformando imagen a FileItem:', image.id);

		// Parsear metadata si existe
		let metadataString = '';
		if (image.metadata) {
			try {
				// Intentar validar que sea JSON válido
				metadataString = JSON.stringify(image.metadata);
				JSON.parse(metadataString);
			} catch (error) {
				serverLogger.error('⚠️ Error parseando metadata:', error);
				// Si no es JSON válido, lo guardamos como string
				metadataString = JSON.stringify(image.metadata);
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
					color: '#94a3b8', // Color predeterminado
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

		// Transformar objetos del mundo
		const worldItems: RelatedWorldItem[] = Array.isArray(image.worldItems)
			? image.worldItems.map((w) => ({
					id: w?.id || '',
					name: w?.name || '',
				}))
			: [];

		// Transformar conceptos (si existen)
		const concepts: RelatedConcept[] = [];

		// Transformar prompts (si existen)
		const prompts: RelatedPrompt[] = [];

		// Transformar notas (si existen)
		const notes: RelatedNote[] = [];

		// Transformar stats (si existen)
		const stats = null;

		// Procesar thumbnail si existe
		let thumbnailBase64 = '';
		if (image.thumbnail && Buffer.isBuffer(image.thumbnail)) {
			try {
				thumbnailBase64 = `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
				serverLogger.debug('✅ Thumbnail convertido a base64', {
					imageId: image.id,
					thumbnailSize: image.thumbnailSize,
					thumbnailLength: thumbnailBase64.length,
				});
			} catch (error) {
				serverLogger.error('❌ Error convirtiendo thumbnail a base64:', error);
			}
		}

		const fileItem: FileItemWithSrc = {
			id: image.id || '',
			hash: '',
			name: image.name || '',
			path: image.path || '',
			type: 'image',
			size: image.size ? Number(image.size) : 0,
			width: image.width ? Number(image.width) : 0,
			height: image.height ? Number(image.height) : 0,
			metadata: metadataString,
			thumbnail: thumbnailBase64,
			thumbnailSize: image.thumbnailSize ? Number(image.thumbnailSize) : null,
			thumbnailWidth: image.thumbnailWidth ? Number(image.thumbnailWidth) : null,
			thumbnailHeight: image.thumbnailHeight ? Number(image.thumbnailHeight) : null,
			thumbnailError: null,
			thumbnailErrorAt: null,
			thumbnailOptimizedAt: null,
			isPublic: Boolean(image.isPublic),
			isFavorite: Boolean(image.isFavorite),
			folderId: image.folderId || 'default', // Asegurar que siempre haya un folderId
			createdAt: image.createdAt ? new Date(image.createdAt) : new Date(),
			updatedAt: image.updatedAt ? new Date(image.updatedAt) : new Date(),
			collections,
			tags,
			albums,
			characters,
			places,
			worldItems,
			concepts,
			prompts,
			notes,
			stats,
			src: '', // Se llenará después
		};

		// Generar URL para la imagen
		fileItem.src = `/api/images/${fileItem.id}`;

		return fileItem;
	} catch (error) {
		serverLogger.error('❌ Error transformando imagen a FileItem:', error);
		throw error;
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
