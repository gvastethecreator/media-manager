'use server';

import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Album as PrismaAlbum } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const albumLogger = logger.withContext('AlbumActions');
const REVALIDATE_PATHS = ['/settings', '/albums', '/albums/[id]'] as const;

// Códigos de error
enum AlbumErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
const createAlbumError = (message: string, code: AlbumErrorCode = AlbumErrorCode.OPERATION_FAILED, cause?: unknown) => {
	const error = new Error(message);
	error.name = 'AlbumError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces
export interface AlbumCreate {
	name: string;
	emoji?: string;
	description?: string | null;
	color?: string;
	shortcut?: string | null;
	sortBy?: string;
	filters?: string;
}

export interface AlbumUpdate extends Partial<AlbumCreate> {
	id: string;
}

export interface Album extends PrismaAlbum {
	count?: number;
}

export interface AlbumWithStats extends PrismaAlbum {
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
}

export interface AlbumWithImages extends Album {
	images: FileItem[];
}

// Utilitarias funcionales
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	albumLogger.info('🔄 Rutas revalidadas');
};

const notifyAlbumChange = async (action: 'create' | 'update' | 'delete', album: Album | { id: string }) => {
	// Emitir eventos usando el nuevo sistema del servidor
	await emit({
		type: 'albums:modified',
		data: { action, album },
	});
	statsEventEmitter.emit(STATS_EVENTS.ALBUM_CHANGE);
};

