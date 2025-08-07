import { generateThumbnailUrl } from '@/lib/utils/image-utils';
import type { AnyEntityWithStats } from '@/types/entities';

/**
 * Obtiene la URL de la imagen principal para mostrar en el panel de detalles
 */
export const getMainImageUrl = (item: AnyEntityWithStats): string | null => {
	// Para imágenes, usar la API de thumbnails
	if (item.entityType === 'image' && item.id) {
		return generateThumbnailUrl(item.id);
	}

	// Fallbacks para otros casos
	if ('thumbnailUrl' in item && typeof item.thumbnailUrl === 'string') {
		return item.thumbnailUrl;
	}

	if ('thumbnail' in item && typeof item.thumbnail === 'string') {
		return `data:image/jpeg;base64,${item.thumbnail}`;
	}

	if ('featuredImage' in item && typeof item.featuredImage === 'string') {
		return item.featuredImage;
	}

	return null;
};
