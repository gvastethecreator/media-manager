/**
 * @file Funciones de mapeo para la entidad Activity
 * @module transformers/activity/mappers
 
 */

import { type ActivityFilters, ActivityType, type CreateActivityData } from '../../types/entities/activity/index';

type DrizzleCreateActivityData = {
	type: string;
	description: string;
	imageId?: string | null;
};

type DrizzleWhereFilter = {
	AND?: DrizzleWhereFilter[];
	OR?: DrizzleWhereFilter[];
	type?: { in?: string[] };
	imageId?: string;
	createdAt?: { gte?: Date; lte?: Date };
	description?: { contains?: string };
};

type DrizzleFindManyArgs = {
	where?: DrizzleWhereFilter;
	take?: number;
	skip?: number;
	orderBy?: { [key: string]: 'asc' | 'desc' };
	// Los includes se manejan por separado en Drizzle
};

/**
 * Mapea datos de creación de actividad a formato compatible con Drizzle
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de creación de actividad
 * @returns Objeto formateado para Drizzle
 */
export function mapCreateActivityDataToDrizzle(data: CreateActivityData): DrizzleCreateActivityData {
	return {
		type: data.type,
		description: data.description,
		imageId: data.imageId || null,
	};
}

/**
 * Mapea filtros de actividad a formato compatible con Drizzle para consultas
 * ✅ MIGRADO A DRIZZLE
 * @param filters Filtros de actividad
 * @returns Objeto de condiciones para Drizzle
 */
export function mapActivityFiltersToDrizzle(filters: ActivityFilters): DrizzleFindManyArgs {
	const where: DrizzleWhereFilter = {};

	// Filtrar por tipos de actividad
	if (filters.types && filters.types.length > 0) {
		where.type = { in: filters.types };
	}

	// Filtrar por imagen
	if (filters.imageId) {
		where.imageId = filters.imageId;
	}

	// Filtrar por fechas
	if (filters.startDate || filters.endDate) {
		where.createdAt = {};

		if (filters.startDate) {
			where.createdAt.gte = new Date(filters.startDate);
		}

		if (filters.endDate) {
			where.createdAt.lte = new Date(filters.endDate);
		}
	}

	// Filtrar por búsqueda en descripción
	if (filters.searchQuery) {
		where.description = {
			contains: filters.searchQuery,
		};
	}

	return {
		where,
		take: filters.limit || 20,
		skip: filters.offset || 0,
		orderBy: {
			createdAt: 'desc',
		},
		// Los includes se manejan por separado en Drizzle con joins
	};
}

/**
 * Genera un mensaje descriptivo basado en el tipo de actividad y datos
 * ✅ MIGRADO A DRIZZLE
 * @param type Tipo de actividad
 * @param data Datos adicionales
 * @returns Mensaje descriptivo
 */
export function generateActivityDescription(type: ActivityType | string, data: Record<string, any> = {}): string {
	// Plantillas de mensajes por tipo de actividad
	const templates: Record<string, string> = {
		[ActivityType.IMAGE_UPLOAD]: 'Imagen "${name}" subida',
		[ActivityType.IMAGE_UPDATE]: 'Imagen "${name}" actualizada',
		[ActivityType.IMAGE_DELETE]: 'Imagen "${name}" eliminada',
		[ActivityType.IMAGE_VIEW]: 'Imagen "${name}" visualizada',
		[ActivityType.IMAGE_DOWNLOAD]: 'Imagen "${name}" descargada',
		[ActivityType.IMAGE_SHARE]: 'Imagen "${name}" compartida',
		[ActivityType.IMAGE_TAG]: 'Etiqueta "${tag}" añadida a la imagen "${name}"',
		[ActivityType.IMAGE_UNTAG]: 'Etiqueta "${tag}" eliminada de la imagen "${name}"',
		[ActivityType.IMAGE_FAVORITE]: 'Imagen "${name}" marcada como favorita',
		[ActivityType.IMAGE_UNFAVORITE]: 'Imagen "${name}" desmarcada como favorita',

		[ActivityType.VIDEO_UPLOAD]: 'Video "${name}" subido',
		[ActivityType.VIDEO_UPDATE]: 'Video "${name}" actualizado',
		[ActivityType.VIDEO_DELETE]: 'Video "${name}" eliminado',
		[ActivityType.VIDEO_VIEW]: 'Video "${name}" visualizado',
		[ActivityType.VIDEO_SHARE]: 'Video "${name}" compartido',

		[ActivityType.FOLDER_CREATE]: 'Carpeta "${name}" creada',
		[ActivityType.FOLDER_UPDATE]: 'Carpeta "${name}" actualizada',
		[ActivityType.FOLDER_DELETE]: 'Carpeta "${name}" eliminada',
		[ActivityType.FOLDER_MOVE]: 'Carpeta "${name}" movida a "${destination}"',

		[ActivityType.ALBUM_CREATE]: 'Álbum "${name}" creado',
		[ActivityType.ALBUM_UPDATE]: 'Álbum "${name}" actualizado',
		[ActivityType.ALBUM_DELETE]: 'Álbum "${name}" eliminado',
		[ActivityType.ALBUM_ADD_IMAGE]: 'Imagen "${imageName}" añadida al álbum "${name}"',
		[ActivityType.ALBUM_REMOVE_IMAGE]: 'Imagen "${imageName}" eliminada del álbum "${name}"',

		[ActivityType.COLLECTION_CREATE]: 'Colección "${name}" creada',
		[ActivityType.COLLECTION_UPDATE]: 'Colección "${name}" actualizada',
		[ActivityType.COLLECTION_DELETE]: 'Colección "${name}" eliminada',
		[ActivityType.COLLECTION_ADD_IMAGE]: 'Imagen "${imageName}" añadida a la colección "${name}"',
		[ActivityType.COLLECTION_REMOVE_IMAGE]: 'Imagen "${imageName}" eliminada de la colección "${name}"',

		[ActivityType.SYSTEM_ERROR]: 'Error: ${message}',
		[ActivityType.SYSTEM_WARNING]: 'Advertencia: ${message}',
		[ActivityType.SYSTEM_INFO]: 'Información: ${message}',
		[ActivityType.SYSTEM_SYNC]: 'Sincronización ${status}',
		[ActivityType.SYSTEM_BACKUP]: 'Copia de seguridad ${status}',
		[ActivityType.SYSTEM_RESTORE]: 'Restauración ${status}',
		[ActivityType.SYSTEM_UPDATE]: 'Actualización ${status}',

		[ActivityType.USER_LOGIN]: 'Usuario "${name}" ha iniciado sesión',
		[ActivityType.USER_LOGOUT]: 'Usuario "${name}" ha cerrado sesión',
		[ActivityType.USER_SETTINGS_UPDATE]: 'Configuración de usuario actualizada',
		[ActivityType.USER_PROFILE_UPDATE]: 'Perfil de usuario actualizado',

		[ActivityType.SEARCH_QUERY]: 'Búsqueda: "${query}"',
		[ActivityType.SEARCH_ADVANCED]: 'Búsqueda avanzada: "${query}"',
	};

	// Obtener la plantilla o usar una genérica
	const template = templates[type] || '${message}';

	// Reemplazar variables en la plantilla
	return template.replace(/\${(\w+)}/g, (_, key) => data[key] || '[?]');
}
