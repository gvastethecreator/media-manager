'use server';

/**
 * @file Acciones para consultas de Tag
 * @module app/actions/tags/query.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { convertServerImageToFileItem, type ServerImage } from '@/services/image-converter.service';
import type { Tag } from '@/types/entities/tag';
import type { TagBase } from '@/types/entities/tag/types';
import type { FileItem } from '@/types/file-item';

const tagLogger = serverLogger.withContext('TagQueryActions');

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
		groups: number;
		properties: number;
		wildcards: number;
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

// Funciones auxiliares
function _formatBytes(bytes: number): string {
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Obtiene todos los tags con estadísticas
 */
export async function getTags(): Promise<TagWithStats[]> {
	try {
		tagLogger.info('🏷️ Obteniendo etiquetas con estadísticas');

		// Obtener etiquetas con conteos y estadísticas
		const tags = await prisma.tag.findMany({
			include: {
				_count: {
					select: {
						images: true,
						groups: true,
						properties: true,
						wildcards: true,
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

		tagLogger.info('✅ Etiquetas obtenidas:', { count: tagsWithStats.length });
		return tagsWithStats;
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiquetas:', error);
		throw createTagError('No se pudieron obtener las etiquetas', TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un tag por su ID
 */
export async function getTag(id: string): Promise<Tag> {
	try {
		tagLogger.info('🔍 Obteniendo etiqueta por ID:', id);

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
			tagLogger.warn('⚠️ Etiqueta no encontrada:', id);
			throw createTagError(`Etiqueta no encontrada: ${id}`, TagErrorCode.NOT_FOUND);
		}

		tagLogger.info('✅ Etiqueta obtenida:', { tagId: tag.id, name: tag.name });

		return tag;
	} catch (error) {
		tagLogger.error('❌ Error al obtener etiqueta:', { id, error });

		// Manejar error específico de etiqueta no encontrada
		if ((error as any).code === TagErrorCode.NOT_FOUND) {
			throw error;
		}

		throw createTagError(`No se pudo obtener la etiqueta: ${id}`, TagErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes asociadas a un tag
 */
export async function getTagImages(id: string): Promise<FileItem[]> {
	try {
		tagLogger.info('🖼️ Obteniendo imágenes para tag:', id);

		// Verificar que la etiqueta existe
		const tag = await prisma.tag.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!tag) {
			tagLogger.warn('⚠️ Etiqueta no encontrada para obtener imágenes:', id);
			throw createTagError(`Etiqueta no encontrada: ${id}`, TagErrorCode.NOT_FOUND);
		}

		// Obtener imágenes relacionadas
		const images = await prisma.image.findMany({
			where: {
				tags: {
					some: {
						id,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				folder: true,
			},
		});

		// Convertir a FileItem para la UI
		const fileItems = images.map((image) => convertServerImageToFileItem(image as unknown as ServerImage));

		tagLogger.info('✅ Imágenes obtenidas para tag:', {
			tagId: id,
			count: fileItems.length,
		});

		return fileItems;
	} catch (error) {
		tagLogger.error('❌ Error al obtener imágenes para tag:', { id, error });

		// Manejar error específico de etiqueta no encontrada
		if ((error as any).code === TagErrorCode.NOT_FOUND) {
			throw error;
		}

		throw createTagError(
			`No se pudieron obtener las imágenes para la etiqueta: ${id}`,
			TagErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Busca tags por texto o categoría
 */
export async function searchTags(query?: string, category?: string, limit = 10): Promise<Tag[]> {
	try {
		tagLogger.info('🔍 Buscando etiquetas:', { query, category, limit });

		const where: any = {};

		// Filtrar por texto si se proporciona
		if (query) {
			where.OR = [
				{ name: { contains: query, mode: 'insensitive' } },
				{ description: { contains: query, mode: 'insensitive' } },
			];
		}

		// Filtrar por categoría si se proporciona
		if (category) {
			where.category = category;
		}

		const tags = await prisma.tag.findMany({
			where,
			take: limit,
			orderBy: {
				name: 'asc',
			},
			include: {
				_count: {
					select: {
						images: true,
					},
				},
			},
		});

		tagLogger.info('✅ Etiquetas encontradas:', { count: tags.length });

		return tags;
	} catch (error) {
		tagLogger.error('❌ Error al buscar etiquetas:', { query, category, error });
		throw createTagError('No se pudieron buscar etiquetas', TagErrorCode.OPERATION_FAILED, error);
	}
}
