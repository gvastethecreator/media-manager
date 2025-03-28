/**
 * @file Funciones para serializar y deserializar datos de actividades
 * @module transformers/activity/serializers
 */

import {
	type Activity,
	type ActivityBase,
	type ActivityMetadata,
	ActivityCategory,
	ActivityType,
} from '../../types/entities/activity/index';

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
 * @returns Color en formato HEX
 */
export function getActivityColor(type: string): string {
	// Obtener la categoría
	const category = getActivityCategory(type);

	// Mapeo de categorías a colores
	const colorMap: Record<string, string> = {
		[ActivityCategory.IMAGES]: '#3b82f6', // Azul
		[ActivityCategory.VIDEOS]: '#ef4444', // Rojo
		[ActivityCategory.FOLDERS]: '#8b5cf6', // Violeta
		[ActivityCategory.ALBUMS]: '#10b981', // Verde
		[ActivityCategory.COLLECTIONS]: '#f59e0b', // Ámbar
		[ActivityCategory.SYSTEM]: '#6b7280', // Gris
		[ActivityCategory.USER]: '#ec4899', // Rosa
		[ActivityCategory.SEARCH]: '#6366f1', // Índigo
		[ActivityCategory.OTHER]: '#9ca3af', // Gris claro
	};

	return colorMap[category] || '#3b82f6';
}

/**
 * Obtiene la categoría para un tipo de actividad
 * @param type Tipo de actividad
 * @returns Categoría
 */
export function getActivityCategory(type: string): string {
	if (type.startsWith('image_')) return ActivityCategory.IMAGES;
	if (type.startsWith('video_')) return ActivityCategory.VIDEOS;
	if (type.startsWith('folder_')) return ActivityCategory.FOLDERS;
	if (type.startsWith('album_')) return ActivityCategory.ALBUMS;
	if (type.startsWith('collection_')) return ActivityCategory.COLLECTIONS;
	if (type.startsWith('system_')) return ActivityCategory.SYSTEM;
	if (type.startsWith('user_')) return ActivityCategory.USER;
	if (type.startsWith('search_')) return ActivityCategory.SEARCH;
	return ActivityCategory.OTHER;
}

/**
 * Parsea metadatos de actividad si están en formato string
 * @param metadata Metadatos (string o objeto)
 * @returns Objeto de metadatos o undefined
 */
export function parseActivityMetadata(metadata: string | object | undefined): ActivityMetadata | undefined {
	if (!metadata) return undefined;

	if (typeof metadata === 'string') {
		try {
			return JSON.parse(metadata) as ActivityMetadata;
		} catch (error) {
			console.error('Error parsing activity metadata', error);
			return undefined;
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
	if (!metadata) return undefined;

	try {
		return JSON.stringify(metadata);
	} catch (error) {
		console.error('Error serializing activity metadata', error);
		return undefined;
	}
}
