'use server';

/**
 * @file Server Actions para la entidad Collection
 * @module app/actions/collections/collection.actions
 * @description Acciones CRUD y de gestión de relaciones para las Colecciones.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import {
	fromPrismaCollection,
	fromPrismaCollections,
	mapCollectionSearchOptionsToPrisma,
	mapCreateCollectionDataToPrisma,
	mapUpdateCollectionDataToPrisma,
} from '@/transformers/collection';
import type {
	CollectionComplete,
	CollectionCreateInput,
	CollectionSearchOptions,
	CollectionUpdateInput
} from '@/types/entities/collection';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('CollectionActions');

// Objeto de inclusión para obtener una colección completa con todas sus relaciones y conteos.
const COLLECTION_INCLUDE = {
	images: true,
	videos: true,
	tags: true,
	groups: true,
	properties: true,
	wildcards: true,
	parent: true,
	children: true,
	albums: true,
	_count: true,
};

/**
 * Revalida las rutas de caché relacionadas con las colecciones.
 */
async function revalidateCollectionPaths() {
	revalidatePath('/collections');
	revalidatePath('/settings/collections');
}

/**
 * Busca y obtiene colecciones según los criterios de búsqueda.
 */
export async function searchCollections(options: CollectionSearchOptions): Promise<CollectionComplete[]> {
	logger.info('🔍 Buscando colecciones', { options });
	const prismaOptions = mapCollectionSearchOptionsToPrisma(options);
	const collections = await prisma.collection.findMany({
		...prismaOptions,
		include: COLLECTION_INCLUDE,
	});
	return fromPrismaCollections(collections);
}

/**
 * Obtiene una única colección por su ID.
 */
export async function getCollection(id: string): Promise<CollectionComplete | null> {
	logger.info(`🔍 Obteniendo colección por ID: ${id}`);
	const collection = await prisma.collection.findUnique({
		where: { id },
		include: COLLECTION_INCLUDE,
	});
	if (!collection) {
		logger.warn(`Colección no encontrada: ${id}`);
		return null;
	}
	return fromPrismaCollection(collection);
}

/**
 * Crea una nueva colección.
 */
export async function createCollection(data: CollectionCreateInput): Promise<CollectionComplete> {
	logger.info('➕ Creando nueva colección:', { name: data.name });
	const prismaData = mapCreateCollectionDataToPrisma(data);
	const newCollection = await prisma.collection.create({
		data: prismaData,
		include: COLLECTION_INCLUDE
	});
	await revalidateCollectionPaths();
	return fromPrismaCollection(newCollection);
}

/**
 * Actualiza una colección existente.
 */
export async function updateCollection(id: string, data: CollectionUpdateInput): Promise<CollectionComplete> {
	logger.info(`🔄 Actualizando colección: ${id}`);
	const prismaData = mapUpdateCollectionDataToPrisma(data);
	const updatedCollection = await prisma.collection.update({
		where: { id },
		data: prismaData,
		include: COLLECTION_INCLUDE
	});
	await revalidateCollectionPaths();
	revalidatePath(`/collections/${id}`);
	return fromPrismaCollection(updatedCollection);
}

/**
 * Elimina una colección.
 */
export async function deleteCollection(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando colección: ${id}`);
	await prisma.collection.delete({ where: { id } });
	await revalidateCollectionPaths();
}

/**
 * Añade una imagen a una colección.
 */
export async function addImageToCollection(collectionId: string, imageId: string): Promise<void> {
	logger.info(`🖼️ Añadiendo imagen ${imageId} a colección ${collectionId}`);
	await prisma.collection.update({
		where: { id: collectionId },
		data: { images: { connect: { id: imageId } } },
	});
	revalidatePath(`/collections/${collectionId}`);
}

/**
 * Elimina una imagen de una colección.
 */
export async function removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
	logger.info(`🖼️ Eliminando imagen ${imageId} de colección ${collectionId}`);
	await prisma.collection.update({
		where: { id: collectionId },
		data: { images: { disconnect: { id: imageId } } },
	});
	revalidatePath(`/collections/${collectionId}`);
}

/**
 * Obtiene las imágenes de una colección específica.
 */
export async function getCollectionImages(collectionId: string): Promise<Array<{ id: string; name: string; path: string }>> {
	logger.info(`🖼️ Obteniendo imágenes de la colección: ${collectionId}`);
	const collection = await prisma.collection.findUnique({
		where: { id: collectionId },
		include: {
			images: {
				orderBy: { createdAt: 'desc' },
			},
		},
	});

	if (!collection) {
		logger.warn(`Colección no encontrada: ${collectionId}`);
		return [];
	}

	return collection.images;
}

/**
 * Añade una colección a una imagen (relación inversa).
 */
export async function addCollectionToImage(imageId: string, collectionId: string): Promise<void> {
	logger.info(`🖼️ Añadiendo colección ${collectionId} a imagen ${imageId}`);
	await prisma.image.update({
		where: { id: imageId },
		data: { collections: { connect: { id: collectionId } } },
	});
	revalidatePath(`/images/${imageId}`);
	revalidatePath(`/collections/${collectionId}`);
}

/**
 * Elimina una colección de una imagen (relación inversa).
 */
export async function removeCollectionFromImage(imageId: string, collectionId: string): Promise<void> {
	logger.info(`🖼️ Eliminando colección ${collectionId} de imagen ${imageId}`);
	await prisma.image.update({
		where: { id: imageId },
		data: { collections: { disconnect: { id: collectionId } } },
	});
	revalidatePath(`/images/${imageId}`);
	revalidatePath(`/collections/${collectionId}`);
}