// Acciones del servidor
export async function getAlbums(): Promise<AlbumWithStats[]> {
	try {
		albumLogger.info('🎞️ Obteniendo álbumes con estadísticas');

		// Obtener álbumes con conteos y estadísticas
		const albums = await prisma.album.findMany({
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
		const albumsWithStats = await Promise.all(
			albums.map(async (album) => {
				// Calcular tamaño total
				const totalSize = await prisma.image.aggregate({
					where: {
						albums: {
							some: {
								id: album.id,
							},
						},
					},
					_sum: {
						size: true,
					},
				});

				// Obtener distribución por carpetas
				const distribution = await prisma.folder.findMany({
					where: {
						images: {
							some: {
								albums: {
									some: {
										id: album.id,
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
				});

				return {
					...album,
					_count: album._count,
					totalSize: totalSize._sum.size || 0,
					lastUpdated: album.images[0]?.updatedAt || album.updatedAt,
					distribution: distribution.map((d) => ({
						name: d.name,
						count: d._count.images,
					})),
				};
			})
		);

		albumLogger.info('✅ Álbumes obtenidos', { count: albums.length });
		return albumsWithStats;
	} catch (error) {
		albumLogger.error('❌ Error al obtener álbumes', error);
		throw createAlbumError('No se pudieron obtener los álbumes', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function getAlbum(id: string): Promise<Album> {
	try {
		albumLogger.info('🔍 Obteniendo álbum:', id);
		const album = await prisma.album.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
			},
		});

		if (!album) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		albumLogger.info('✅ Álbum obtenido:', album.name);
		return {
			...album,
			count: album._count.images,
		};
	} catch (error) {
		albumLogger.error('❌ Error al obtener álbum:', error);
		// Preservar el error si ya es un AlbumError
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo obtener el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function createAlbum(data: AlbumCreate): Promise<Album> {
	try {
		albumLogger.info('📝 Creando álbum:', data.name);

		// Validación de entrada
		if (!data.name?.trim()) {
			throw createAlbumError('El nombre del álbum es requerido', AlbumErrorCode.VALIDATION_ERROR);
		}

		const album = await prisma.album.create({
			data: {
				name: data.name,
				emoji: data.emoji || '🖼️',
				description: data.description || null,
				color: data.color || '#3b82f6',
				shortcut: data.shortcut || null,
				sortBy: data.sortBy || 'name',
				filters: data.filters || '[]',
			},
		});

		await notifyAlbumChange('create', album);

		albumLogger.info('✅ Álbum creado:', album.name);
		await revalidateAllPaths();
		return album;
	} catch (error) {
		albumLogger.error('❌ Error al crear álbum:', error);
		// Preservar el error si ya es un AlbumError
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo crear el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateAlbum(id: string, data: AlbumUpdate): Promise<Album> {
	try {
		albumLogger.info('📝 Actualizando álbum:', id);

		// Validación de entrada
		if (data.name === '') {
			throw createAlbumError('El nombre del álbum no puede estar vacío', AlbumErrorCode.VALIDATION_ERROR);
		}

		const album = await prisma.album.update({
			where: { id },
			data,
		});

		await notifyAlbumChange('update', album);

		albumLogger.info('✅ Álbum actualizado:', album.name);
		await revalidateAllPaths();
		return album;
	} catch (error) {
		albumLogger.error('❌ Error al actualizar álbum:', error);
		// Preservar el error si ya es un AlbumError
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo actualizar el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteAlbum(id: string): Promise<void> {
	try {
		albumLogger.info('🗑️ Eliminando álbum:', id);
		await prisma.album.delete({
			where: { id },
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await notifyAlbumChange('delete', { id });

		albumLogger.info('✅ Álbum eliminado');
		await revalidateAllPaths();
	} catch (error) {
		albumLogger.error('❌ Error al eliminar álbum:', error);
		throw createAlbumError('No se pudo eliminar el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function getAlbumImages(id: string): Promise<FileItem[]> {
	try {
		albumLogger.info('🔍 Obteniendo imágenes del álbum:', id);

		// Verificar si el álbum existe directamente en la consulta
		const images = await prisma.image.findMany({
			where: {
				albums: {
					some: {
						id,
					},
				},
			},
			include: {
				tags: {
					select: {
						id: true,
						name: true,
						color: true,
					},
				},
				collections: {
					select: {
						id: true,
						name: true,
					},
				},
				albums: {
					select: {
						id: true,
						name: true,
					},
				},
				characters: {
					select: {
						id: true,
						name: true,
					},
				},
				places: {
					select: {
						id: true,
						name: true,
					},
				},
				worldItems: {
					select: {
						id: true,
						name: true,
					},
				},
				stats: true,
			},
		});

		// Si no encontramos imágenes, verificamos si el álbum existe
		if (images.length === 0) {
			const albumExists = await prisma.album.findUnique({
				where: { id },
				select: { id: true },
			});

			if (!albumExists) {
				throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
			}
		}

		albumLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images.map((image) => ({
			...image,
			type: 'image',
			metadata: image.metadata,
			modifiedAt: image.updatedAt,
			accessedAt: image.createdAt,
			tags: image.tags?.map((t) => ({ id: t.id, name: t.name, color: t.color })) || [],
			collections: image.collections?.map((c) => ({ id: c.id, name: c.name })) || [],
			albums: image.albums?.map((a) => ({ id: a.id, name: a.name })) || [],
			characters: image.characters?.map((c) => ({ id: c.id, name: c.name })) || [],
			places: image.places?.map((p) => ({ id: p.id, name: p.name })) || [],
			worldItems: image.worldItems?.map((o) => ({ id: o.id, name: o.name })) || [],
			thumbnail: image.thumbnail ? Buffer.from(image.thumbnail).toString('base64') : null,
		}));
	} catch (error) {
		albumLogger.error('❌ Error al obtener imágenes del álbum:', error);
		throw createAlbumError('No se pudieron obtener las imágenes del álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		albumLogger.info('➕ Agregando imagen a álbum:', { albumId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				albums: {
					connect: { id: albumId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await notifyAlbumChange('update', { id: albumId });

		albumLogger.info('✅ Imagen agregada al álbum');
		await revalidateAllPaths();
	} catch (error) {
		albumLogger.error('❌ Error al agregar imagen al álbum:', error);
		throw createAlbumError('No se pudo agregar la imagen al álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		albumLogger.info('➖ Removiendo imagen de álbum:', { albumId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				albums: {
					disconnect: { id: albumId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await notifyAlbumChange('update', { id: albumId });

		albumLogger.info('✅ Imagen removida del álbum');
		await revalidateAllPaths();
	} catch (error) {
		albumLogger.error('❌ Error al remover imagen del álbum:', error);
		throw createAlbumError('No se pudo remover la imagen del álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}
