'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { toCreatePropertyData, toUpdatePropertyData } from '@/transformers/property';
import { CreatePropertySchema, UpdatePropertySchema } from '@/types/entities/property/schema';
import { z } from 'zod';

const logger = serverLogger.withContext('PropertyActions');

type CreatePropertyData = z.infer<typeof CreatePropertySchema>;
type UpdatePropertyData = z.infer<typeof UpdatePropertySchema>;

/**
 * Obtiene todas las propiedades con sus estadísticas
 */
export async function getProperties() {
	try {
		const properties = await prisma.property.findMany({
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
			orderBy: {
				name: 'asc',
			},
		});

		logger.info(`✅ Se obtuvieron ${properties.length} propiedades`);
		return properties;
	} catch (error) {
		logger.error('❌ Error al obtener propiedades:', error);
		throw error;
	}
}

/**
 * Obtiene una propiedad por su ID
 */
export async function getProperty(id: string) {
	try {
		const property = await prisma.property.findUnique({
			where: { id },
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
		});

		if (!property) {
			throw new Error(`No se encontró la propiedad con ID ${id}`);
		}

		logger.info('✅ Propiedad obtenida:', property.name);
		return property;
	} catch (error) {
		logger.error('❌ Error al obtener propiedad:', error);
		throw error;
	}
}

/**
 * Crea una nueva propiedad
 */
export async function createProperty(data: CreatePropertyData) {
	try {
		const prismaData = toCreatePropertyData(data);

		const property = await prisma.property.create({
			data: prismaData,
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
		});

		logger.info('✅ Propiedad creada:', property.name);
		return property;
	} catch (error) {
		logger.error('❌ Error al crear propiedad:', error);
		throw error;
	}
}

/**
 * Actualiza una propiedad existente
 */
export async function updateProperty(id: string, data: UpdatePropertyData) {
	try {
		const prismaData = toUpdatePropertyData(data);

		const property = await prisma.property.update({
			where: { id },
			data: prismaData,
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
		});

		logger.info('✅ Propiedad actualizada:', property.name);
		return property;
	} catch (error) {
		logger.error('❌ Error al actualizar propiedad:', error);
		throw error;
	}
}

/**
 * Marca o desmarca una propiedad como favorita
 */
export async function togglePropertyFavorite(id: string) {
	try {
		// Obtener el estado actual
		const property = await prisma.property.findUnique({
			where: { id },
			select: { favorite: true },
		});

		if (!property) {
			throw new Error(`No se encontró la propiedad con ID ${id}`);
		}

		// Invertir el estado
		const updatedProperty = await prisma.property.update({
			where: { id },
			data: { favorite: !property.favorite },
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
		});

		logger.info(
			`✅ Propiedad ${updatedProperty.favorite ? 'marcada' : 'desmarcada'} como favorita:`,
			updatedProperty.name
		);
		return updatedProperty;
	} catch (error) {
		logger.error('❌ Error al actualizar favorito:', error);
		throw error;
	}
}

/**
 * Elimina una propiedad
 */
export async function deleteProperty(id: string) {
	try {
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
