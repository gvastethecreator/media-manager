/**
 * @file Exportaciones de transformers para la entidad Collection
 * @module transformers/collection
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
	CollectionComplete,
	CollectionCreateInput,
	CollectionSearchOptions,
	CollectionSearchResult,
	CollectionUpdateInput,
} from '@/types/entities/collection/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
	mapCollectionSearchOptionsToPrisma,
	mapCollectionToRelatedCollection,
	mapCreateCollectionDataToPrisma,
	mapUpdateCollectionDataToPrisma,
} from './mappers';
import { fromPrismaCollection, parseCollectionFilters, toPrismaCollection, validateCollection } from './serializers';
// Importar el transformador principal y sus funciones asociadas
import {
	transformCollection as transformCollectionMain,
	transformCollectionToExtended,
	transformCollectionToWithStats,
	transformCollections as transformCollectionsMain,
} from './transformer';

const logger = serverLogger.withContext('CollectionTransformer');

// Exportar el transformador principal y sus variantes
export const transformCollection = transformCollectionMain;
export const transformCollections = transformCollectionsMain;
export { transformCollectionToExtended, transformCollectionToWithStats };

/**
 * 🔍 Busca colecciones según los criterios especificados
 */
export async function searchCollections(options: CollectionSearchOptions): Promise<CollectionSearchResult> {
	try {
		// Mapear opciones de búsqueda a formato Prisma
		const prismaOptions = mapCollectionSearchOptionsToPrisma(options);

		// Realizar búsqueda
		const [items, total] = await Promise.all([
			prisma.collection.findMany(prismaOptions),
			prisma.collection.count({ where: prismaOptions.where }),
		]);

		// Deserializar resultados
		const collections = items.map((item) => fromPrismaCollection(item));

		return {
			items: collections,
			total,
			page: options.page || 1,
			pageSize: prismaOptions.take || 10,
			totalPages: Math.ceil(total / (prismaOptions.take || 10)),
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Obtiene una colección por su ID
 */
export async function getCollectionById(id: string): Promise<CollectionComplete | null> {
	try {
		const collection = await prisma.collection.findUnique({
			where: { id },
			include: {
				owner: true,
				parent: true,
				children: true,
				images: true,
				videos: true,
				albums: true,
				tags: true,
				groups: true,
				characters: true,
				places: true,
				items: true,
				notes: true,
				sharedWith: true,
				_count: true,
			},
		});

		if (!collection) {
			return null;
		}

		return fromPrismaCollection(collection);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * ✨ Crea una nueva colección
 */
export async function createCollection(data: CollectionCreateInput): Promise<CollectionComplete> {
	try {
		// Validar datos de entrada
		await validateCollection(data);

		// Serializar datos para Prisma
		const prismaData = toPrismaCollection(data);

		// Mapear datos a formato Prisma
		const createData = mapCreateCollectionDataToPrisma(data);

		// Crear colección
		const collection = await prisma.collection.create({
			data: createData,
			include: {
				owner: true,
				parent: true,
				children: true,
				images: true,
				videos: true,
				albums: true,
				tags: true,
				groups: true,
				characters: true,
				places: true,
				items: true,
				notes: true,
				sharedWith: true,
				_count: true,
			},
		});

		return fromPrismaCollection(collection);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 📝 Actualiza una colección existente
 */
export async function updateCollection(id: string, data: CollectionUpdateInput): Promise<CollectionComplete> {
	try {
		// Validar datos de entrada
		await validateCollection(data);

		// Serializar datos para Prisma
		const prismaData = toPrismaCollection(data);

		// Mapear datos a formato Prisma
		const updateData = mapUpdateCollectionDataToPrisma(data);

		// Actualizar colección
		const collection = await prisma.collection.update({
			where: { id },
			data: updateData,
			include: {
				owner: true,
				parent: true,
				children: true,
				images: true,
				videos: true,
				albums: true,
				tags: true,
				groups: true,
				characters: true,
				places: true,
				items: true,
				notes: true,
				sharedWith: true,
				_count: true,
			},
		});

		return fromPrismaCollection(collection);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🗑️ Elimina una colección
 */
export async function deleteCollection(id: string): Promise<void> {
	try {
		await prisma.collection.delete({
			where: { id },
		});
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Convierte una colección a su versión relacionada
 */
export function toRelatedCollection(collection: CollectionComplete) {
	try {
		return mapCollectionToRelatedCollection(collection);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Parsea filtros de colección
 */
export function parseCollectionFilterOptions(filters: any) {
	try {
		return parseCollectionFilters(filters);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

// Objeto de compatibilidad para código anterior
export const CollectionTransformer = {
	searchCollections,
	getCollectionById,
	createCollection,
	updateCollection,
	deleteCollection,
	toRelatedCollection,
	parseFilters: parseCollectionFilterOptions,
	transformCollection,
	transformCollections,
	transformCollectionToExtended,
	transformCollectionToWithStats,
};

export default CollectionTransformer;

// Exportar funciones individuales para uso directo
export {
	fromPrismaCollection,
	mapCollectionSearchOptionsToPrisma,
	mapCollectionToRelatedCollection,
	mapCreateCollectionDataToPrisma,
	mapUpdateCollectionDataToPrisma,
	parseCollectionFilters,
	toPrismaCollection,
	validateCollection,
};
