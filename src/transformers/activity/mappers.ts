/**
 * @file Funciones de mapeo para la entidad Activity
 * @module transformers/activity/mappers
 
 */

import { type ActivityFilters, ActivityType, type CreateActivityData } from '../../types/entities/activity/index';

interface DrizzleCreateActivityData {
	action: string;
	description: string;
	entityId: string;
	entityType: string;
	ipAddress?: string | null;
	metadata?: Record<string, any> | null;
	sessionId?: string | null;
	type: string;
	userAgent?: string | null;
	userId: string;
}

interface DrizzleWhereFilter {
	AND?: DrizzleWhereFilter[];
	createdAt?: { gte?: Date; lte?: Date };
	description?: { contains?: string };
	imageId?: string;
	OR?: DrizzleWhereFilter[];
	type?: { in?: string[] };
}

interface DrizzleFindManyArgs {
	orderBy?: { [key: string]: 'asc' | 'desc' };
	skip?: number;
	take?: number;
	where?: DrizzleWhereFilter;
	// Los includes se manejan por separado en Drizzle
}

/**
 * Mapea datos de creación de actividad a formato compatible con Drizzle
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de creación de actividad
 * @returns Objeto formateado para Drizzle
 */
export function mapCreateActivityDataToDrizzle(data: CreateActivityData): DrizzleCreateActivityData {
	return {
		type: data.type,
		entityType: data.entityType,
		entityId: data.entityId,
		action: data.action,
		userId: data.userId,
		description: data.description,
		metadata: data.metadata || null,
		ipAddress: data.ipAddress || null,
		userAgent: data.userAgent || null,
		sessionId: data.sessionId || null,
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
		[ActivityType.IMAGE_UPLOAD]: `Imagen "${data.name}" subida`,
		[ActivityType.IMAGE_UPDATE]: `Imagen "${data.name}" actualizada`,
		[ActivityType.IMAGE_DELETE]: `Imagen "${data.name}" eliminada`,
		[ActivityType.IMAGE_VIEW]: `Imagen "${data.name}" visualizada`,
		[ActivityType.IMAGE_DOWNLOAD]: `Imagen "${data.name}" descargada`,
		[ActivityType.IMAGE_SHARE]: `Imagen "${data.name}" compartida`,
		[ActivityType.IMAGE_TAG]: `Etiqueta "${data.tag}" añadida a la imagen "${data.name}"`,
		[ActivityType.IMAGE_UNTAG]: `Etiqueta "${data.tag}" eliminada de la imagen "${data.name}"`,
		[ActivityType.IMAGE_FAVORITE]: `Imagen "${data.name}" marcada como favorita`,
		[ActivityType.IMAGE_UNFAVORITE]: `Imagen "${data.name}" desmarcada como favorita`,

		[ActivityType.VIDEO_UPLOAD]: `Video "${data.name}" subido`,
		[ActivityType.VIDEO_UPDATE]: `Video "${data.name}" actualizado`,
		[ActivityType.VIDEO_DELETE]: `Video "${data.name}" eliminado`,
		[ActivityType.VIDEO_VIEW]: `Video "${data.name}" visualizado`,
		[ActivityType.VIDEO_SHARE]: `Video "${data.name}" compartido`,

		[ActivityType.FOLDER_CREATE]: `Carpeta "${data.name}" creada`,
		[ActivityType.FOLDER_UPDATE]: `Carpeta "${data.name}" actualizada`,
		[ActivityType.FOLDER_DELETE]: `Carpeta "${data.name}" eliminada`,
		[ActivityType.FOLDER_MOVE]: `Carpeta "${data.name}" movida a "${data.destination}"`,

		[ActivityType.ALBUM_CREATE]: `Álbum "${data.name}" creado`,
		[ActivityType.ALBUM_UPDATE]: `Álbum "${data.name}" actualizado`,
		[ActivityType.ALBUM_DELETE]: `Álbum "${data.name}" eliminado`,
		[ActivityType.ALBUM_ADD_IMAGE]: `Imagen "${data.imageName}" añadida al álbum "${data.name}"`,
		[ActivityType.ALBUM_REMOVE_IMAGE]: `Imagen "${data.imageName}" eliminada del álbum "${data.name}"`,

		[ActivityType.COLLECTION_CREATE]: `Colección "${data.name}" creada`,
		[ActivityType.COLLECTION_UPDATE]: `Colección "${data.name}" actualizada`,
		[ActivityType.COLLECTION_DELETE]: `Colección "${data.name}" eliminada`,
		[ActivityType.COLLECTION_ADD_IMAGE]: `Imagen "${data.imageName}" añadida a la colección "${data.name}"`,
		[ActivityType.COLLECTION_REMOVE_IMAGE]: `Imagen "${data.imageName}" eliminada de la colección "${data.name}"`,

		[ActivityType.SYSTEM_ERROR]: `Error: ${data.description || data.error || 'Error del sistema'}`,
		[ActivityType.SYSTEM_WARNING]: `Advertencia: ${data.description || data.warning || 'Advertencia del sistema'}`,
		[ActivityType.SYSTEM_INFO]: `Información: ${data.description || data.info || 'Información del sistema'}`,
		[ActivityType.SYSTEM_SYNC]: `Sincronización ${data.status}`,
		[ActivityType.SYSTEM_BACKUP]: `Copia de seguridad ${data.status}`,
		[ActivityType.SYSTEM_RESTORE]: `Restauración ${data.status}`,
		[ActivityType.SYSTEM_UPDATE]: `Actualización ${data.status}`,

		[ActivityType.USER_LOGIN]: `Usuario "${data.name}" ha iniciado sesión`,
		[ActivityType.USER_LOGOUT]: `Usuario "${data.name}" ha cerrado sesión`,
		[ActivityType.USER_SETTINGS_UPDATE]: 'Configuración de usuario actualizada',
		[ActivityType.USER_PROFILE_UPDATE]: 'Perfil de usuario actualizado',

		[ActivityType.SEARCH_QUERY]: `Búsqueda: "${data.query}"`,
		[ActivityType.SEARCH_ADVANCED]: `Búsqueda avanzada: "${data.query}"`,
	};

	// Obtener la plantilla o usar una genérica
	const template = templates[type] || `${data.description || data.message || 'Actividad del sistema'}`;

	// Reemplazar variables en la plantilla
	return template.replace(/\${(\w+)}/g, (_, key) => data[key] || '[?]');
}
