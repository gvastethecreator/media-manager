/**
 * @file Servicio de gestión de propiedades
 * @module services/property/property.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de propiedades
 * @updated 2025-01-27
 */

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/utils/errors/service-errors';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type { PropertyCreateInput, PropertyUpdateInput, PropertyWithStats } from '@/types/entities/property';

// Logger específico para el servicio
const logger = serverLogger.withContext('PropertyService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/dashboard/properties', '/dashboard/stats', '/api/properties'];

// Eventos del servicio de propiedades
export const PROPERTY_EVENTS = {
	CREATED: 'property:created',
	UPDATED: 'property:updated',
	DELETED: 'property:deleted',
	STATS_UPDATED: 'property:stats:updated',
} as const;

// Tipos de entrada
export interface GetPropertiesOptions {
	search?: string;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
	onlyFavorites?: boolean;
}

export interface GetPropertiesResult {
	properties: PropertyWithStats[];
	total: number;
}

/**
 * Clase de error personalizada para operaciones de Property
 */
export class PropertyServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'PropertyServiceError';
	}
}

/**
 * Notifica cambios en las propiedades a través del sistema de eventos
 */
export const notifyPropertyChange = async (
	action: 'create' | 'update' | 'delete',
	property: PropertyWithStats | { id: string }
): Promise<void> => {
	try {
		let eventType: string;
		switch (action) {
			case 'create':
				eventType = PROPERTY_EVENTS.CREATED;
				break;
			case 'update':
				eventType = PROPERTY_EVENTS.UPDATED;
				break;
			case 'delete':
				eventType = PROPERTY_EVENTS.DELETED;
				break;
			default:
				eventType = 'property:modified';
		}

		// Emitir evento al sistema central
		await emit({
			type: 'properties:modified',
			data: { action, property },
		});

		// Notificar a estadísticas
		statsEventEmitter.emit(STATS_EVENTS.PROPERTY_CHANGE);

		logger.info(`🔔 Notificado cambio en propiedad: ${action}`, { propertyId: property.id });
	} catch (error) {
		logger.error(`❌ Error al notificar cambio en propiedad: ${action}`, { error, propertyId: property.id });
	}
};

/**
 * Revalida las rutas de caché relacionadas con las propiedades
 */
const revalidatePropertyPaths = async (): Promise<void> => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
};

/**
 * Obtiene una propiedad por su ID
 */
export async function getProperty(id: string): Promise<PropertyWithStats | null> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		logger.info(`🔍 Obteniendo propiedad por ID: ${id}`);

		const drizzleProperty = await db
			.select({
				id: properties.id,
				name: properties.name,
				description: properties.description,
				emoji: properties.emoji,
				color: properties.color,
				category: properties.category,
				shortcut: properties.shortcut,
				featuredImage: properties.featuredImage,
				isFavorite: properties.isFavorite,
				createdAt: properties.createdAt,
				updatedAt: properties.updatedAt,
			})
			.from(properties)
			.where(eq(properties.id, id))
			.limit(1);

		if (drizzleProperty.length === 0) {
			logger.warn(`Propiedad no encontrada: ${id}`);
			return null;
		}

		const result: PropertyWithStats = {
			...drizzleProperty[0],
			isFavorite: Boolean(drizzleProperty[0].isFavorite),
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				groups: 0,
			},
		};
		logger.info(`✅ Propiedad encontrada: ${result.name}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al obtener propiedad ${id}`, { error });
		throw new PropertyServiceError(
			`Error al obtener propiedad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_PROPERTY_FAILED',
			error
		);
	}
}

/**
 * Obtiene propiedades con opciones de filtrado
 */
export async function getProperties(options: GetPropertiesOptions = {}): Promise<GetPropertiesResult> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const { search, orderBy = 'name', orderDirection = 'asc', onlyFavorites = false } = options;

		logger.info('🏷️ Obteniendo propiedades', { options });

		// Construir filtros dinámicamente
		const conditions: any[] = [];

		if (onlyFavorites) {
			conditions.push(eq(properties.isFavorite, true));
		}

		if (search) {
			conditions.push(or(like(properties.name, `%${search}%`), like(properties.description, `%${search}%`)));
		}

		// Aplicar filtros
		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Configurar ordenamiento
		const orderByClause = (() => {
			const direction = orderDirection === 'desc' ? desc : asc;
			switch (orderBy) {
				case 'createdAt':
					return direction(properties.createdAt);
				case 'updatedAt':
					return direction(properties.updatedAt);
				case 'name':
				default:
					// Para name, primero favoritos luego por nombre
					return orderDirection === 'desc'
						? [desc(properties.isFavorite), desc(properties.name)]
						: [desc(properties.isFavorite), asc(properties.name)];
			}
		})();

		// Ejecutar consultas en paralelo
		const [drizzleProperties, totalCount] = await Promise.all([
			db
				.select({
					id: properties.id,
					name: properties.name,
					description: properties.description,
					emoji: properties.emoji,
					color: properties.color,
					category: properties.category,
					shortcut: properties.shortcut,
					featuredImage: properties.featuredImage,
					isFavorite: properties.isFavorite,
					createdAt: properties.createdAt,
					updatedAt: properties.updatedAt,
				})
				.from(properties)
				.where(whereClause)
				.orderBy(...(Array.isArray(orderByClause) ? orderByClause : [orderByClause])),
			db
				.select({ count: count() })
				.from(properties)
				.where(whereClause)
				.then((result) => result[0]?.count || 0),
		]);

		const result: PropertyWithStats[] = drizzleProperties.map((rawProperty) => ({
			...rawProperty,
			isFavorite: Boolean(rawProperty.isFavorite),
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				groups: 0,
			},
		}));

		logger.info(`✅ ${result.length} propiedades obtenidas`);
		return {
			properties: result,
			total: totalCount,
		};
	} catch (error) {
		logger.error('❌ Error al obtener propiedades', { error, options });
		throw new PropertyServiceError(
			`Error al obtener propiedades: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_PROPERTIES_FAILED',
			error
		);
	}
}

