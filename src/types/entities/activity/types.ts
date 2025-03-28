/**
 * @file Tipos para la entidad Activity
 * @module types/entities/activity/types
 */

/**
 * Interfaz base para actividades
 */
export interface ActivityBase {
	id: string;
	type: string;
	description: string;
	imageId?: string | null;
	createdAt: Date | string;
}

/**
 * Interfaz para actividades con relación a imágenes
 */
export interface ActivityWithImage extends ActivityBase {
	imageId: string;
	image?: {
		id: string;
		name: string;
		path: string;
		thumbnail?: string | null;
	};
}

/**
 * Interfaz extendida para actividades con información adicional
 */
export interface Activity extends ActivityBase {
	// Información relacionada cuando esté disponible
	image?: {
		id: string;
		name: string;
		path: string;
		thumbnail?: string | null;
	} | null;

	// Campos extendidos para UI
	iconEmoji?: string;
	iconColor?: string;
	category?: string;

	// Campos para estado en UI
	isSelected?: boolean;
	isExpanded?: boolean;
}

/**
 * Interfaz para la creación de actividades
 */
export interface CreateActivityData {
	type: string;
	description: string;
	imageId?: string;
}

/**
 * Filtros para búsqueda de actividades
 */
export interface ActivityFilters {
	types?: string[]; // Tipos de actividad a incluir
	startDate?: Date | string; // Fecha de inicio
	endDate?: Date | string; // Fecha de fin
	imageId?: string; // Filtrar por imagen
	searchQuery?: string; // Búsqueda en la descripción
	limit?: number; // Límite de resultados
	offset?: number; // Desplazamiento para paginación
}

/**
 * Datos de respuesta para listado de actividades
 */
export interface ActivityListResponse {
	activities: Activity[];
	totalCount: number;
	hasMore: boolean;
}

/**
 * Metadatos adicionales para actividades específicas
 */
export interface ActivityMetadata {
	[key: string]: any;
}
