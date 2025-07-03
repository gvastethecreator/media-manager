/**
 * @file Servicio para operaciones con metadatos
 * @module services/metadata/metadata.service
 * ✅ MIGRADO A DRIZZLE - 2025-07-03
 */

// Drizzle imports
import { db } from '@/lib/drizzle';
import { metadatas } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import * as crypto from 'crypto';
import {
	mapCreateMetadataDataToPrisma,
	mapUpdateMetadataDataToPrisma,
	transformMetadata,
	transformMetadatas,
} from '@/transformers/metadata';
import { MetadataExtended } from '@/types/entities/metadata/extended';
import { MetadataBase } from '@/types/entities/metadata/types';

/**
 * Obtiene todos los metadatos
 * @returns Array de metadatos extendidos
 */
export async function getAllMetadata(): Promise<MetadataExtended[]> {
	try {
		// **MIGRACIÓN A DRIZZLE**
		const drizzleMetadatas = await db
			.select({
				id: metadatas.id,
				entityType: metadatas.entityType,
				entityId: metadatas.entityId,
				key: metadatas.key,
				value: metadatas.value,
				type: metadatas.type,
				isPublic: metadatas.isPublic,
				category: metadatas.category,
				description: metadatas.description,
				createdAt: metadatas.createdAt,
				updatedAt: metadatas.updatedAt,
			})
			.from(metadatas)
			.orderBy(desc(metadatas.updatedAt));

		// Transformar a formato compatible con Prisma
		const transformedMetadatas = drizzleMetadatas.map((rawMetadata) => ({
			...rawMetadata,
			isPublic: Boolean(rawMetadata.isPublic),
		}));

		return transformMetadatas(transformedMetadatas as any);
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
		// **MIGRACIÓN A DRIZZLE**
		const drizzleMetadata = await db
			.select({
				id: metadatas.id,
				entityType: metadatas.entityType,
				entityId: metadatas.entityId,
				key: metadatas.key,
				value: metadatas.value,
				type: metadatas.type,
				isPublic: metadatas.isPublic,
				category: metadatas.category,
				description: metadatas.description,
				createdAt: metadatas.createdAt,
				updatedAt: metadatas.updatedAt,
			})
			.from(metadatas)
			.where(eq(metadatas.entityId, imageId))
			.limit(1);

		if (drizzleMetadata.length === 0) {
			return null;
		}

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...drizzleMetadata[0],
			isPublic: Boolean(drizzleMetadata[0].isPublic),
		};

		return transformMetadata(transformedMetadata as any);
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
		// **MIGRACIÓN A DRIZZLE**
		const drizzleMetadata = await db
			.select({
				id: metadatas.id,
				entityType: metadatas.entityType,
				entityId: metadatas.entityId,
				key: metadatas.key,
				value: metadatas.value,
				type: metadatas.type,
				isPublic: metadatas.isPublic,
				category: metadatas.category,
				description: metadatas.description,
				createdAt: metadatas.createdAt,
				updatedAt: metadatas.updatedAt,
			})
			.from(metadatas)
			.where(eq(metadatas.id, id))
			.limit(1);

		if (drizzleMetadata.length === 0) {
			return null;
		}

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...drizzleMetadata[0],
			isPublic: Boolean(drizzleMetadata[0].isPublic),
		};

		return transformMetadata(transformedMetadata as any);
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

		// **MIGRACIÓN A DRIZZLE**
		const result = await db.insert(metadatas).values({
			id: crypto.randomUUID(),
			entityType: prismaData.entityType,
			entityId: prismaData.entityId,
			key: prismaData.key,
			value: prismaData.value || null,
			type: prismaData.type || 'string',
			isPublic: prismaData.isPublic || false,
			category: prismaData.category || null,
			description: prismaData.description || null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).returning();

		const newMetadata = result[0];

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...newMetadata,
			isPublic: Boolean(newMetadata.isPublic),
		};

		return transformMetadata(transformedMetadata as any);
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

		// **MIGRACIÓN A DRIZZLE**
		const result = await db.update(metadatas)
			.set({
				...prismaData,
				updatedAt: new Date(),
			})
			.where(eq(metadatas.id, id))
			.returning();

		if (result.length === 0) {
			return null;
		}

		// Transformar a formato compatible con Prisma
		const transformedMetadata = {
			...result[0],
			isPublic: Boolean(result[0].isPublic),
		};

		return transformMetadata(transformedMetadata as any);
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
		// **MIGRACIÓN A DRIZZLE**
		await db.delete(metadatas)
			.where(eq(metadatas.id, id));

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
		// **MIGRACIÓN A DRIZZLE**
		await db.delete(metadatas)
			.where(eq(metadatas.entityId, imageId));

		return true;
	} catch (error) {
		console.error(`Error al eliminar metadatos para imagen ${imageId}:`, error);
		return false;
	}
}
