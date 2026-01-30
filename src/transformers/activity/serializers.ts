/**
 * @file Funciones para serializar y deserializar datos de actividades
 * @module transformers/activity/serializers
 */

import { type ActivityListResponse } from '../../types/entities/activity';
import {
	type Activity,
	type ActivityBase,
	ActivityCategory,
	type ActivityMetadata,
	ActivityType,
} from '../../types/entities/activity/index';
import { activityListResponseSchema, activitySchema } from './schema';
import { normalizeActivityFilters } from './validators';

/**
 * Convierte una actividad básica en una actividad extendida con información adicional
 * @param activity Actividad básica
 * @returns Actividad con información adicional
 */
export function extendActivity(activity: ActivityBase): Activity {
	const extended: Activity = {
		...activity,
		// Agregar propiedades adicionales
		iconEmoji: getActivityEmoji(activity.type),
		iconColor: getActivityColor(activity.type),
		category: getActivityCategory(activity.type),
	};

	return extended;
}

/**
 * Convierte múltiples actividades básicas en actividades extendidas
 * @param activities Lista de actividades básicas
 * @returns Lista de actividades extendidas
 */
export function extendActivities(activities: ActivityBase[]): Activity[] {
	return activities.map(extendActivity);
}

/**
 * Obtiene un emoji representativo para un tipo de actividad
 * @param type Tipo de actividad
 * @returns Emoji representativo
 */
export function getActivityEmoji(type: string): string {
	// Mapeo de tipos a emojis
	const emojiMap: Record<string, string> = {
		// Imágenes
		[ActivityType.IMAGE_UPLOAD]: '📤',
		[ActivityType.IMAGE_UPDATE]: '✏️',
		[ActivityType.IMAGE_DELETE]: '🗑️',
		[ActivityType.IMAGE_VIEW]: '👁️',
		[ActivityType.IMAGE_DOWNLOAD]: '📥',
		[ActivityType.IMAGE_SHARE]: '🔗',
		[ActivityType.IMAGE_TAG]: '🏷️',
		[ActivityType.IMAGE_UNTAG]: '✂️',
		[ActivityType.IMAGE_FAVORITE]: '⭐',
		[ActivityType.IMAGE_UNFAVORITE]: '☆',

		// Vídeos
		[ActivityType.VIDEO_UPLOAD]: '📤',
		[ActivityType.VIDEO_UPDATE]: '✏️',
		[ActivityType.VIDEO_DELETE]: '🗑️',
		[ActivityType.VIDEO_VIEW]: '👁️',
		[ActivityType.VIDEO_SHARE]: '🔗',

		// Carpetas
		[ActivityType.FOLDER_CREATE]: '📁',
		[ActivityType.FOLDER_UPDATE]: '✏️',
		[ActivityType.FOLDER_DELETE]: '🗑️',
		[ActivityType.FOLDER_MOVE]: '📋',

		// Álbumes
		[ActivityType.ALBUM_CREATE]: '📔',
		[ActivityType.ALBUM_UPDATE]: '✏️',
		[ActivityType.ALBUM_DELETE]: '🗑️',
		[ActivityType.ALBUM_ADD_IMAGE]: '➕',
		[ActivityType.ALBUM_REMOVE_IMAGE]: '➖',

		// Colecciones
		[ActivityType.COLLECTION_CREATE]: '🌟',
		[ActivityType.COLLECTION_UPDATE]: '✏️',
		[ActivityType.COLLECTION_DELETE]: '🗑️',
		[ActivityType.COLLECTION_ADD_IMAGE]: '➕',
		[ActivityType.COLLECTION_REMOVE_IMAGE]: '➖',

		// Sistema
		[ActivityType.SYSTEM_ERROR]: '❌',
		[ActivityType.SYSTEM_WARNING]: '⚠️',
		[ActivityType.SYSTEM_INFO]: 'ℹ️',
		[ActivityType.SYSTEM_SYNC]: '🔄',
		[ActivityType.SYSTEM_BACKUP]: '💾',
		[ActivityType.SYSTEM_RESTORE]: '🔙',
		[ActivityType.SYSTEM_UPDATE]: '🔼',

		// Usuario
		[ActivityType.USER_LOGIN]: '🚪',
		[ActivityType.USER_LOGOUT]: '👋',
		[ActivityType.USER_SETTINGS_UPDATE]: '⚙️',
		[ActivityType.USER_PROFILE_UPDATE]: '👤',

		// Búsqueda
		[ActivityType.SEARCH_QUERY]: '🔍',
		[ActivityType.SEARCH_ADVANCED]: '🧐',

		// Otros
		[ActivityType.CUSTOM]: '📌',
	};

	return emojiMap[type] || '📋';
}

