'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
// Importaciones actualizadas usando nuevos tipos y transformers
import {
  mapCollectionExtendedFromComplete,
  mapCreateCollectionDataToPrisma,
  mapUpdateCollectionDataToPrisma
} from '@/transformers/collection';
import { toCollectionComplete } from '@/transformers/collection/serializers';
import type {
  CollectionBase,
  CollectionExtended,
  CreateCollectionData,
  UpdateCollectionData
} from '@/types/entities/collection';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';

// Utilidades y logging
const collectionLogger = serverLogger.withContext('CollectionActions');

const REVALIDATE_PATHS = ['/settings', '/collections', '/collections/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	collectionLogger.info('🔄 Rutas revalidadas');
};

// Notificar cambios en colecciones
const notifyCollectionChange = async (
	action: 'create' | 'update' | 'delete',
	collection: CollectionBase | { id: string }
) => {
	// Emitir eventos usando el sistema del servidor
	await emit({
		type: 'collections:modified',
		data: { action, collection },
	});
	statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);
};

// Manejo de errores - enfoque funcional
enum CollectionErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createCollectionError = (
	message: string,
	code: CollectionErrorCode = CollectionErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'CollectionError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces para compatibilidad
export interface CollectionWithStats extends CollectionBase {
	_count: {
		images: number;
		groups: number;
		properties: number;
		wildcards: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
}

export interface CollectionWithImages extends CollectionBase {
	images: FileItem[];
}

// Interfaces auxiliares para tipado
interface FolderDistribution {
	name: string;
	_count: {
		images: number;
	};
}

// Acciones del servidor
export async function getCollections(): Promise<CollectionWithStats[]> {
	try {
		collectionLogger.info('📚 Obteniendo colecciones con estadísticas');

		// Obtener colecciones con conteos y estadísticas
		const collections = await prisma.collection.findMany({
			include: {
				_count: {
					select: {
						images: true,
						groups: true,
						properties: true,
						wildcards: true
					},
				},
				images: {
					select: {
						size: true,
						updatedAt: true,
					},
					orderBy: {
						updatedAt: 'desc',
					},
					take: 1,
				},
			},
			orderBy: [
				{
					images: {
						_count: 'desc',
					},
				},
				{
					name: 'asc',
				},
			],
		});

		// Calcular estadísticas adicionales
		const collectionsWithStats = await Promise.all(
			collections.map(async (collection: any) => {
				// Calcular tamaño total
				const totalSize = await prisma.image.aggregate({
					where: {
						collections: {
							some: {
								id: collection.id,
							},
						},
					},
					_sum: {
						size: true,
					},
				});

				// Obtener distribución por carpetas
				const distribution = (await prisma.folder.findMany({
					where: {
						images: {
							some: {
								collections: {
									some: {
										id: collection.id,
									},
								},
							},
						},
					},
					select: {
						name: true,
						_count: {
							select: {
								images: true,
							},
						},
					},
					take: 5,
					orderBy: {
						images: {
							_count: 'desc',
						},
					},
				})) as FolderDistribution[];

				return {
					...collection,
					_count: collection._count,
					totalSize: totalSize._sum.size || 0,
					lastUpdated: collection.images?.[0]?.updatedAt || collection.updatedAt,
					distribution: distribution.map((d: FolderDistribution) => ({
						name: d.name,
						count: d._count.images,
					})),
				};
			})
		);

		collectionLogger.info('✅ Colecciones obtenidas:', collectionsWithStats.length);
		return collectionsWithStats;
	} catch (error) {
		collectionLogger.error('❌ Error al obtener colecciones:', error);
		throw createCollectionError('No se pudieron obtener las colecciones', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function getCollection(id: string): Promise<CollectionExtended> {
	try {
		collectionLogger.info('🔍 Obteniendo colección:', id);
		const collection = await prisma.collection.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						groups: true,
						properties: true,
						wildcards: true
					},
				},
			},
		});

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

        // Transformar usando los nuevos serializadores
        const collectionComplete = toCollectionComplete(collection);
        const collectionExtended = mapCollectionExtendedFromComplete(collectionComplete, collection._count.images);

		collectionLogger.info('✅ Colección obtenida:', collection.name);
		return {
            ...collectionExtended,
            _count: collection._count
        };
	} catch (error) {
		collectionLogger.error('❌ Error al obtener colección:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudo obtener la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function createCollection(data: CreateCollectionData): Promise<CollectionExtended> {
	try {
		collectionLogger.info('📝 Creando colección:', data.name);

		// Usar el transformer para mapear datos
		const prismaData = mapCreateCollectionDataToPrisma(data);

		// Crear la colección
		const collection = await prisma.collection.create({
			data: prismaData,
            include: {
                _count: {
                    select: {
                        images: true,
                        groups: true,
                        properties: true,
                        wildcards: true
                    },
                },
            },
		});

        // Transformar usando los nuevos serializadores
        const collectionComplete = toCollectionComplete(collection);
        const collectionExtended = mapCollectionExtendedFromComplete(collectionComplete, 0);

		// Notificar cambio
		await notifyCollectionChange('create', collection);
		await revalidateAllPaths();

		collectionLogger.info('✅ Colección creada:', collection.name);
		return {
            ...collectionExtended,
            _count: collection._count
        };
	} catch (error) {
		collectionLogger.error('❌ Error al crear colección:', error);
		throw createCollectionError('No se pudo crear la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateCollection(id: string, data: UpdateCollectionData): Promise<CollectionExtended> {
	try {
		collectionLogger.info('📝 Actualizando colección:', { id, ...data });

		// Verificar si la colección existe
		const existingCollection = await prisma.collection.findUnique({
			where: { id },
		});

		if (!existingCollection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		// Usar el transformer para mapear datos
		const prismaData = mapUpdateCollectionDataToPrisma(data);

		// Actualizar la colección
		const collection = await prisma.collection.update({
			where: { id },
			data: prismaData,
            include: {
                _count: {
                    select: {
                        images: true,
                        groups: true,
                        properties: true,
                        wildcards: true
                    },
                },
            },
		});

        // Transformar usando los nuevos serializadores
        const collectionComplete = toCollectionComplete(collection);
        const collectionExtended = mapCollectionExtendedFromComplete(collectionComplete, collection._count.images);

		// Notificar cambio
		await notifyCollectionChange('update', collection);
		await revalidateAllPaths();

		collectionLogger.info('✅ Colección actualizada:', collection.name);
		return {
            ...collectionExtended,
            _count: collection._count
        };
	} catch (error) {
		collectionLogger.error('❌ Error al actualizar colección:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudo actualizar la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteCollection(id: string): Promise<void> {
	try {
		collectionLogger.info('🗑️ Eliminando colección:', id);

		// Verificar si la colección existe
		const collection = await prisma.collection.findUnique({ where: { id } });
		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		// Eliminar la colección
		await prisma.collection.delete({ where: { id } });

		// Notificar cambio
		await notifyCollectionChange('delete', { id });
		await revalidateAllPaths();

		collectionLogger.info('✅ Colección eliminada:', id);
	} catch (error) {
		collectionLogger.error('❌ Error al eliminar colección:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudo eliminar la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function getCollectionImages(id: string): Promise<FileItem[]> {
	try {
		collectionLogger.info('🖼️ Obteniendo imágenes de la colección:', id);

		// Verificar si la colección existe y obtener imágenes
		const collection = await prisma.collection.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						tags: {
							select: { id: true, name: true, color: true, emoji: true },
						},
						collections: {
							select: { id: true, name: true, color: true, emoji: true },
						},
						folder: {
							select: { id: true, name: true, path: true },
						},
					},
					orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
				},
			},
		});

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		// Convertir imágenes al formato FileItem
		const fileItems = await Promise.all(
			collection.images.map(async (image) => {
				return convertServerImageToFileItem(image as unknown as ServerImage);
			})
		);

		collectionLogger.info('✅ Imágenes obtenidas:', fileItems.length);
		return fileItems;
	} catch (error) {
		collectionLogger.error('❌ Error al obtener imágenes de la colección:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudieron obtener las imágenes de la colección',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function addImageToCollection(collectionId: string, imageId: string): Promise<void> {
	try {
		collectionLogger.info('➕ Añadiendo imagen a la colección:', { collectionId, imageId });

		// Verificar si la colección y la imagen existen
		const [collection, image] = await Promise.all([
			prisma.collection.findUnique({ where: { id: collectionId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createCollectionError('Imagen no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		// Conectar la imagen a la colección
		await prisma.collection.update({
			where: { id: collectionId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		// Notificar cambio
		await notifyCollectionChange('update', collection);
		await revalidateAllPaths();

		collectionLogger.info('✅ Imagen añadida a la colección');
	} catch (error) {
		collectionLogger.error('❌ Error al añadir imagen a la colección:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudo añadir la imagen a la colección',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
	try {
		collectionLogger.info('➖ Eliminando imagen de la colección:', { collectionId, imageId });

		// Verificar si la colección y la imagen existen
		const [collection, image] = await Promise.all([
			prisma.collection.findUnique({ where: { id: collectionId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createCollectionError('Imagen no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		// Desconectar la imagen de la colección
		await prisma.collection.update({
			where: { id: collectionId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		// Notificar cambio
		await notifyCollectionChange('update', collection);
		await revalidateAllPaths();

		collectionLogger.info('✅ Imagen eliminada de la colección');
	} catch (error) {
		collectionLogger.error('❌ Error al eliminar imagen de la colección:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudo eliminar la imagen de la colección',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function addCollectionToImage(collectionId: string, imageId: string): Promise<void> {
	try {
		collectionLogger.info('➕ Añadiendo colección a la imagen:', { collectionId, imageId });

		// Verificar si la colección y la imagen existen
		const [collection, image] = await Promise.all([
			prisma.collection.findUnique({ where: { id: collectionId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createCollectionError('Imagen no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		// Conectar la colección a la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: {
				collections: {
					connect: { id: collectionId },
				},
			},
		});

		// Notificar cambio
		await notifyCollectionChange('update', collection);
		await revalidateAllPaths();

		collectionLogger.info('✅ Colección añadida a la imagen');
	} catch (error) {
		collectionLogger.error('❌ Error al añadir colección a la imagen:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudo añadir la colección a la imagen',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function removeCollectionFromImage(collectionId: string, imageId: string): Promise<void> {
	try {
		collectionLogger.info('➖ Eliminando colección de la imagen:', { collectionId, imageId });

		// Verificar si la colección y la imagen existen
		const [collection, image] = await Promise.all([
			prisma.collection.findUnique({ where: { id: collectionId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createCollectionError('Imagen no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		// Desconectar la colección de la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: {
				collections: {
					disconnect: { id: collectionId },
				},
			},
		});

		// Notificar cambio
		await notifyCollectionChange('update', collection);
		await revalidateAllPaths();

		collectionLogger.info('✅ Colección eliminada de la imagen');
	} catch (error) {
		collectionLogger.error('❌ Error al eliminar colección de la imagen:', error);
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudo eliminar la colección de la imagen',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}
