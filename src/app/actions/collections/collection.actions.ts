'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const collectionLogger = serverLogger.withContext('CollectionActions');
const REVALIDATE_PATHS = ['/settings', '/collections', '/collections/[id]'] as const;

// Códigos de error
enum CollectionErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
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

// Interfaces
export interface Collection {
	id: string;
	name: string;
	color: string;
	emoji: string | null;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	shortcut: string | null;
	sortBy: string;
	filters: string;
	url: string | null;
	alternativeUrl: string | null;
	sourceImage: string | null;
	platform: string | null;
	price: number | null;
	editions: string;
	featuredImage: string | null;
	isFavorite: boolean;
}

export interface CollectionStats {
	count: number;
	size: number;
	lastUpdated?: Date;
}

export interface CollectionWithStats {
	id: string;
	name: string;
	color: string;
	emoji: string | null;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	shortcut: string | null;
	sortBy: string;
	filters: string;
	url: string | null;
	alternativeUrl: string | null;
	sourceImage: string | null;
	platform: string | null;
	price: number | null;
	editions: string;
	featuredImage: string | null;
	isFavorite: boolean;
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
	recentImages: string[];
}

export interface CollectionWithImages {
	id: string;
	name: string;
	color: string;
	emoji: string | null;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	shortcut: string | null;
	sortBy: string;
	filters: string;
	url: string | null;
	alternativeUrl: string | null;
	sourceImage: string | null;
	platform: string | null;
	price: number | null;
	editions: string;
	featuredImage: string | null;
	isFavorite: boolean;
	images: FileItem[];
}

export interface CollectionCreate {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	sortBy: string;
	filters: string;
	url?: string | null;
	alternativeUrl?: string | null;
	sourceImage?: string | null;
	platform?: string | null;
	price?: number | null;
	editions: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

export interface CollectionUpdate extends Partial<CollectionCreate> {
	id: string;
}

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	collectionLogger.info('🔄 Rutas revalidadas');
};

const notifyCollectionChange = async (
	action: 'create' | 'update' | 'delete' | 'addImage' | 'removeImage',
	collectionId: string,
	collection?: Collection,
	imageId?: string
) => {
	// Emitir eventos usando el nuevo sistema del servidor
	if (action === 'create' || action === 'update' || action === 'delete') {
		await emit({
			type: 'collections:modified',
			data: { action, collectionId, collection },
		});
	} else if (action === 'addImage' || action === 'removeImage') {
		await emit({
			type: 'collections:modified',
			data: { action, collectionId, imageId },
		});
	}

	// Emitir evento de estadísticas
	statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);
};