/**
 * Crea una nueva propiedad
 */
export async function createProperty(data: PropertyCreateInput): Promise<PropertyWithStats> {
	try {
		logger.info('📝 Creando nueva propiedad', { name: data.name });

		const [newProperty] = await db
			.insert(properties)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description || null,
				value: data.value || null,
				type: data.type,
				unit: data.unit || null,
				category: data.category || null,
				isRequired: data.isRequired ?? false,
				isPrivate: data.isPrivate ?? false,
				isFavorite: data.isFavorite ?? false,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		// Revalidar rutas
		await revalidatePropertyPaths();

		const result: PropertyWithStats = {
			...newProperty,
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				groups: 0,
			},
		};

		// Notificar creación
		await notifyPropertyChange('create', result);

		logger.info(`✅ Propiedad creada exitosamente: ${result.name}`, { id: result.id });
		return result;
	} catch (error) {
		logger.error('❌ Error al crear propiedad', { error, data });
		throw new PropertyServiceError(
			`Error al crear propiedad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'CREATE_PROPERTY_FAILED',
			error
		);
	}
}

/**
 * Actualiza una propiedad existente
 */
export async function updateProperty(id: string, data: PropertyUpdateInput): Promise<PropertyWithStats> {
	try {
		logger.info(`📝 Actualizando propiedad: ${id}`);

		// Verificar si la propiedad existe
		const existingProperty = await db.query.properties.findFirst({
			where: eq(properties.id, id),
			columns: { id: true },
		});

		if (!existingProperty) {
			throw new PropertyServiceError('Propiedad no encontrada', 'PROPERTY_NOT_FOUND');
		}

		const updateData: any = {};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.value !== undefined) updateData.value = data.value;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.unit !== undefined) updateData.unit = data.unit;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
		if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		const [updatedProperty] = await db.update(properties).set(updateData).where(eq(properties.id, id)).returning();

		// Revalidar rutas
		await revalidatePropertyPaths();

		const result: PropertyWithStats = {
			...updatedProperty,
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				groups: 0,
			},
		};

		// Notificar actualización
		await notifyPropertyChange('update', result);

		logger.info(`✅ Propiedad actualizada exitosamente: ${result.name}`, { id });
		return result;
	} catch (error) {
		logger.error(`❌ Error al actualizar propiedad ${id}`, { error, data });
		throw new PropertyServiceError(
			`Error al actualizar propiedad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'UPDATE_PROPERTY_FAILED',
			error
		);
	}
}

/**
 * Elimina una propiedad
 */
