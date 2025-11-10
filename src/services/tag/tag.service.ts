/**
 * @file Servicio de gestión de etiquetas
 * @module services/tag/tag.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de etiquetas
 * @updated 2025-07-03 - ✅ MIGRADO COMPLETAMENTE A DRIZZLE ORM
 * @updated 2025-11-10 - ✅ MODULARIZADO EN SUBDIRECTORIOS
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { TagCreateInput, TagUpdateInput, TagWithStats } from '@/types/entities/tag';

// ===================== EXPORTS DESDE MÓDULOS =====================
// Exportar tipos y constantes
export { TAG_EVENTS, notifyTagChange } from './events/tag-events';
export { TagServiceError, type GetTagsOptions, type GetTagsResult } from './types/tag-service.types';

// Exportar funciones de consulta
export { getTag, getTags, getTagThumbnails } from './queries/tag-queries';

// Exportar funciones de mutación
export { createTag, updateTag, deleteTag, toggleTagFavorite, toggleTagArchive, addImageToTag } from './mutations/tag-mutations';

// Exportar funciones de estadísticas
export { getTagStats, type TagStats } from './stats/tag-stats';

// ===================== IMPORTS PARA SERVICIO AGREGADOR =====================
import { TAG_EVENTS, notifyTagChange } from './events/tag-events';
import { TagServiceError } from './types/tag-service.types';
import { getTag, getTags, getTagThumbnails } from './queries/tag-queries';
import { createTag, updateTag, deleteTag, toggleTagFavorite, toggleTagArchive, addImageToTag } from './mutations/tag-mutations';
import { getTagStats } from './stats/tag-stats';

const logger = serverLogger.withContext('TagService');

// ===================== CLASE LEGACY (DEPRECATED) =====================
/**
 * Clase de servicio para gestión de etiquetas
 * @deprecated Usar las funciones exportadas directamente en lugar de esta clase
 */
export class TagService {
	async getTags(filters?: any): Promise<{ tags: TagWithStats[]; total: number }> {
		const result = await getTags(filters || {});
		return result;
	}

	async getTagById(id: string): Promise<TagWithStats | null> {
		return await getTag(id);
	}

	async createTag(data: TagCreateInput): Promise<TagWithStats> {
		return await createTag(data);
	}

	async updateTag(id: string, data: TagUpdateInput): Promise<TagWithStats | null> {
		try {
			return await updateTag(id, data);
		} catch (error) {
			if (error instanceof TagServiceError && error.code === 'TAG_NOT_FOUND') {
				return null;
			}
			throw error;
		}
	}

	async deleteTag(id: string): Promise<boolean> {
		try {
			await deleteTag(id);
			return true;
		} catch (error) {
			if (error instanceof TagServiceError && error.code === 'TAG_NOT_FOUND') {
				return false;
			}
			throw error;
		}
	}

	async getTagImages(id: string): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes de la etiqueta
		logger.info(`Obteniendo imágenes de la etiqueta ${id}`);
		return [];
	}

	async getRecentTagImages(id: string, limit: number): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes recientes de la etiqueta
		logger.info(`Obteniendo imágenes recientes de la etiqueta ${id} (limit: ${limit})`);
		return [];
	}

	async addImageToTag(tagId: string, imageId: string): Promise<void> {
		// TODO: Implementar lógica para agregar imagen a etiqueta
		logger.info(`Agregando imagen ${imageId} a etiqueta ${tagId}`);
	}

	async getTagThumbnails(
		id: string,
		limit = 6
	): Promise<Array<{ id: string; name?: string | null; thumbnailUrl: string }>> {
		return await getTagThumbnails(id, limit);
	}

	async getTagStats(id: string) {
		return await getTagStats(id);
	}
}

// ===================== SERVICIO AGREGADOR =====================
const tagService = {
	getTag,
	getTags,
	createTag,
	updateTag,
	deleteTag,
	toggleTagFavorite,
	toggleTagArchive,
	addImageToTag,
	getTagThumbnails,
	getTagStats,
	notifyTagChange,
	TAG_EVENTS,
	TagServiceError,
};

export default tagService;
