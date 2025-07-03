// Usar servicio de imágenes en lugar de server action
import { imageService } from '@/services/image/image.service';
import { serverLogger } from '@/lib/logger/server-logger';
import { convertServerImageToFileItem, type ServerImage } from '@/services/image/converter.service';
import type { FileItem } from '@/types/files';

const log = serverLogger.withContext('SearchService');

export async function searchImages(query: string, limit = 100): Promise<FileItem[]> {
	try {
		log.debug('🔎 Buscando imágenes', { query });
		const result = await getImages({ search: query, pageSize: limit });
		const items = result.images.map((img) => convertServerImageToFileItem(img as unknown as ServerImage));
		return items;
	} catch (error) {
		log.error('❌ Error buscando imágenes', error);
		return [];
	}
}