export async function deleteProperty(id: string): Promise<void> {
	try {
		logger.info(`🗑️ Eliminando propiedad: ${id}`);

		// Verificar si la propiedad existe
		const existingProperty = await db.query.properties.findFirst({
			where: eq(properties.id, id),
			columns: { id: true, name: true },
		});

		if (!existingProperty) {
			throw new PropertyServiceError('Propiedad no encontrada', 'PROPERTY_NOT_FOUND');
		}

		await db.delete(properties).where(eq(properties.id, id));

		// Revalidar rutas
		await revalidatePropertyPaths();

		// Notificar eliminación
		await notifyPropertyChange('delete', { id });

		logger.info(`✅ Propiedad eliminada exitosamente: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar propiedad ${id}`, { error });
		throw new PropertyServiceError(
			`Error al eliminar propiedad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'DELETE_PROPERTY_FAILED',
			error
		);
	}
}

/**
 * Cambia el estado de favorito de una propiedad
 */
export async function togglePropertyFavorite(id: string): Promise<PropertyWithStats> {
	try {
		logger.info(`⭐ Cambiando estado de favorito de la propiedad: ${id}`);

		// Obtener estado actual
		const currentProperty = await db.query.properties.findFirst({
			where: eq(properties.id, id),
			columns: { isFavorite: true },
		});

		if (!currentProperty) {
			throw new PropertyServiceError('Propiedad no encontrada', 'PROPERTY_NOT_FOUND');
		}

		const [updatedProperty] = await db
			.update(properties)
			.set({
				isFavorite: !currentProperty.isFavorite,
			})
			.where(eq(properties.id, id))
			.returning();

		// Revalidar rutas
		await revalidatePropertyPaths();

		const result: PropertyWithStats = {
			...updatedProperty,
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				groups: 0,
			},
		};

		// Notificar actualización
		await notifyPropertyChange('update', result);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${result.isFavorite}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de favorito de la propiedad ${id}`, { error });
		throw new PropertyServiceError(
			`Error al cambiar estado de favorito: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'TOGGLE_FAVORITE_FAILED',
			error
		);
	}
}

/**
 * Busca propiedades por nombre o descripción
 */
export async function searchProperties(query: string): Promise<PropertyWithStats[]> {
	try {
		logger.info(`🔍 Buscando propiedades: "${query}"`);

		const drizzleProperties = await db
			.select({
				id: properties.id,
				name: properties.name,
				description: properties.description,
				emoji: properties.emoji,
				color: properties.color,
				category: properties.category,
				shortcut: properties.shortcut,
				featuredImage: properties.featuredImage,
				isFavorite: properties.isFavorite,
				createdAt: properties.createdAt,
				updatedAt: properties.updatedAt,
			})
			.from(properties)
			.where(or(like(properties.name, `%${query}%`), like(properties.description, `%${query}%`)))
			.orderBy(desc(properties.isFavorite), asc(properties.name));

		const result: PropertyWithStats[] = drizzleProperties.map((p) => ({
			...p,
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				groups: 0,
			},
		}));

		logger.info(`✅ ${result.length} propiedades encontradas para "${query}"`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al buscar propiedades: "${query}"`, { error });
		throw new PropertyServiceError(
			`Error al buscar propiedades: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'SEARCH_PROPERTIES_FAILED',
			error
		);
	}
}

/**
 * Clase de servicio para gestión de propiedades
 */
export class PropertyService {
	async getProperties(filters?: any): Promise<{ properties: PropertyWithStats[]; total: number }> {
		const result = await getProperties(filters || {});
		return result;
	}

	async getPropertyById(id: string): Promise<PropertyWithStats | null> {
		return await getProperty(id);
	}

	async createProperty(data: PropertyCreateInput): Promise<PropertyWithStats> {
		return await createProperty(data);
	}

	async updateProperty(id: string, data: PropertyUpdateInput): Promise<PropertyWithStats | null> {
		try {
			return await updateProperty(id, data);
		} catch (error) {
			if (error instanceof PropertyServiceError && error.code === 'PROPERTY_NOT_FOUND') {
				return null;
			}
			throw error;
		}
	}

	async deleteProperty(id: string): Promise<boolean> {
		try {
			await deleteProperty(id);
			return true;
		} catch (error) {
			if (error instanceof PropertyServiceError && error.code === 'PROPERTY_NOT_FOUND') {
				return false;
			}
			throw error;
		}
	}

	async getPropertyImages(id: string): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes de la propiedad
		logger.info(`Obteniendo imágenes de la propiedad ${id}`);
		return [];
	}

	async getRecentPropertyImages(id: string, limit: number): Promise<any[]> {
		// TODO: Implementar lógica para obtener imágenes recientes de la propiedad
		logger.info(`Obteniendo imágenes recientes de la propiedad ${id} (limit: ${limit})`);
		return [];
	}
}

// Servicio principal
const propertyService = {
	getProperty,
	getProperties,
	createProperty,
	updateProperty,
	deleteProperty,
	togglePropertyFavorite,
	searchProperties,
	notifyPropertyChange,
	PROPERTY_EVENTS,
	PropertyServiceError,
};

export default propertyService;
