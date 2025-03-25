'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';
// Importaciones actualizadas usando nuevos tipos y transformers
import {
    mapCreateTagDataToPrisma,
    mapUpdateTagDataToPrisma
} from '@/transformers/tag';
import {
    CreateTagData,
    Tag,
    TagBase,
    UpdateTagData
} from '@/types/entities/tag';

// Utilidades y logging
const tagLogger = serverLogger.withContext('TagActions');

const REVALIDATE_PATHS = ['/settings', '/tags', '/tags/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	tagLogger.info('🔄 Rutas revalidadas');
};

// Notificar cambios en etiquetas
const notifyTagChange = async (action: 'create' | 'update' | 'delete', tag: Tag | { id: string }) => {
	// Emitir eventos usando el sistema del servidor
	await emit({
		type: 'tags:modified',
		data: { action, tag },
	});
	statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE);
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

// Interfaces para compatibilidad
export interface TagWithStats {
    id: string;
    name: string;
    color: string;
    emoji: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    shortcut: string | null;
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	isFavorite?: boolean;
	isArchived?: boolean;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
}

export interface TagWithImages extends TagBase {
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

// Acciones del servidor
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
			tags.map(async (tag: any) => {
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
					lastUpdated: tag.images?.[0]?.updatedAt || tag.updatedAt,
					distribution: distribution.map((d: FolderDistribution) => ({
						name: d.name,
						count: d._count.images,
					})),
				};
			})
		);

		tagLogger.info('✅ Etiquetas obtenidas:', tagsWithStats.length);
		return tagsWithStats;
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiquetas:', error);
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
			},
		});

		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		tagLogger.info('✅ Etiqueta obtenida:', tag.name);
		return tag as Tag;
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiqueta:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo obtener la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function createTag(data: CreateTagData): Promise<Tag> {
	try {
		tagLogger.info('📝 Creando etiqueta:', data.name);

		// Usar el transformer para mapear datos
		const prismaData = mapCreateTagDataToPrisma(data);

		// Crear la etiqueta
		const tag = await prisma.tag.create({
			data: prismaData,
		});

		// Notificar cambio
		await notifyTagChange('create', tag);
		await revalidateAllPaths();

		tagLogger.info('✅ Etiqueta creada:', tag.name);
		return tag as Tag;
	} catch (error) {
		tagLogger.error('❌ Error al crear etiqueta:', error);
		throw createTagError('No se pudo crear la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateTag(id: string, data: UpdateTagData): Promise<Tag> {
	try {
		tagLogger.info('📝 Actualizando etiqueta:', { id, ...data });

		// Verificar si la etiqueta existe
		const existingTag = await prisma.tag.findUnique({
			where: { id },
		});

		if (!existingTag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		// Usar el transformer para mapear datos
		const prismaData = mapUpdateTagDataToPrisma(data);

		// Actualizar la etiqueta
		const tag = await prisma.tag.update({
			where: { id },
			data: prismaData,
		});

		// Notificar cambio
		await notifyTagChange('update', tag);
		await revalidateAllPaths();

		tagLogger.info('✅ Etiqueta actualizada:', tag.name);
		return tag as Tag;
	} catch (error) {
		tagLogger.error('❌ Error al actualizar etiqueta:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo actualizar la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteTag(id: string): Promise<void> {
	try {
		tagLogger.info('🗑️ Eliminando etiqueta:', id);

		// Verificar si la etiqueta existe
		const tag = await prisma.tag.findUnique({ where: { id } });
		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		// Eliminar la etiqueta
		await prisma.tag.delete({ where: { id } });

		// Notificar cambio
		await notifyTagChange('delete', { id });
		await revalidateAllPaths();

		tagLogger.info('✅ Etiqueta eliminada:', id);
	} catch (error) {
		tagLogger.error('❌ Error al eliminar etiqueta:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo eliminar la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function getTagImages(id: string): Promise<FileItem[]> {
	try {
		tagLogger.info('🖼️ Obteniendo imágenes de la etiqueta:', id);

		// Verificar si la etiqueta existe y obtener imágenes
		const tag = await prisma.tag.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						tags: {
							select: { id: true, name: true, color: true, emoji: true },
						},
						collections: {
							select: { id: true, name: true },
						},
						folder: {
							select: { id: true, name: true, path: true },
						},
					},
					orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
				},
			},
		});

		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		// Convertir imágenes al formato FileItem
		const fileItems = await Promise.all(
			tag.images.map(async (image) => {
				return convertServerImageToFileItem(image as unknown as ServerImage);
			})
		);

		tagLogger.info('✅ Imágenes obtenidas:', fileItems.length);
		return fileItems;
	} catch (error) {
		tagLogger.error('❌ Error al obtener imágenes de la etiqueta:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudieron obtener las imágenes de la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function addImageToTag(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➕ Añadiendo imagen a la etiqueta:', { tagId, imageId });

		// Verificar si la etiqueta y la imagen existen
		const [tag, image] = await Promise.all([
			prisma.tag.findUnique({ where: { id: tagId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createTagError('Imagen no encontrada', TagErrorCode.NOT_FOUND);
		}

		// Conectar la imagen a la etiqueta
		await prisma.tag.update({
			where: { id: tagId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		// Notificar cambio
		await notifyTagChange('update', tag);
		await revalidateAllPaths();

		tagLogger.info('✅ Imagen añadida a la etiqueta');
	} catch (error) {
		tagLogger.error('❌ Error al añadir imagen a la etiqueta:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo añadir la imagen a la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeImageFromTag(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➖ Eliminando imagen de la etiqueta:', { tagId, imageId });

		// Verificar si la etiqueta y la imagen existen
		const [tag, image] = await Promise.all([
			prisma.tag.findUnique({ where: { id: tagId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createTagError('Imagen no encontrada', TagErrorCode.NOT_FOUND);
		}

		// Desconectar la imagen de la etiqueta
		await prisma.tag.update({
			where: { id: tagId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		// Notificar cambio
		await notifyTagChange('update', tag);
		await revalidateAllPaths();

		tagLogger.info('✅ Imagen eliminada de la etiqueta');
	} catch (error) {
		tagLogger.error('❌ Error al eliminar imagen de la etiqueta:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo eliminar la imagen de la etiqueta', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function addTagToImage(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➕ Añadiendo etiqueta a la imagen:', { tagId, imageId });

		// Verificar si la etiqueta y la imagen existen
		const [tag, image] = await Promise.all([
			prisma.tag.findUnique({ where: { id: tagId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createTagError('Imagen no encontrada', TagErrorCode.NOT_FOUND);
		}

		// Conectar la etiqueta a la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: {
				tags: {
					connect: { id: tagId },
				},
			},
		});

		// Notificar cambio
		await notifyTagChange('update', tag);
		await revalidateAllPaths();

		tagLogger.info('✅ Etiqueta añadida a la imagen');
	} catch (error) {
		tagLogger.error('❌ Error al añadir etiqueta a la imagen:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo añadir la etiqueta a la imagen', TagErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeTagFromImage(tagId: string, imageId: string): Promise<void> {
	try {
		tagLogger.info('➖ Eliminando etiqueta de la imagen:', { tagId, imageId });

		// Verificar si la etiqueta y la imagen existen
		const [tag, image] = await Promise.all([
			prisma.tag.findUnique({ where: { id: tagId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!tag) {
			throw createTagError('Etiqueta no encontrada', TagErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createTagError('Imagen no encontrada', TagErrorCode.NOT_FOUND);
		}

		// Desconectar la etiqueta de la imagen
		await prisma.image.update({
			where: { id: imageId },
			data: {
				tags: {
					disconnect: { id: tagId },
				},
			},
		});

		// Notificar cambio
		await notifyTagChange('update', tag);
		await revalidateAllPaths();

		tagLogger.info('✅ Etiqueta eliminada de la imagen');
	} catch (error) {
		tagLogger.error('❌ Error al eliminar etiqueta de la imagen:', error);
		if (error instanceof Error && error.name === 'TagError') {
			throw error;
		}
		throw createTagError('No se pudo eliminar la etiqueta de la imagen', TagErrorCode.OPERATION_FAILED, error);
	}
}
