import type { ImageItem } from '@/components/features/file-viewer/file-viewer';
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
