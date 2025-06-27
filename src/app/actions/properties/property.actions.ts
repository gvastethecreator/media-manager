'use server';

/**
 * @file Server Actions para la entidad Property
 * @module app/actions/properties/property.actions
 * @description Controladores delgados que llaman al servicio de propiedades
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import propertyService, { type GetPropertiesOptions } from '@/services/property/property.service';
import type { PropertyCreateInput, PropertyUpdateInput, PropertyWithStats } from '@/types/entities/property';
import { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('PropertyActions');

/**
 * Obtiene todas las propiedades
 */
export async function getProperties(options?: GetPropertiesOptions): Promise<PropertyWithStats[]> {
	try {
		logger.info('📋 Obteniendo propiedades via action', { options });
		const result = await propertyService.getProperties(options);
		return result.properties;
	} catch (error) {
		logger.error('❌ Error en action getProperties', { error, options });
		throw error;
	}
}

/**
 * Obtiene una propiedad por su ID
 */
export async function getProperty(id: string): Promise<PropertyWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo propiedad ${id} via action`);
		return await propertyService.getProperty(id);
	} catch (error) {
		logger.error(`❌ Error en action getProperty: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea una nueva propiedad
 */
export async function createProperty(data: PropertyCreateInput): Promise<PropertyWithStats> {
	try {
		logger.info('📝 Creando propiedad via action', { name: data.name });
		return await propertyService.createProperty(data);
	} catch (error) {
		logger.error('❌ Error en action createProperty', { error, data });
		throw error;
	}
}

/**
 * Actualiza una propiedad existente
 */
export async function updateProperty(id: string, data: PropertyUpdateInput): Promise<PropertyWithStats> {
	try {
		logger.info(`📝 Actualizando propiedad ${id} via action`);
		return await propertyService.updateProperty(id, data);
	} catch (error) {
		logger.error(`❌ Error en action updateProperty: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Alterna el estado de favorito de una propiedad
 */
export async function togglePropertyFavorite(id: string): Promise<PropertyWithStats> {
	try {
		logger.info(`⭐ Cambiando favorito de propiedad ${id} via action`);
		return await propertyService.togglePropertyFavorite(id);
	} catch (error) {
		logger.error(`❌ Error en action togglePropertyFavorite: ${id}`, { error });
		throw error;
	}
}

/**
 * Elimina una propiedad
 */
export async function deleteProperty(id: string): Promise<void> {
	try {
		logger.info(`🗑️ Eliminando propiedad ${id} via action`);
		await propertyService.deleteProperty(id);
	} catch (error) {
		logger.error(`❌ Error en action deleteProperty: ${id}`, { error });
		throw error;
	}
}

/**
 * Busca propiedades por nombre o descripción
 */
export async function searchProperties(query: string): Promise<PropertyWithStats[]> {
	try {
		logger.info(`🔍 Buscando propiedades "${query}" via action`);
		return await propertyService.searchProperties(query);
	} catch (error) {
		logger.error(`❌ Error en action searchProperties: "${query}"`, { error });
		throw error;
	}
}

// Mantener compatibilidad con código legacy que usa Prisma types
export async function createPropertyLegacy(data: Prisma.PropertyCreateInput): Promise<PropertyWithStats> {
	const propertyInput: PropertyCreateInput = {
		name: data.name,
		description: data.description || undefined,
		value: data.value || undefined,
		type: data.type || undefined,
		unit: data.unit || undefined,
		category: data.category || undefined,
		isRequired: data.isRequired || false,
		isPrivate: data.isPrivate || false,
		isFavorite: data.isFavorite || false,
	};
	return createProperty(propertyInput);
}

export async function updatePropertyLegacy(id: string, data: Prisma.PropertyUpdateInput): Promise<PropertyWithStats> {
	const propertyInput: PropertyUpdateInput = {};
	if (data.name !== undefined) propertyInput.name = data.name as string;
	if (data.description !== undefined) propertyInput.description = data.description as string | undefined;
	if (data.value !== undefined) propertyInput.value = data.value as string | undefined;
	if (data.type !== undefined) propertyInput.type = data.type as string | undefined;
	if (data.unit !== undefined) propertyInput.unit = data.unit as string | undefined;
	if (data.category !== undefined) propertyInput.category = data.category as string | undefined;
	if (data.isRequired !== undefined) propertyInput.isRequired = data.isRequired as boolean;
	if (data.isPrivate !== undefined) propertyInput.isPrivate = data.isPrivate as boolean;
	if (data.isFavorite !== undefined) propertyInput.isFavorite = data.isFavorite as boolean;

	return updateProperty(id, propertyInput);
}
