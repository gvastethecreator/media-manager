/**
 * @file Servicio para la entidad Activity
 * @module services/activity
 * @description Implementación del servicio para gestionar actividades del sistema
 */

import { and, count, desc, eq, gte, ilike, inArray, lte } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { activities, images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Activity, ActivityFilters, ActivityListResponse, CreateActivityData } from '@/types/entities/activity';

const activityLogger = serverLogger.withContext('ActivityService');

/**
 * Interfaz para el servicio de Activity
 */
export interface ActivityService {
	/**
	 * Elimina todas las actividades o las que coincidan con los filtros
	 * @param filters Filtros opcionales
	 * @returns Número de actividades eliminadas
	 */
	clearAll(filters?: ActivityFilters): Promise<number>;
	/**
	 * Crea una nueva actividad
	 * @param data Datos para la creación
	 * @returns Actividad creada
	 */
	create(data: CreateActivityData): Promise<Activity>;

	/**
	 * Elimina una actividad por su identificador
	 * @param id Identificador de la actividad
	 * @returns true si se eliminó correctamente
	 */
	delete(id: string): Promise<boolean>;

	/**
	 * Busca una actividad por su identificador
	 * @param id Identificador de la actividad
	 * @returns Actividad encontrada o null
	 */
	findById(id: string): Promise<Activity | null>;

	/**
	 * Lista actividades según filtros especificados
	 * @param filters Filtros de búsqueda
	 * @returns Respuesta con actividades y metadatos
	 */
	list(filters?: ActivityFilters): Promise<ActivityListResponse>;
}

/**
 * Convierte los filtros de la aplicación a condiciones Drizzle
 */