// Funciones del servidor
export async function getCollections(): Promise<CollectionWithStats[]> {
	try {
		collectionLogger.info('📚 Obteniendo colecciones con estadísticas');

		// Obtener colecciones con conteos y estadísticas
		const collections = await prisma.collection.findMany({
			include: {
				_count: {
					select: { images: true },
				},
				images: {
					take: 5,
					orderBy: {
						createdAt: 'desc',
					},
					select: {
						id: true,
						thumbnail: true,
						thumbnailSize: true,
						isFavorite: true,
						folder: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			orderBy: [
				{
					isFavorite: 'desc',
				},
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

				// Obtener estadísticas de imágenes por carpeta
				const folderDistribution = collection.images?.reduce(
					(acc: any, img: any) => {
						const folderName = img.folder?.name || 'Sin carpeta';
						acc[folderName] = (acc[folderName] || 0) + 1;
						return acc;
					},
					{}
				);

				// Convertir el objeto de distribución a un array para la API
				const distribution = Object.entries(folderDistribution || {})
					.map(([name, count]) => ({
						name,
						count,
					}))
					.sort((a, b) => (b.count as number) - (a.count as number));

				const featuredImage = collection.images?.find((img: any) => img.isFavorite)?.thumbnail;
				const recentImages = collection.images
					?.filter((img: any) => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
					.map((img: any) => {
						if (img.thumbnail) {
							return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
						}
						return null;
					})
					.filter(Boolean);

				return {
					...collection,
					_count: collection._count,
					totalSize: totalSize._sum.size || 0,
					distribution,
					featuredImage,
					recentImages: recentImages || [],
					images: undefined, // No devolver las imágenes completas
				};
			})
		);

		collectionLogger.info('✅ Colecciones obtenidas', { count: collections.length });
		return collectionsWithStats;
	} catch (error) {
		collectionLogger.error('❌ Error al obtener colecciones', error);
		throw createCollectionError('No se pudieron obtener las colecciones', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function getCollection(id: string): Promise<CollectionWithStats> {
	try {
		collectionLogger.info('🔍 Obteniendo colección:', id);
		const collection = await prisma.collection.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					take: 9,
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailSize: true,
						isFavorite: true,
						createdAt: true,
						folder: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

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

		const lastImage = collection.images?.[0];
		const lastUpdated = lastImage?.createdAt || collection.updatedAt;

		const folderDistribution = collection.images?.reduce(
			(acc: any, img: any) => {
				const folderName = img.folder?.name || 'Sin carpeta';
				acc[folderName] = (acc[folderName] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const distribution = Object.entries(folderDistribution || {})
			.map(([name, count]) => ({
				name,
				count,
			}))
			.sort((a, b) => (b.count as number) - (a.count as number));

		const featuredImage = collection.images?.find((img: any) => img.isFavorite)?.thumbnail;
		const recentImages = collection.images
			?.filter((img: any) => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
			.map((img: any) => {
				if (img.thumbnail) {
					return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
				}
				return '';
			})
			.filter(Boolean);

		const result: CollectionWithStats = {
			...collection,
			_count: {
				images: collection._count?.images || 0,
			},
			totalSize: totalSize._sum.size || 0,
			lastUpdated,
			distribution,
			featuredImage: featuredImage
				? `data:image/jpeg;base64,${Buffer.from(featuredImage).toString('base64')}`
				: null,
			recentImages: recentImages || [],
		};

		collectionLogger.info('✅ Colección obtenida:', collection.name);
		return result;
	} catch (error) {
		collectionLogger.error('❌ Error al obtener colección:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudo obtener la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function createCollection(data: CollectionCreate): Promise<Collection> {
	try {
		collectionLogger.info('📝 Creando colección:', data);

		// Validación de entrada
		if (!data.name?.trim()) {
			throw createCollectionError('El nombre de la colección es requerido', CollectionErrorCode.VALIDATION_ERROR);
		}

		const collection = await prisma.collection.create({
			data: {
				...data,
			},
		});

		await notifyCollectionChange('create', collection.id, collection);

		collectionLogger.info('✅ Colección creada:', collection.name);
		await revalidateAllPaths();
		return collection;
	} catch (error) {
		collectionLogger.error('❌ Error al crear colección:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudo crear la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateCollection(id: string, data: CollectionUpdate): Promise<Collection> {
	try {
		collectionLogger.info('📝 Actualizando colección:', { id, data });

		// Validación de entrada
		if (data.name === '') {
			throw createCollectionError(
				'El nombre de la colección no puede estar vacío',
				CollectionErrorCode.VALIDATION_ERROR
			);
		}

		const collection = await prisma.collection.update({
			where: { id },
			data,
		});

		await notifyCollectionChange('update', collection.id, collection);

		collectionLogger.info('✅ Colección actualizada:', collection.name);
		await revalidateAllPaths();
		return collection;
	} catch (error) {
		collectionLogger.error('❌ Error al actualizar colección:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudo actualizar la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteCollection(id: string): Promise<void> {
	try {
		collectionLogger.info('🗑️ Eliminando colección:', id);
		const collection = await prisma.collection.delete({
			where: { id },
		});

		await notifyCollectionChange('delete', id, collection);

		collectionLogger.info('✅ Colección eliminada');
		await revalidateAllPaths();
	} catch (error) {
		collectionLogger.error('❌ Error al eliminar colección:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudo eliminar la colección', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function getCollectionImages(id: string): Promise<FileItem[]> {
	try {
		collectionLogger.info('🖼️ Obteniendo imágenes de la colección:', id);
		const collection = await prisma.collection.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						tags: true,
						collections: true,
						albums: true,
						stats: true,
					},
				},
			},
		});

		if (!collection) {
			collectionLogger.warn('ℹ️ Colección no encontrada, retornando array vacío:', id);
			return [];
		}

		const images = collection.images.map((img: any) => convertServerImageToFileItem(img as ServerImage));

		collectionLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		collectionLogger.error('❌ Error al obtener imágenes de la colección:', error);
		// Preservar el error si ya es un CollectionError
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
		collectionLogger.info('➕ Agregando imagen a colección:', { collectionId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				collections: {
					connect: { id: collectionId },
				},
			},
		});

		await notifyCollectionChange('addImage', collectionId, undefined, imageId);

		collectionLogger.info('✅ Imagen agregada a colección');
		await revalidateAllPaths();
	} catch (error) {
		collectionLogger.error('❌ Error al agregar imagen a colección:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudo agregar la imagen a la colección',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
	try {
		collectionLogger.info('➖ Removiendo imagen de colección:', { collectionId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				collections: {
					disconnect: { id: collectionId },
				},
			},
		});

		await notifyCollectionChange('removeImage', collectionId, undefined, imageId);

		collectionLogger.info('✅ Imagen removida de colección');
		await revalidateAllPaths();
	} catch (error) {
		collectionLogger.error('❌ Error al remover imagen de colección:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudo remover la imagen de la colección',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function getCollectionStats(id: string): Promise<CollectionStats> {
	try {
		collectionLogger.info('📊 Obteniendo estadísticas de colección:', id);
		const collection = await prisma.collection.findUnique({
			where: { id },
			include: {
				_count: {
					select: { images: true },
				},
				images: {
					select: { size: true },
				},
			},
		});

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		const totalSize = collection.images.reduce((acc: any, img: any) => acc + img.size, 0);
		const stats = {
			count: collection._count.images,
			size: totalSize,
			lastUpdated: new Date(),
		};

		collectionLogger.info('✅ Estadísticas obtenidas:', stats);
		return stats;
	} catch (error) {
		collectionLogger.error('❌ Error al obtener estadísticas:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError('No se pudieron obtener las estadísticas', CollectionErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateCollectionStats(id: string, stats: Partial<CollectionStats>): Promise<CollectionStats> {
	try {
		collectionLogger.info('📝 Actualizando estadísticas de colección:', { id, stats });
		const collection = await prisma.collection.findUnique({
			where: { id },
			include: {
				_count: {
					select: { images: true },
				},
				images: {
					select: { size: true },
				},
			},
		});

		if (!collection) {
			throw createCollectionError('Colección no encontrada', CollectionErrorCode.NOT_FOUND);
		}

		const totalSize = collection.images.reduce((acc: any, img: any) => acc + img.size, 0);
		const updatedStats = {
			count: collection._count.images,
			size: totalSize,
			lastUpdated: new Date(),
			...stats,
		};

		collectionLogger.info('✅ Estadísticas actualizadas:', updatedStats);
		return updatedStats;
	} catch (error) {
		collectionLogger.error('❌ Error al actualizar estadísticas:', error);
		// Preservar el error si ya es un CollectionError
		if (error instanceof Error && error.name === 'CollectionError') {
			throw error;
		}
		throw createCollectionError(
			'No se pudieron actualizar las estadísticas',
			CollectionErrorCode.OPERATION_FAILED,
			error
		);
	}
}
