import type { ImageItem } from '@/components/features/file-viewer/file-viewer';
import type { AnyEntity, EntityType } from '@/types/entities';
import type { FileItem } from '@/types/files';

/**
 * Convierte un FileItem a un ImageItem compatible con el FileViewer
 */
export function fileItemToImageItem(file: FileItem): ImageItem {
	return {
		id: file.id,
		name: file.name || '',
		src: file.thumbnail || `/api/images/${file.id}/content`,
		alt: file.name || '',
		width: 0,
		height: 0,
		thumbnail: file.thumbnail || null,
		type: file.type || 'image',
		path: file.path || '',
		size: file.size || 0,
		mimeType: file.mimeType || '',
		metadata: file.metadata || null,
		url: file.thumbnail || `/api/images/${file.id}/content`,
		originalPath: file.path || '',
		format: file.type?.split('/')[1] || '',
		parsedMetadata: undefined,
	};
}

/**
 * Convierte un array de FileItem a un array de ImageItem
 */
export function fileItemsToImageItems(files: FileItem[]): ImageItem[] {
	return files.map(fileItemToImageItem);
}

/**
 * Convierte un FileItem en un objeto AnyEntity compatible con EntityCard.
 * @param file - El FileItem a convertir.
 * @returns Un objeto AnyEntity.
 */
export function fileItemToAnyEntity(file: FileItem): AnyEntity {
	let entityType: EntityType = 'image';
	let basePath = 'images';

	if (file.type?.startsWith('video/')) {
		entityType = 'video';
		basePath = 'videos';
	} else if (file.type === 'folder') {
		entityType = 'folder';
		basePath = 'folders';
	} else if (file.type?.startsWith('audio/')) {
		entityType = 'audio';
		basePath = 'audios';
	} else if (file.type === 'application/pdf') {
		entityType = 'document';
		basePath = 'documents';
	}

	return {
		id: file.id,
		entityType: entityType,
		name: file.name,
		thumbnail: file.thumbnail || `/${basePath}/${file.id}/thumbnail`,
		// Campos requeridos por AnyEntity que pueden no estar en FileItem
		href: `/${basePath}/${file.id}`,
		isFavorite: file.isFavorite || false,
		tags: [], // FileItem no tiene tags, inicializamos como array vacío
		// Mapeo de campos comunes
		createdAt: file.createdAt || new Date().toISOString(),
		updatedAt: file.updatedAt || new Date().toISOString(),
		// Añadimos campos específicos si existen en metadata
		...(file.metadata || {}),
	} as AnyEntity; // Usamos una aserción de tipo aquí, asumiendo que la estructura es correcta
}

/**
 * Convierte un array de FileItem a un array de AnyEntity.
 * @param files - El array de FileItem a convertir.
 * @returns Un array de AnyEntity.
 */
export function fileItemsToAnyEntities(files: FileItem[]): AnyEntity[] {
	return files.map(fileItemToAnyEntity);
}