/**
 * Obtiene un color representativo para un tipo de actividad
 * @param type Tipo de actividad
 * @returns Color en formato HEX o Variable CSS
 */
export function getActivityColor(type: string): string {
	// Obtener la categoría
	const category = getActivityCategory(type);

	// Mapeo de categorías a colores usando tokens semánticos
	const colorMap: Record<string, string> = {
		[ActivityCategory.IMAGES]: 'var(--entity-image)',
		[ActivityCategory.VIDEOS]: 'var(--entity-video)',
		[ActivityCategory.FOLDERS]: 'var(--entity-folder)',
		[ActivityCategory.ALBUMS]: 'var(--entity-album)',
		[ActivityCategory.COLLECTIONS]: 'var(--entity-collection)',
		[ActivityCategory.SYSTEM]: 'var(--dt-neutral-500)',
		[ActivityCategory.USER]: 'var(--entity-profile)',
		[ActivityCategory.SEARCH]: 'var(--dt-primary-500)',
		[ActivityCategory.OTHER]: 'var(--dt-neutral-400)',
	};

	return colorMap[category] || 'var(--dt-primary-500)';
}

/**
 * Obtiene la categoría para un tipo de actividad
 * @param type Tipo de actividad
 * @returns Categoría
 */
export function getActivityCategory(type: string): string {
	if (type.startsWith('image_')) {
		return ActivityCategory.IMAGES;
	}
	if (type.startsWith('video_')) {
		return ActivityCategory.VIDEOS;
	}
	if (type.startsWith('folder_')) {
		return ActivityCategory.FOLDERS;
	}
	if (type.startsWith('album_')) {
		return ActivityCategory.ALBUMS;
	}
	if (type.startsWith('collection_')) {
		return ActivityCategory.COLLECTIONS;
	}
	if (type.startsWith('system_')) {
		return ActivityCategory.SYSTEM;
	}
	if (type.startsWith('user_')) {
		return ActivityCategory.USER;
	}
	if (type.startsWith('search_')) {
		return ActivityCategory.SEARCH;
	}
	return ActivityCategory.OTHER;
}

/**
 * Parsea metadatos de actividad si están en formato string
 * @param metadata Metadatos (string o objeto)
 * @returns Objeto de metadatos o undefined
 */
export function parseActivityMetadata(metadata: string | object | undefined): ActivityMetadata | undefined {
	if (!metadata) {
		return;
	}

	if (typeof metadata === 'string') {
		try {
			return JSON.parse(metadata) as ActivityMetadata;
		} catch (error) {
			console.error('Error parsing activity metadata', error);
			return;
		}
	}

	return metadata as ActivityMetadata;
}

/**
 * Serializa metadatos de actividad para guardarlos
 * @param metadata Objeto de metadatos
 * @returns String serializado o undefined
 */
export function serializeActivityMetadata(metadata?: ActivityMetadata): string | undefined {
	if (!metadata) {
		return;
	}

	try {
		return JSON.stringify(metadata);
	} catch (error) {
		console.error('Error serializing activity metadata', error);
		return;
	}
}

/**
 * Serializa una actividad para API o almacenamiento
 * @param activity Actividad a serializar
 * @returns Objeto serializado
 */
export function serializeActivity(activity: Activity): Record<string, any> {
	try {
		// Validar primero
		const validData = activitySchema.parse(activity);

		// Formatear fechas
		const createdAt = validData.createdAt instanceof Date ? validData.createdAt.toISOString() : validData.createdAt;

		// Crear objeto base
		const serialized: Record<string, any> = {
			id: validData.id,
			type: validData.type,
			entityType: validData.entityType,
			entityId: validData.entityId,
			action: validData.action,
			userId: validData.userId,
			description: validData.description,
			createdAt,
		};

		// Añadir campos opcionales si existen
		if (validData.metadata) {
			serialized.metadata = validData.metadata;
		}
		if (validData.ipAddress) {
			serialized.ipAddress = validData.ipAddress;
		}
		if (validData.userAgent) {
			serialized.userAgent = validData.userAgent;
		}
		if (validData.sessionId) {
			serialized.sessionId = validData.sessionId;
		}
		if (validData.image) {
			serialized.image = validData.image;
		}
		if (validData.iconEmoji) {
			serialized.iconEmoji = validData.iconEmoji;
		}
		if (validData.iconColor) {
			serialized.iconColor = validData.iconColor;
		}
		if (validData.category) {
			serialized.category = validData.category;
		}

		return serialized;
	} catch (error) {
		console.error('Error al serializar actividad:', error);
		// Devolver al menos los campos básicos o un objeto con error
		return {
			id: activity.id || 'unknown',
			type: activity.type || 'unknown',
			entityType: activity.entityType || 'unknown',
			entityId: activity.entityId || 'unknown',
			action: activity.action || 'unknown',
			userId: activity.userId || 'unknown',
			description: activity.description || 'Error de serialización',
			createdAt: new Date().toISOString(),
			_error: true,
		};
	}
}

