'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { fromPrismaProperty, toCreatePropertyData, toUpdatePropertyData } from '@/transformers/property';
import type { PropertyWithStats } from '@/types/entities/property';
import { CreatePropertySchema, UpdatePropertySchema } from '@/types/entities/property/schema';
import { z } from 'zod';

const logger = serverLogger.withContext('PropertyActions');

type CreatePropertyData = z.infer<typeof CreatePropertySchema>;
type UpdatePropertyData = z.infer<typeof UpdatePropertySchema>;

const propertyPayload = {
	include: {
		_count: {
			select: {
				images: true,
				videos: true,
				albums: true,
				collections: true,
				tags: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				groups: true,
			},
		},
	},
};

/**
 * Obtiene todas las propiedades
 */
export async function getProperties(): Promise<PropertyWithStats[]> {
	try {
		const prisma = await getPrismaClient();
		const properties = await prisma.property.findMany({
			orderBy: { name: 'asc' },
			...propertyPayload,
		});

		logger.info('✅ Propiedades obtenidas:', properties.length);
		return properties.map(fromPrismaProperty).filter((p): p is PropertyWithStats => p !== null);
	} catch (error) {
		logger.error('❌ Error al obtener propiedades:', error);
		throw error;
	}
}

/**
 * Obtiene una propiedad por su ID
 */
export async function getProperty(id: string): Promise<PropertyWithStats | null> {
	try {
		const prisma = await getPrismaClient();
		const property = await prisma.property.findUnique({
			where: { id },
			...propertyPayload,
		});

		if (!property) {
			return null;
		}

		logger.info('✅ Propiedad obtenida:', property.name);
		return fromPrismaProperty(property);
	} catch (error) {
		logger.error('❌ Error al obtener propiedad:', error);
		throw error;
	}
}

/**
 * Crea una nueva propiedad
 */
export async function createProperty(data: CreatePropertyData): Promise<PropertyWithStats> {
	try {
		const prismaData = toCreatePropertyData(data);
		const prisma = await getPrismaClient();

		const property = await prisma.property.create({
			data: prismaData,
			...propertyPayload,
		});

		logger.info('✅ Propiedad creada:', property.name);
		const transformed = fromPrismaProperty(property);
		if (!transformed) throw new Error('Error al transformar la propiedad creada');
		return transformed;
	} catch (error) {
		logger.error('❌ Error al crear propiedad:', error);
		throw error;
	}
}

/**
 * Actualiza una propiedad existente
 */
export async function updateProperty(id: string, data: UpdatePropertyData): Promise<PropertyWithStats> {
	try {
		const prismaData = toUpdatePropertyData(data);
		const prisma = await getPrismaClient();

		const property = await prisma.property.update({
			where: { id },
			data: prismaData,
			...propertyPayload,
		});

		logger.info('✅ Propiedad actualizada:', property.name);
		const transformed = fromPrismaProperty(property);
		if (!transformed) throw new Error('Error al transformar la propiedad actualizada');
		return transformed;
	} catch (error) {
		logger.error('❌ Error al actualizar propiedad:', error);
		throw error;
	}
}

/**
 * Alterna el estado de favorito de una propiedad
 */
export async function togglePropertyFavorite(id: string): Promise<PropertyWithStats> {
	try {
		const prisma = await getPrismaClient();

		// Obtener el estado actual
		const current = await prisma.property.findUnique({
			where: { id },
			select: { isFavorite: true },
		});

		if (!current) {
			throw new Error(`No se encontró la propiedad con ID ${id}`);
		}

		// Actualizar con el estado opuesto
		const property = await prisma.property.update({
			where: { id },
			data: { isFavorite: !current.isFavorite },
			...propertyPayload,
		});

		logger.info('✅ Favorito de propiedad actualizado:', property.name, `isFavorite: ${property.isFavorite}`);
		const transformed = fromPrismaProperty(property);
		if (!transformed) throw new Error('Error al transformar la propiedad actualizada');
		return transformed;
	} catch (error) {
		logger.error('❌ Error al actualizar favorito de propiedad:', error);
		throw error;
	}
}

/**
 * Elimina una propiedad
 */
export async function deleteProperty(id: string): Promise<boolean> {
	try {
		const prisma = await getPrismaClient();
		await prisma.property.delete({
			where: { id },
		});

		logger.info('✅ Propiedad eliminada:', id);
		return true;
	} catch (error) {
		logger.error('❌ Error al eliminar propiedad:', error);
		throw error;
	}
}
