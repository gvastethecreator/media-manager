/**
 * @file Funciones auxiliares para el manejo de actividades
 * @module utils/activity/helpers
 */

import { getActivityCategory } from '../../transformers/activity/serializers';
import { ActivityCategory, ActivityType, type Activity } from '../../types/entities/activity';

/**
 * Obtiene un título descriptivo para la actividad
 * @param activity Actividad a describir
 * @returns Título descriptivo
 */
export function getActivityTitle(activity: Activity): string {
	const typeMap: Partial<Record<string, string>> = {
		// Imágenes
		[ActivityType.IMAGE_UPLOAD]: 'Imagen subida',
		[ActivityType.IMAGE_UPDATE]: 'Imagen actualizada',
		[ActivityType.IMAGE_DELETE]: 'Imagen eliminada',
		[ActivityType.IMAGE_VIEW]: 'Imagen visualizada',
		[ActivityType.IMAGE_DOWNLOAD]: 'Imagen descargada',
		[ActivityType.IMAGE_SHARE]: 'Imagen compartida',

		// Vídeos
		[ActivityType.VIDEO_UPLOAD]: 'Video subido',
		[ActivityType.VIDEO_UPDATE]: 'Video actualizado',
		[ActivityType.VIDEO_DELETE]: 'Video eliminado',

		// Carpetas
		[ActivityType.FOLDER_CREATE]: 'Carpeta creada',
		[ActivityType.FOLDER_UPDATE]: 'Carpeta actualizada',
		[ActivityType.FOLDER_DELETE]: 'Carpeta eliminada',

		// Otros tipos comunes
		[ActivityType.SYSTEM_ERROR]: 'Error del sistema',
		[ActivityType.SYSTEM_WARNING]: 'Advertencia del sistema',
		[ActivityType.SYSTEM_INFO]: 'Información del sistema',
	};

	return typeMap[activity.type] || formatActivityType(activity.type);
}

/**
 * Formatea el tipo de actividad para mostrar
 * @param type Tipo de actividad
 * @returns Tipo formateado
 */
export function formatActivityType(type: string): string {
	// Reemplazar guiones bajos por espacios y capitalizar cada palabra
	return type
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Convierte una fecha de actividad a formato relativo
 * @param date Fecha a formatear
 * @returns Texto con la fecha relativa
 */
export function formatActivityDate(date: Date | string): string {
	const activityDate = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - activityDate.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) return 'hace unos segundos';
	if (diffMins === 1) return 'hace 1 minuto';
	if (diffMins < 60) return `hace ${diffMins} minutos`;
	if (diffHours === 1) return 'hace 1 hora';
	if (diffHours < 24) return `hace ${diffHours} horas`;
	if (diffDays === 1) return 'ayer';
	if (diffDays < 7) return `hace ${diffDays} días`;

	// Formatear fecha completa para actividades más antiguas
	const options: Intl.DateTimeFormatOptions = {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	};
	return activityDate.toLocaleDateString('es-ES', options);
}

/**
 * Filtra actividades por categoría
 * @param activities Lista de actividades
 * @param category Categoría para filtrar
 * @returns Actividades filtradas
 */
export function filterActivitiesByCategory(activities: Activity[], category: ActivityCategory): Activity[] {
	return activities.filter((activity) => getActivityCategory(activity.type) === category);
}

/**
 * Agrupa actividades por día
 * @param activities Lista de actividades
 * @returns Actividades agrupadas por fecha
 */
export function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
	const groupedActivities: Record<string, Activity[]> = {};

	activities.forEach((activity) => {
		const date = new Date(activity.createdAt);
		const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

		if (!groupedActivities[dateKey]) {
			groupedActivities[dateKey] = [];
		}

		groupedActivities[dateKey].push(activity);
	});

	return groupedActivities;
}

/**
 * Obtiene un color para destacar la actividad según su tipo
 * @param activity Actividad a analizar
 * @returns Clase CSS o color para destacar
 */
export function getActivityHighlightClass(activity: Activity): string {
	const categoryToClass: Record<string, string> = {
		[ActivityCategory.IMAGES]: 'highlight-image',
		[ActivityCategory.VIDEOS]: 'highlight-video',
		[ActivityCategory.FOLDERS]: 'highlight-folder',
		[ActivityCategory.ALBUMS]: 'highlight-album',
		[ActivityCategory.COLLECTIONS]: 'highlight-collection',
		[ActivityCategory.SYSTEM]: 'highlight-system',
		[ActivityCategory.USER]: 'highlight-user',
		[ActivityCategory.SEARCH]: 'highlight-search',
		[ActivityCategory.OTHER]: 'highlight-other',
	};

	const category = activity.category || getActivityCategory(activity.type);
	return categoryToClass[category] || 'highlight-default';
}

/**
 * Determina si una actividad debe mostrarse como alerta
 * @param activity Actividad a analizar
 * @returns true si debe mostrarse como alerta
 */
export function isAlertActivity(activity: Activity): boolean {
	return [ActivityType.SYSTEM_ERROR, ActivityType.SYSTEM_WARNING].includes(activity.type as ActivityType);
}

/**
 * Obtiene la severidad de alerta para una actividad
 * @param activity Actividad a analizar
 * @returns Nivel de severidad o null si no es alerta
 */
export function getActivityAlertLevel(activity: Activity): 'error' | 'warning' | 'info' | null {
	if (activity.type === ActivityType.SYSTEM_ERROR) return 'error';
	if (activity.type === ActivityType.SYSTEM_WARNING) return 'warning';
	if (activity.type === ActivityType.SYSTEM_INFO) return 'info';
	return null;
}
