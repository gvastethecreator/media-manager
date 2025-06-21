'use server';

/**
 * @file Server Actions para la entidad Collection
 * @module app/actions/collections/collection.actions
 * @description Acciones CRUD y de gestión de relaciones para las Colecciones.
 */

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import {
    toPrismaCollectionCreate,
    toPrismaCollectionUpdate,
} from '@/transformers/collection/serializers';
import {
    fromPrismaCollection,
    fromPrismaCollections,
} from '@/transformers/collection/transformer';
import type {
    CollectionCreateInput,
    CollectionSearchOptions,
    CollectionUpdateInput,
    CollectionWithStats,
} from '@/types/entities/collection';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('CollectionActions');

// Selección optimizada para obtener solo los conteos
const COLLECTION_SELECT_WITH_STATS = {
	id: true,
	name: true,
	emoji: true,
	color: true,
	description: true,
	shortcut: true,
	category: true,
	sortBy: true,
	filters: true,
	url: true,
	alternativeUrl: true,
	sourceImage: true,
	platform: true,
	price: true,
	network: true,
	tokenId: true,
	tokenAddress: true,
	contractAddress: true,
	contractType: true,
	editions: true,
	featuredImage: true,
	isFavorite: true,
	createdAt: true,
	updatedAt: true,
	_count: {
		select: {
			images: true,
			videos: true,
			albums: true,
			tags: true,
			characters: true,
			places: true,
			worldItems: true,
			concepts: true,
			prompts: true,
			notes: true,
			wildcards: true,
			properties: true,
			groups: true,
		},
	},
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
export async function searchCollections(
	options: CollectionSearchOptions
): Promise<CollectionWithStats[]> {
	logger.info('🔍 Buscando colecciones', { options });
	const prisma = await getPrismaClient();

	// Construir query básica
	const where: any = {};
	if (options.filters?.search) {
		where.OR = [
			{ name: { contains: options.filters.search } },
			{ description: { contains: options.filters.search } },
		];
	}
	if (options.filters?.isFavorite !== undefined) {
		where.isFavorite = options.filters.isFavorite;
	}
	if (options.filters?.category && options.filters.category.length > 0) {
		where.category = { in: options.filters.category };
	}

	const collections = await prisma.collection.findMany({
		where,
		select: COLLECTION_SELECT_WITH_STATS,
		skip: options.skip,
		take: options.take,
		orderBy: options.orderBy || { createdAt: 'desc' },
	});

	return fromPrismaCollections(collections);
}

/**
 * Obtiene todas las colecciones.
 */
export async function getCollections(): Promise<CollectionWithStats[]> {
	logger.info('📚 Obteniendo todas las colecciones');
	const prisma = await getPrismaClient();
	const collections = await prisma.collection.findMany({
		select: COLLECTION_SELECT_WITH_STATS,
		orderBy: { createdAt: 'desc' },
	});
	return fromPrismaCollections(collections);
}

/**
 * Obtiene una única colección por su ID.
 */
export async function getCollection(id: string): Promise<CollectionWithStats | null> {
	logger.info(`🔍 Obteniendo colección por ID: ${id}`);
	const prisma = await getPrismaClient();
	const collection = await prisma.collection.findUnique({
		where: { id },
		select: COLLECTION_SELECT_WITH_STATS,
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
export async function createCollection(
	data: CollectionCreateInput
): Promise<CollectionWithStats> {
	logger.info('➕ Creando nueva colección:', { name: data.name });
	const prisma = await getPrismaClient();
	const prismaData = toPrismaCollectionCreate(data);
	const newCollection = await prisma.collection.create({
		data: prismaData,
		select: COLLECTION_SELECT_WITH_STATS,
	});
	await revalidateCollectionPaths();
	const transformed = fromPrismaCollection(newCollection);
	if (!transformed) {
		throw new Error('Error al transformar la colección recién creada.');
	}
	return transformed;
}

/**
 * Actualiza una colección existente.
 */
export async function updateCollection(
	id: string,
	data: CollectionUpdateInput
): Promise<CollectionWithStats> {
	logger.info(`🔄 Actualizando colección: ${id}`);
	const prisma = await getPrismaClient();
	const prismaData = toPrismaCollectionUpdate(data);
	const updatedCollection = await prisma.collection.update({
		where: { id },
		data: prismaData,
		select: COLLECTION_SELECT_WITH_STATS,
	});
	await revalidateCollectionPaths();
	revalidatePath(`/collections/${id}`);
	const transformed = fromPrismaCollection(updatedCollection);
	if (!transformed) {
		throw new Error('Error al transformar la colección actualizada.');
	}
	return transformed;
}

/**
 * Elimina una colección.
 */
export async function deleteCollection(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando colección: ${id}`);
	const prisma = await getPrismaClient();
	await prisma.collection.delete({ where: { id } });
	await revalidateCollectionPaths();
}

/**
 * Obtiene las imágenes de una colección específica de forma eficiente.
 */
export async function getCollectionImages(
	collectionId: string
): Promise<{ id: string; name: string; path: string }[]> {
	logger.info(`🖼️ Obteniendo imágenes de la colección: ${collectionId}`);
	const prisma = await getPrismaClient();

	const images = await prisma.image.findMany({
		where: {
			collections: {
				some: {
					id: collectionId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});

	return images;
}
