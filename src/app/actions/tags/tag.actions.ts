'use server';

import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Image, Tag as PrismaTag } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Utilidades y logging
const tagLogger = logger.withContext('TagActions');

const REVALIDATE_PATHS = ['/settings', '/tags', '/tags/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	tagLogger.info('🔄 Rutas revalidadas');
};

// Manejo de errores - enfoque funcional
enum TagErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

const createTagError = (message: string, code: TagErrorCode = TagErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'TagError';
	Object.assign(error, { code, cause });
	return error;
};

// Tipos e interfaces
export interface TagCreate {
	name: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
}

export interface TagUpdate {
	id: string;
	name?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	emoji?: string;
}

export interface Tag extends PrismaTag {
	count?: number;
}

export interface TagWithStats extends Omit<PrismaTag, 'emoji' | 'isFavorite'> {
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	emoji?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
}

export interface TagWithImages extends Tag {
	images: FileItem[];
}

// Interfaces auxiliares para tipado
interface FolderDistribution {
	name: string;
	_count: {
		images: number;
	};
}

// Funciones auxiliares
function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// Funciones exportadas
export async function getTags(): Promise<TagWithStats[]> {
	try {
		tagLogger.info('🏷️ Obteniendo etiquetas con estadísticas');

		// Obtener etiquetas con conteos y estadísticas
		const tags = await prisma.tag.findMany({
			include: {
				_count: {
					select: { images: true },
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
		const tagsWithStats = await Promise.all(
			tags.map(async (tag) => {
				// Calcular tamaño total
				const totalSize = await prisma.image.aggregate({
					where: {
						tags: {
							some: {
								id: tag.id,
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
								tags: {
									some: {
										id: tag.id,
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
					...tag,
					_count: tag._count,
					totalSize: totalSize._sum.size || 0,
					lastUpdated: tag.images[0]?.updatedAt || tag.updatedAt,
					distribution: distribution.map((d: FolderDistribution) => ({
						name: d.name,
						count: d._count.images,
					})),
				};
			})
		);

		tagLogger.info('✅ Etiquetas obtenidas', { count: tags.length });
		return tagsWithStats;
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiquetas', error);
		throw createTagError('No se pudieron obtener las etiquetas', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function getTag(id: string): Promise<Tag> {
	try {
		tagLogger.info('🔍 Obteniendo etiqueta:', id);
		const tag = await prisma.tag.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					select: { size: true },
				},
			},
		});

		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		const totalSize = tag.images.reduce((acc, img) => acc + img.size, 0);
		const result = {
			...tag,
			count: tag._count.images,
			size: formatBytes(totalSize),
			images: undefined,
		};

		tagLogger.info('✅ Etiqueta obtenida:', tag.name);
		return result;
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiqueta:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo obtener la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function createTag(data: TagCreate): Promise<Tag> {
	try {
		tagLogger.info('📝 Creando nueva etiqueta:', data.name);
		const tag = await prisma.tag.create({
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: 'tags:modified',
			data: { action: 'create', tag },
		});
		statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);

		tagLogger.info('✅ Etiqueta creada:', tag.name);
		await revalidateAllPaths();
		return tag;
	} catch (error) {
		tagLogger.error('❌ Error al crear etiqueta:', error);
		throw createTagError('No se pudo crear la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateTag(id: string, data: TagUpdate): Promise<Tag> {
	try {
		tagLogger.info('📝 Actualizando etiqueta:', id);
		const tag = await prisma.tag.update({
			where: { id },
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: 'tags:modified',
			data: { action: 'update', tag },
		});
		statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);

		tagLogger.info('✅ Etiqueta actualizada:', tag.name);
		await revalidateAllPaths();
		return tag;
	} catch (error) {
		tagLogger.error('❌ Error al actualizar etiqueta:', error);
		throw createTagError('No se pudo actualizar la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteTag(id: string): Promise<Tag> {
	try {
		tagLogger.info('🗑️ Eliminando etiqueta:', id);
		const tag = await prisma.tag.delete({
			where: { id },
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: 'tags:modified',
			data: { action: 'delete', tag },
		});
		statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);

		tagLogger.info('✅ Etiqueta eliminada:', tag.name);
		await revalidateAllPaths();
		return tag;
	} catch (error) {
		tagLogger.error('❌ Error al eliminar etiqueta:', error);
		throw createTagError('No se pudo eliminar la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function getTagImages(id: string): Promise<FileItem[]> {
	try {
		tagLogger.info('🖼️ Obteniendo imágenes de la etiqueta:', id);

		// Usamos una consulta directa para obtener las imágenes
		const images = (await prisma.$queryRaw`
			SELECT i.*
			FROM Image i
			JOIN _ImageToTag it ON it.A = i.id
			WHERE it.B = ${id}
		`) as ServerImage[];

		// También podríamos usar el ORM nativo pero con un include más selectivo:
		// const images = await prisma.image.findMany({
		//   where: {
		//     tags: {
		//       some: {
		//         id,
		//       },
		//     },
		//   },
		// });

		tagLogger.info(`✅ ${images.length} imágenes obtenidas`);

		// Convertir a FileItems
		const fileItems = images.map((image) => convertServerImageToFileItem(image));

		return fileItems;
	} catch (error) {
		tagLogger.error('❌ Error al obtener imágenes de la etiqueta:', error);
		throw createTagError('No se pudieron obtener las imágenes de la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function addImageToTag(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➕ Agregando imagen a etiqueta:', { tagId, imageId });
		await prisma.tag.update({
			where: { id: tagId },
			data: {
				images: {
					connect: {
						id: imageId,
					},
				},
			},
		});
		tagLogger.info('✅ Imagen agregada a la etiqueta');
		await revalidateAllPaths();
	} catch (error) {
		tagLogger.error('❌ Error al agregar imagen a la etiqueta:', error);
		throw createTagError('No se pudo agregar la imagen a la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeImageFromTag(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➖ Removiendo imagen de etiqueta:', { tagId, imageId });
		await prisma.tag.update({
			where: { id: tagId },
			data: {
				images: {
					disconnect: {
						id: imageId,
					},
				},
			},
		});
		tagLogger.info('✅ Imagen removida de la etiqueta');
		await revalidateAllPaths();
	} catch (error) {
		tagLogger.error('❌ Error al eliminar imagen de la etiqueta:', error);
		throw createTagError('No se pudo eliminar la imagen de la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function addTagToImage(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➕ Agregando etiqueta a imagen:', { tagId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				tags: {
					connect: { id: tagId },
				},
			},
		});

		// Emitir eventos
		statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		tagLogger.info('✅ Etiqueta agregada a la imagen');
		await revalidateAllPaths();
	} catch (error) {
		tagLogger.error('❌ Error al agregar etiqueta a la imagen:', error);
		throw createTagError('No se pudo agregar la etiqueta a la imagen', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeTagFromImage(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➖ Eliminando etiqueta de imagen:', { tagId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				tags: {
					disconnect: { id: tagId },
				},
			},
		});

		// Emitir eventos
		statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		tagLogger.info('✅ Etiqueta eliminada de la imagen');
		await revalidateAllPaths();
	} catch (error) {
		tagLogger.error('❌ Error al eliminar etiqueta de la imagen:', error);
		throw createTagError('No se pudo eliminar la etiqueta de la imagen', TagErrorCode.OPERATION_FAILED, error);
	}
}