function buildWhereConditions(filters: ActivityFilters = {}) {
	const conditions: any[] = [];

	// Filtrar por tipos de actividad
	if (filters.types && filters.types.length > 0) {
		conditions.push(inArray(activities.type, filters.types));
	}

	// Filtrar por imagen (usando entityId y entityType)
	if (filters.imageId) {
		conditions.push(and(eq(activities.entityId, filters.imageId), eq(activities.entityType, 'image')));
	}

	// Filtrar por fechas
	if (filters.startDate) {
		conditions.push(gte(activities.createdAt, filters.startDate));
	}

	if (filters.endDate) {
		conditions.push(lte(activities.createdAt, filters.endDate));
	}

	// Filtrar por búsqueda en descripción
	if (filters.searchQuery) {
		conditions.push(ilike(activities.description, `%${filters.searchQuery}%`));
	}

	return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Implementación del servicio de Activity
 */
export class ActivityServiceImpl implements ActivityService {
	/**
	 * Crea una nueva actividad
	 * @param data Datos para la creación
	 * @returns Actividad creada
	 */
	async create(data: CreateActivityData): Promise<Activity> {
		try {
			// Insertar nueva actividad
			const result = await db
				.insert(activities)
				.values({
					id: crypto.randomUUID(),
					type: data.type,
					entityType: data.entityType,
					entityId: data.entityId,
					action: data.action,
					userId: data.userId,
					description: data.description,
					metadata: data.metadata || null,
					createdAt: new Date(),
				})
				.returning();

			const newActivity = result[0];

			// Buscar imagen relacionada si existe
			let imageData = null;
			if (newActivity.entityType === 'image' && newActivity.entityId) {
				const imageResult = await db
					.select({
						id: images.id,
						name: images.name,
						path: images.path,
					})
					.from(images)
					.where(eq(images.id, newActivity.entityId))
					.limit(1);

				imageData = imageResult[0] || null;
			}

			return this.transformActivityResponse({ ...newActivity, image: imageData });
		} catch (error) {
			activityLogger.error('Error al crear actividad:', error);
			throw new Error('No se pudo crear la actividad');
		}
	}

	/**
	 * Busca una actividad por su identificador
	 * @param id Identificador de la actividad
	 * @returns Actividad encontrada o null
	 */
	async findById(id: string): Promise<Activity | null> {
		try {
			// Buscar actividad con imagen relacionada
			const result = await db
				.select({
					id: activities.id,
					type: activities.type,
					entityType: activities.entityType,
					entityId: activities.entityId,
					action: activities.action,
					userId: activities.userId,
					description: activities.description,
					metadata: activities.metadata,
					ipAddress: activities.ipAddress,
					userAgent: activities.userAgent,
					sessionId: activities.sessionId,
					createdAt: activities.createdAt,
					image: {
						id: images.id,
						name: images.name,
						path: images.path,
					},
				})
				.from(activities)
				.leftJoin(images, and(eq(activities.entityId, images.id), eq(activities.entityType, 'image')))
				.where(eq(activities.id, id))
				.limit(1);

			if (result.length === 0) {
				return null;
			}

			return this.transformActivityResponse(result[0]);
		} catch (error) {
			activityLogger.error('Error al buscar actividad:', error);
			throw new Error('No se pudo buscar la actividad');
		}
	}

	/**
	 * Lista actividades según filtros especificados
	 * @param filters Filtros de búsqueda
	 * @returns Respuesta con actividades y metadatos
	 */
	async list(filters: ActivityFilters = {}): Promise<ActivityListResponse> {
		try {
			const whereConditions = buildWhereConditions(filters);
			const limit = filters.limit || 20;
			const offset = filters.offset || 0;

			// Consulta principal con join a imagen
			const activitiesResult = await db
				.select({
					id: activities.id,
					type: activities.type,
					entityType: activities.entityType,
					entityId: activities.entityId,
					action: activities.action,
					userId: activities.userId,
					description: activities.description,
					metadata: activities.metadata,
					ipAddress: activities.ipAddress,
					userAgent: activities.userAgent,
					sessionId: activities.sessionId,
					createdAt: activities.createdAt,
					image: {
						id: images.id,
						name: images.name,
						path: images.path,
					},
				})
				.from(activities)
				.leftJoin(images, and(eq(activities.entityId, images.id), eq(activities.entityType, 'image')))
				.where(whereConditions)
				.orderBy(desc(activities.createdAt))
				.limit(limit)
				.offset(offset);

			// Consulta para contar total
			const totalCountResult = await db.select({ count: count() }).from(activities).where(whereConditions);

			const totalCount = totalCountResult[0]?.count || 0;

			// Transformar resultados
			const transformedActivities = activitiesResult.map((activity: any) => this.transformActivityResponse(activity));

			return {
				activities: transformedActivities,
				totalCount,
				hasMore: offset + limit < totalCount,
			};
		} catch (error) {
			activityLogger.error('Error al listar actividades:', error);
			throw new Error('No se pudieron listar las actividades');
		}
	}

	/**
	 * Elimina una actividad por su identificador
	 * @param id Identificador de la actividad
	 * @returns true si se eliminó correctamente
	 */
	async delete(id: string): Promise<boolean> {
		try {
			const result = await db.delete(activities).where(eq(activities.id, id)).returning();

			return result.length > 0;
		} catch (error) {
			activityLogger.error('Error al eliminar actividad:', error);
			return false;
		}
	}

	/**
	 * Elimina todas las actividades o las que coincidan con los filtros
	 * @param filters Filtros opcionales
	 * @returns Número de actividades eliminadas
	 */
	async clearAll(filters?: ActivityFilters): Promise<number> {
		try {
			const whereConditions = filters ? buildWhereConditions(filters) : undefined;

			const result = await db.delete(activities).where(whereConditions).returning();

			return result.length;
		} catch (error) {
			activityLogger.error('Error al eliminar todas las actividades:', error);
			throw new Error('No se pudieron eliminar las actividades');
		}
	}

	/**
	 * Transforma la respuesta de Drizzle al formato de la aplicación
	 * @param drizzleActivity Actividad desde Drizzle
	 * @returns Actividad en formato de aplicación
	 */
	private transformActivityResponse(drizzleActivity: any): Activity {
		return {
			id: drizzleActivity.id,
			type: drizzleActivity.type,
			entityType: drizzleActivity.entityType,
			entityId: drizzleActivity.entityId,
			action: drizzleActivity.action || '',
			userId: drizzleActivity.userId || '',
			description: drizzleActivity.description,
			metadata: drizzleActivity.metadata,
			ipAddress: drizzleActivity.ipAddress,
			userAgent: drizzleActivity.userAgent,
			sessionId: drizzleActivity.sessionId,
			createdAt: drizzleActivity.createdAt,
			image: drizzleActivity.image,
			// Podríamos añadir más campos UI aquí basados en el tipo de actividad
			iconEmoji: this.getIconForActivityType(drizzleActivity.type),
			iconColor: this.getColorForActivityType(drizzleActivity.type),
			category: this.getCategoryForActivityType(drizzleActivity.type),
		};
	}

	/**
	 * Devuelve un emoji según el tipo de actividad
	 * @param type Tipo de actividad
	 * @returns Emoji correspondiente
	 */
	private getIconForActivityType(type: string): string {
		// Mapa de tipos a emojis
		const iconMap: Record<string, string> = {
			image_upload: '🖼️',
			image_update: '✏️',
			image_delete: '🗑️',
			image_view: '👁️',
			image_download: '⬇️',
			image_share: '🔗',
			image_tag: '🏷️',
			image_untag: '✂️',
			image_isFavorite: '⭐',
			image_unisFavorite: '☆',
			// Podemos seguir con más mapeos
		};

		return iconMap[type] || '📋';
	}

	/**
	 * Devuelve un color según el tipo de actividad
	 * @param type Tipo de actividad
	 * @returns Color correspondiente
	 */
	private getColorForActivityType(type: string): string {
		// Podemos identificar categorías principales
		if (type.startsWith('image_')) {
			return '#3b82f6';
		}
		if (type.startsWith('video_')) {
			return '#8b5cf6';
		}
		if (type.startsWith('album_')) {
			return '#f59e0b';
		}
		if (type.startsWith('tag_')) {
			return '#22c55e';
		}
		if (type.startsWith('user_')) {
			return '#ec4899';
		}

		// Default
		return '#6b7280';
	}

	/**
	 * Devuelve una categoría según el tipo de actividad
	 * @param type Tipo de actividad
	 * @returns Categoría correspondiente
	 */
	private getCategoryForActivityType(type: string): string {
		if (type.startsWith('image_')) {
			return 'Imágenes';
		}
		if (type.startsWith('video_')) {
			return 'Videos';
		}
		if (type.startsWith('album_')) {
			return 'Álbumes';
		}
		if (type.startsWith('tag_')) {
			return 'Etiquetas';
		}
		if (type.startsWith('user_')) {
			return 'Usuarios';
		}

		// Default
		return 'General';
	}
}

// Singleton para el servicio
let activityServiceInstance: ActivityService | null = null;

/**
 * Función factory para obtener la instancia del servicio
 */
export function getActivityService(): ActivityService {
	if (!activityServiceInstance) {
		activityServiceInstance = new ActivityServiceImpl();
	}

	return activityServiceInstance;
}

// Alias para compatibilidad con rutas del servidor
export const ActivityService = getActivityService();

/**
 * Función de inicialización del servicio
 */
export function initActivityService(): void {
	activityLogger.debug('ActivityService inicializado');
}
