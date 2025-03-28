'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { revalidatePath } from 'next/cache';
// Importaciones actualizadas usando nuevos tipos y transformers
import type { ServerImage } from '@/services/image-converter.service';
import { mapCreateAlbumDataToPrisma, mapUpdateAlbumDataToPrisma } from '@/transformers/album';
import {
	type Album,
	type AlbumBase,
	AlbumPrivacyLevel,
	AlbumType,
	type CreateAlbumData,
	type UpdateAlbumData,
} from '@/types/entities/album';
import type { FileItem } from '@/types/file-item';

// Configuración y utilidades
const albumLogger = serverLogger.withContext('AlbumActions');
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

// Interfaz para álbum con estadísticas (para compatibilidad)
export interface AlbumWithStats extends AlbumBase {
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
	presetId?: string;
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
			albums.map(async (album: any) => {
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
					lastUpdated: album.images?.[0]?.updatedAt || album.updatedAt,
					distribution: distribution.map((d: any) => ({
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

		// Convertir el resultado de Prisma al tipo Album
		const albumData: Album = {
			...(album as unknown as AlbumBase),
			privacyLevel: (album as any).privacyLevel || AlbumPrivacyLevel.PRIVATE,
			type: (album as any).type || AlbumType.STANDARD,
			ownerId: (album as any).ownerId || '',
			isArchived: (album as any).isArchived || false,
		};

		return albumData;
	} catch (error) {
		albumLogger.error('❌ Error al obtener álbum:', error);
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo obtener el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function createAlbum(data: CreateAlbumData): Promise<Album> {
	try {
		albumLogger.info('📝 Creando álbum:', data.name);

		// Usar el transformer para preparar los datos para Prisma
		const prismaData = mapCreateAlbumDataToPrisma(data);

		// Crear el álbum
		const album = await prisma.album.create({
			data: prismaData,
		});

		// Notificar cambio
		await notifyAlbumChange('create', album);
		await revalidateAllPaths();

		albumLogger.info('✅ Álbum creado:', album.name);

		// Convertir el resultado de Prisma al tipo Album
		const albumData: Album = {
			...(album as unknown as AlbumBase),
			privacyLevel: prismaData.privacyLevel || AlbumPrivacyLevel.PRIVATE,
			type: prismaData.type || AlbumType.STANDARD,
			ownerId: (album as any).ownerId || '',
			isArchived: (album as any).isArchived || false,
		};

		return albumData;
	} catch (error) {
		albumLogger.error('❌ Error al crear álbum:', error);
		throw createAlbumError('No se pudo crear el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateAlbum(id: string, data: UpdateAlbumData): Promise<Album> {
	try {
		albumLogger.info('📝 Actualizando álbum:', { id, ...data });

		// Verificar si el álbum existe
		const existingAlbum = await prisma.album.findUnique({
			where: { id },
		});

		if (!existingAlbum) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		// Usar el transformer para preparar los datos para Prisma
		const prismaData = mapUpdateAlbumDataToPrisma(data);

		// Actualizar el álbum
		const album = await prisma.album.update({
			where: { id },
			data: prismaData,
		});

		// Notificar cambio
		await notifyAlbumChange('update', album);
		await revalidateAllPaths();

		albumLogger.info('✅ Álbum actualizado:', album.name);

		// Convertir el resultado de Prisma al tipo Album
		const albumData: Album = {
			...(album as unknown as AlbumBase),
			privacyLevel: (album as any).privacyLevel || (existingAlbum as any).privacyLevel || AlbumPrivacyLevel.PRIVATE,
			type: (album as any).type || (existingAlbum as any).type || AlbumType.STANDARD,
			ownerId: (album as any).ownerId || (existingAlbum as any).ownerId || '',
			isArchived:
				(album as any).isArchived !== undefined
					? (album as any).isArchived
					: (existingAlbum as any).isArchived || false,
		};

		return albumData;
	} catch (error) {
		albumLogger.error('❌ Error al actualizar álbum:', error);
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo actualizar el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function deleteAlbum(id: string): Promise<void> {
	try {
		albumLogger.info('🗑️ Eliminando álbum:', id);

		// Verificar si el álbum existe
		const album = await prisma.album.findUnique({ where: { id } });
		if (!album) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		// Eliminar el álbum
		await prisma.album.delete({ where: { id } });

		// Notificar cambio
		await notifyAlbumChange('delete', { id });
		await revalidateAllPaths();

		albumLogger.info('✅ Álbum eliminado:', id);
	} catch (error) {
		albumLogger.error('❌ Error al eliminar álbum:', error);
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo eliminar el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function getAlbumImages(id: string): Promise<FileItem[]> {
	try {
		albumLogger.info('🖼️ Obteniendo imágenes del álbum:', id);

		// Verificar si el álbum existe
		const album = await prisma.album.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						tags: {
							select: { id: true, name: true, color: true },
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

		if (!album) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		// Convertir imágenes al formato FileItem
		const fileItems = await Promise.all(
			album.images.map(async (image) => {
				return convertServerImageToFileItem(image as unknown as ServerImage);
			})
		);

		albumLogger.info('✅ Imágenes obtenidas:', fileItems.length);
		return fileItems;
	} catch (error) {
		albumLogger.error('❌ Error al obtener imágenes del álbum:', error);
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudieron obtener las imágenes del álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function addImageToAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		albumLogger.info('➕ Añadiendo imagen al álbum:', { albumId, imageId });

		// Verificar si el álbum y la imagen existen
		const [album, image] = await Promise.all([
			prisma.album.findUnique({ where: { id: albumId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!album) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createAlbumError('Imagen no encontrada', AlbumErrorCode.NOT_FOUND);
		}

		// Conectar la imagen al álbum
		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		// Notificar cambio
		await notifyAlbumChange('update', album);
		await revalidateAllPaths();

		albumLogger.info('✅ Imagen añadida al álbum');
	} catch (error) {
		albumLogger.error('❌ Error al añadir imagen al álbum:', error);
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo añadir la imagen al álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function removeImageFromAlbum(albumId: string, imageId: string): Promise<void> {
	try {
		albumLogger.info('➖ Eliminando imagen del álbum:', { albumId, imageId });

		// Verificar si el álbum y la imagen existen
		const [album, image] = await Promise.all([
			prisma.album.findUnique({ where: { id: albumId } }),
			prisma.image.findUnique({ where: { id: imageId } }),
		]);

		if (!album) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		if (!image) {
			throw createAlbumError('Imagen no encontrada', AlbumErrorCode.NOT_FOUND);
		}

		// Desconectar la imagen del álbum
		await prisma.album.update({
			where: { id: albumId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		// Notificar cambio
		await notifyAlbumChange('update', album);
		await revalidateAllPaths();

		albumLogger.info('✅ Imagen eliminada del álbum');
	} catch (error) {
		albumLogger.error('❌ Error al eliminar imagen del álbum:', error);
		if (error instanceof Error && error.name === 'AlbumError') {
			throw error;
		}
		throw createAlbumError('No se pudo eliminar la imagen del álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}
