'use server';

import { prisma } from '@/lib/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import { toPropertyWithStats } from '@/transformers/property';
import { propertyCounts, PropertyWithStats } from '@/types/entities/property';
import { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('PropertyActions');

/**
 * Obtiene todas las propiedades
 */
export async function getProperties(): Promise<PropertyWithStats[]> {
	try {
		const properties = await prisma.property.findMany({
			orderBy: { name: 'asc' },
			include: propertyCounts,
		});

		logger.info('✅ Propiedades obtenidas:', properties.length);
		return properties.map(toPropertyWithStats);
	} catch (error) {
		logger.error('❌ Error al obtener propiedades:', error);
		throw new Error('No se pudieron obtener las propiedades.');
	}
}

/**
 * Obtiene una propiedad por su ID
 */
export async function getProperty(id: string): Promise<PropertyWithStats | null> {
	try {
		const property = await prisma.property.findUnique({
			where: { id },
			include: propertyCounts,
		});

		if (!property) {
			logger.warn('⚠️ Propiedad no encontrada:', id);
			return null;
		}

		logger.info('✅ Propiedad obtenida:', property.name);
		return toPropertyWithStats(property);
	} catch (error) {
		logger.error('❌ Error al obtener propiedad:', error);
		throw new Error(`No se pudo obtener la propiedad: ${id}.`);
	}
}

/**
 * Crea una nueva propiedad
 */
export async function createProperty(data: Prisma.PropertyCreateInput): Promise<PropertyWithStats> {
	try {
		const property = await prisma.property.create({
			data,
			include: propertyCounts,
		});

		logger.info('✅ Propiedad creada:', property.name);
		return toPropertyWithStats(property);
	} catch (error) {
		logger.error('❌ Error al crear propiedad:', error);
		throw new Error('No se pudo crear la propiedad.');
	}
}

/**
 * Actualiza una propiedad existente
 */
export async function updateProperty(id: string, data: Prisma.PropertyUpdateInput): Promise<PropertyWithStats> {
	try {
		const property = await prisma.property.update({
			where: { id },
			data,
			include: propertyCounts,
		});

		logger.info('✅ Propiedad actualizada:', property.name);
		return toPropertyWithStats(property);
	} catch (error) {
		logger.error('❌ Error al actualizar propiedad:', error);
		throw new Error(`No se pudo actualizar la propiedad: ${id}.`);
	}
}

/**
 * Alterna el estado de favorito de una propiedad
 */
export async function togglePropertyFavorite(id: string): Promise<PropertyWithStats> {
	try {
		const current = await prisma.property.findUnique({
			where: { id },
			select: { isFavorite: true },
		});

		if (!current) {
			throw new Error(`No se encontró la propiedad con ID ${id}`);
		}

		const property = await prisma.property.update({
			where: { id },
			data: { isFavorite: !current.isFavorite },
			include: propertyCounts,
		});

		logger.info('✅ Favorito de propiedad actualizado:', property.name, `isFavorite: ${property.isFavorite}`);
		return toPropertyWithStats(property);
	} catch (error) {
		logger.error('❌ Error al actualizar favorito de propiedad:', error);
		throw new Error(`No se pudo actualizar el estado de favorito para la propiedad: ${id}.`);
	}
}

/**
 * Elimina una propiedad
 */
export async function deleteProperty(id: string): Promise<void> {
	try {
		await prisma.property.delete({
			where: { id },
		});
		logger.info('✅ Propiedad eliminada:', id);
	} catch (error) {
		logger.error('❌ Error al eliminar propiedad:', error);
		throw new Error(`No se pudo eliminar la propiedad: ${id}.`);
	}
}