/**
 * Serializa una lista de actividades para API o almacenamiento
 * @param response Respuesta de listado a serializar
 * @returns Objeto serializado
 */
export function serializeActivityListResponse(response: ActivityListResponse): Record<string, any> {
	try {
		// Validar primero
		activityListResponseSchema.parse(response);

		// Serializar cada actividad
		const serializedActivities = response.activities.map(serializeActivity);

		return {
			activities: serializedActivities,
			totalCount: response.totalCount,
			hasMore: response.hasMore,
		};
	} catch (error) {
		console.error('Error al serializar listado de actividades:', error);
		// Devolver al menos un objeto básico con error
		return {
			activities: [],
			totalCount: 0,
			hasMore: false,
			_error: true,
		};
	}
}

/**
 * Desserializa datos de actividad para uso en la aplicación
 * @param data Datos serializados
 * @returns Actividad deserializada o null si hay error
 */
export function deserializeActivity(data: Record<string, any>): Activity | null {
	try {
		// Intentar parsear con el esquema
		const parsed = activitySchema.parse(data);

		// Convertir fechas si es necesario
		const createdAt = typeof parsed.createdAt === 'string' ? new Date(parsed.createdAt) : parsed.createdAt;

		// Construir objeto final
		const activity: Activity = {
			id: parsed.id,
			type: parsed.type,
			entityType: parsed.entityType,
			entityId: parsed.entityId,
			action: parsed.action,
			userId: parsed.userId,
			description: parsed.description,
			createdAt,
			...(parsed.metadata && { metadata: parsed.metadata }),
			...(parsed.ipAddress && { ipAddress: parsed.ipAddress }),
			...(parsed.userAgent && { userAgent: parsed.userAgent }),
			...(parsed.sessionId && { sessionId: parsed.sessionId }),
			...(parsed.image && { image: parsed.image }),
			...(parsed.iconEmoji && { iconEmoji: parsed.iconEmoji }),
			...(parsed.iconColor && { iconColor: parsed.iconColor }),
			...(parsed.category && { category: parsed.category }),
		};

		return activity;
	} catch (error) {
		console.error('Error al deserializar actividad:', error);
		return null;
	}
}

/**
 * Desserializa datos de listado de actividades para uso en la aplicación
 * @param data Datos serializados
 * @returns Respuesta de listado deserializada o respuesta vacía
 */
export function deserializeActivityListResponse(data: Record<string, any>): ActivityListResponse {
	try {
		// Intentar parsear con el esquema
		const parsed = activityListResponseSchema.parse(data);

		// Deserializar cada actividad
		const activities = parsed.activities.map(deserializeActivity).filter((a): a is Activity => a !== null);

		return {
			activities,
			totalCount: parsed.totalCount,
			hasMore: parsed.hasMore,
		};
	} catch (error) {
		console.error('Error al deserializar listado de actividades:', error);
		// Devolver una respuesta vacía
		return {
			activities: [],
			totalCount: 0,
			hasMore: false,
		};
	}
}

/**
 * Serializa filtros para uso en consultas de API
 * @param filters Filtros a serializar
 * @returns Objeto serializado para API
 */
export function serializeActivityFilters(filters: Record<string, any>): Record<string, any> {
	// Normalizar primero
	const normalizedFilters = normalizeActivityFilters(filters);

	const serialized: Record<string, any> = {};

	// Añadir campos solo si tienen valor
	if (normalizedFilters.types?.length) {
		serialized.types = normalizedFilters.types;
	}
	if (normalizedFilters.searchQuery) {
		serialized.q = normalizedFilters.searchQuery;
	}
	if (normalizedFilters.limit) {
		serialized.limit = normalizedFilters.limit;
	}
	if (normalizedFilters.offset) {
		serialized.offset = normalizedFilters.offset;
	}
	if (normalizedFilters.imageId) {
		serialized.imageId = normalizedFilters.imageId;
	}

	// Formatear fechas para API
	if (normalizedFilters.startDate) {
		serialized.from =
			normalizedFilters.startDate instanceof Date
				? normalizedFilters.startDate.toISOString()
				: normalizedFilters.startDate;
	}

	if (normalizedFilters.endDate) {
		serialized.to =
			normalizedFilters.endDate instanceof Date ? normalizedFilters.endDate.toISOString() : normalizedFilters.endDate;
	}

	return serialized;
}
