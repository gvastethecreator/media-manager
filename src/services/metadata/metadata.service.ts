/**
 * @file Servicio para operaciones con metadatos
 * @module services/metadata/metadata.service
 */

import { db } from '@/lib/prisma';
import {
	mapCreateMetadataDataToPrisma,
	mapUpdateMetadataDataToPrisma,
	transformMetadata,
	transformMetadatas,
} from '@/transformers/metadata';
import { MetadataBase } from '@/types/entities/metadata/base';
import { MetadataExtended } from '@/types/entities/metadata/extended';

/**
 * Obtiene todos los metadatos
 * @returns Array de metadatos extendidos
 */
export async function getAllMetadata(): Promise<MetadataExtended[]> {
	try {
		const metadatas = await db.metadata.findMany({
			orderBy: {
				updatedAt: 'desc',
			},
		});

		return transformMetadatas(metadatas);
	} catch (error) {
		console.error('Error al obtener metadatos:', error);
		return [];
	}
}

/**
 * Obtiene metadatos por ID de imagen
 * @param imageId - ID de la imagen
 * @returns Metadatos extendidos o null si no se encuentra
 */
export async function getMetadataByImageId(imageId: string): Promise<MetadataExtended | null> {
	try {
		const metadata = await db.metadata.findUnique({
			where: {
				imageId,
			},
		});

		return transformMetadata(metadata);
	} catch (error) {
		console.error(`Error al obtener metadatos para imagen ${imageId}:`, error);
		return null;
	}
}

/**
 * Obtiene metadatos por ID
 * @param id - ID de los metadatos
 * @returns Metadatos extendidos o null si no se encuentra
 */
export async function getMetadataById(id: string): Promise<MetadataExtended | null> {
	try {
		const metadata = await db.metadata.findUnique({
			where: {
				id,
			},
		});

		return transformMetadata(metadata);
	} catch (error) {
		console.error(`Error al obtener metadatos ${id}:`, error);
		return null;
	}
}

/**
 * Crea nuevos metadatos
 * @param data - Datos para crear metadatos
 * @returns Metadatos creados o null si hay error
 */
export async function createMetadata(data: Partial<MetadataBase>): Promise<MetadataExtended | null> {
	try {
		const prismaData = mapCreateMetadataDataToPrisma(data);

		const metadata = await db.metadata.create({
			data: prismaData,
		});

		return transformMetadata(metadata);
	} catch (error) {
		console.error('Error al crear metadatos:', error);
		return null;
	}
}

/**
 * Actualiza metadatos existentes
 * @param id - ID de los metadatos
 * @param data - Datos para actualizar
 * @returns Metadatos actualizados o null si hay error
 */
export async function updateMetadata(id: string, data: Partial<MetadataBase>): Promise<MetadataExtended | null> {
	try {
		const prismaData = mapUpdateMetadataDataToPrisma(data);

		const metadata = await db.metadata.update({
			where: {
				id,
			},
			data: prismaData,
		});

		return transformMetadata(metadata);
	} catch (error) {
		console.error(`Error al actualizar metadatos ${id}:`, error);
		return null;
	}
}

/**
 * Elimina metadatos
 * @param id - ID de los metadatos
 * @returns true si se eliminó correctamente, false si hubo error
 */
export async function deleteMetadata(id: string): Promise<boolean> {
	try {
		await db.metadata.delete({
			where: {
				id,
			},
		});

		return true;
	} catch (error) {
		console.error(`Error al eliminar metadatos ${id}:`, error);
		return false;
	}
}

/**
 * Elimina todos los metadatos asociados a una imagen
 * @param imageId - ID de la imagen
 * @returns true si se eliminaron correctamente, false si hubo error
 */
export async function deleteMetadataByImageId(imageId: string): Promise<boolean> {
	try {
		await db.metadata.delete({
			where: {
				imageId,
			},
		});

		return true;
	} catch (error) {
		console.error(`Error al eliminar metadatos para imagen ${imageId}:`, error);
		return false;
	}
}
