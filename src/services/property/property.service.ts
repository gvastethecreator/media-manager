/**
 * @file Servicio de gestión de propiedades
 * @module services/property/property.service
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de propiedades
 * @updated 2025-01-27
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toPropertyWithStats } from '@/transformers/property';
import type { PropertyCreateInput, PropertyUpdateInput, PropertyWithStats } from '@/types/entities/property';
import { propertyCounts } from '@/types/entities/property';

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
		logger.info(`🔍 Obteniendo propiedad por ID: ${id}`);

		const property = await prisma.property.findUnique({
			where: { id },
			include: propertyCounts,
		});

		if (!property) {
			logger.warn(`Propiedad no encontrada: ${id}`);
			return null;
		}

		const result = toPropertyWithStats(property);
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
		const { search, orderBy = 'name', orderDirection = 'asc', onlyFavorites = false } = options;

		logger.info('🏷️ Obteniendo propiedades', { options });

		// Construir filtros
		const where: Prisma.PropertyWhereInput = {};

		if (onlyFavorites) {
			where.isFavorite = true;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			];
		}

		// Obtener propiedades
		const [properties, total] = await Promise.all([
			prisma.property.findMany({
				where,
				include: propertyCounts,
				orderBy:
					orderBy === 'name' ? [{ isFavorite: 'desc' }, { name: orderDirection }] : { [orderBy]: orderDirection },
			}),
			prisma.property.count({ where }),
		]);

		const transformedProperties = properties.map(toPropertyWithStats);

		logger.info(`✅ ${transformedProperties.length} propiedades obtenidas`);
		return {
			properties: transformedProperties,
			total,
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

		const propertyData: Prisma.PropertyCreateInput = {
			name: data.name,
			description: data.description,
			value: data.value,
			type: data.type,
			unit: data.unit,
			category: data.category,
			isRequired: data.isRequired ?? false,
			isPrivate: data.isPrivate ?? false,
			isFavorite: data.isFavorite ?? false,
		};

		const newProperty = await prisma.property.create({
			data: propertyData,
			include: propertyCounts,
		});

		// Revalidar rutas
		await revalidatePropertyPaths();

		const result = toPropertyWithStats(newProperty);

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
		const existingProperty = await prisma.property.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existingProperty) {
			throw new PropertyServiceError('Propiedad no encontrada', 'PROPERTY_NOT_FOUND');
		}

		const propertyData: Prisma.PropertyUpdateInput = {};

		if (data.name !== undefined) propertyData.name = data.name;
		if (data.description !== undefined) propertyData.description = data.description;
		if (data.value !== undefined) propertyData.value = data.value;
		if (data.type !== undefined) propertyData.type = data.type;
		if (data.unit !== undefined) propertyData.unit = data.unit;
		if (data.category !== undefined) propertyData.category = data.category;
		if (data.isRequired !== undefined) propertyData.isRequired = data.isRequired;
		if (data.isPrivate !== undefined) propertyData.isPrivate = data.isPrivate;
		if (data.isFavorite !== undefined) propertyData.isFavorite = data.isFavorite;

		const updatedProperty = await prisma.property.update({
			where: { id },
			data: propertyData,
			include: propertyCounts,
		});

		// Revalidar rutas
		await revalidatePropertyPaths();

		const result = toPropertyWithStats(updatedProperty);

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
		const existingProperty = await prisma.property.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!existingProperty) {
			throw new PropertyServiceError('Propiedad no encontrada', 'PROPERTY_NOT_FOUND');
		}

		await prisma.property.delete({
			where: { id },
		});

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
		const currentProperty = await prisma.property.findUnique({
			where: { id },
			select: { isFavorite: true },
		});

		if (!currentProperty) {
			throw new PropertyServiceError('Propiedad no encontrada', 'PROPERTY_NOT_FOUND');
		}

		const updatedProperty = await prisma.property.update({
			where: { id },
			data: { isFavorite: !currentProperty.isFavorite },
			include: propertyCounts,
		});

		// Revalidar rutas
		await revalidatePropertyPaths();

		const result = toPropertyWithStats(updatedProperty);

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

		const properties = await prisma.property.findMany({
			where: {
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ description: { contains: query, mode: 'insensitive' } },
				],
			},
			include: propertyCounts,
			orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
		});

		const result = properties.map(toPropertyWithStats);
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
