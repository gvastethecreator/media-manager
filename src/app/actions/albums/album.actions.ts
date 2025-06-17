'use server';

import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
// Importaciones actualizadas usando nuevos tipos y transformers
import type { ServerImage } from '@/services/image-converter.service';
import { convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { mapCreateAlbumDataToPrisma, mapUpdateAlbumDataToPrisma } from '@/transformers/album/mappers';
import { transformAlbumToExtended } from '@/transformers/album/transformer';
import type { Album, AlbumBase, AlbumUpdateInput, CreateAlbumData } from '@/types/entities/album';
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
		albumLogger.info('🎞️ Obteniendo álbumes con estadísticas simplificadas');

		// Obtener álbumes solo con conteos básicos
		const albums = await prisma.album.findMany({
			include: {
				_count: {
					select: {
						images: true, // Conteo directo es eficiente
						groups: true,
						properties: true,
						wildcards: true,
					},
				},
				// Comentado/Eliminado: Incluir imágenes y calcular stats aquí es costoso
				// images: {
				// 	select: {
				// 		size: true,
				// 		updatedAt: true,
				// 	},
				// 	orderBy: {
				// 		updatedAt: 'desc',
				// 	},
				// 	take: 1,
				// },
			},
			orderBy: [
				// Simplificar ordenación si es posible, o mantener si es necesaria
				// La ordenación por _count puede ser costosa
				// { images: { _count: 'desc' } },
				{
					name: 'asc',
				},
			],
		});

		// Mapear resultados usando solo transformAlbumToExtended (ya incluye fromPrismaAlbum internamente)
		const albumsWithStats = albums.map((album: any) => {
			try {
				// 🔧 FIX: Usar solo transformAlbumToExtended, que ya maneja la transformación desde Prisma
				const extendedAlbum = transformAlbumToExtended(album);

				// Acceso seguro a _count
				const count = album._count || { images: 0, groups: 0, properties: 0, wildcards: 0 };

				return {
					...extendedAlbum,
					_count: count,
					totalSize: 0,
					lastUpdated: album.updatedAt,
					distribution: [],
				};
			} catch (error) {
				albumLogger.error('❌ Error transformando álbum individual:', { albumId: album?.id, error });
				// Retornar un álbum básico en caso de error
				return {
					id: album?.id || 'unknown',
					name: album?.name || 'Unknown Album',
					emoji: album?.emoji || '📁',
					color: album?.color || '#gray',
					description: album?.description || null,
					shortcut: album?.shortcut || null,
					category: album?.category || '',
					sortBy: album?.sortBy || '',
					filters: album?.filters || '',
					featuredImage: album?.featuredImage || null,
					isFavorite: album?.isFavorite || false,
					createdAt: album?.createdAt || new Date(),
					updatedAt: album?.updatedAt || new Date(),
					images: [],
					videos: [],
					collections: [],
					tags: [],
					characters: [],
					places: [],
					worldItems: [],
					concepts: [],
					prompts: [],
					notes: [],
					wildcards: [],
					properties: [],
					groups: [],
					_count: { images: 0, groups: 0, properties: 0, wildcards: 0 },
					totalSize: 0,
					lastUpdated: album?.updatedAt || new Date(),
					distribution: [],
					isSelected: false,
					isHighlighted: false,
					isExpanded: false,
					isEditing: false,
					displayOrder: 0,
				};
			}
		});

		// Comentado/Eliminado: Cálculo complejo de estadísticas movido
		// const albumsWithStats = await Promise.all(
		// 	albums.map(async (album: any) => {
		// 		// ... código eliminado para calcular totalSize y distribution ...
		// 	})
		// );

		albumLogger.info('✅ Álbumes (simplificado) obtenidos', { count: albums.length });
		return albumsWithStats;
	} catch (error) {
		albumLogger.error('❌ Error al obtener álbumes (simplificado)', error);
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
						groups: true,
						properties: true,
						wildcards: true,
					},
				},
			},
		});

		if (!album) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		albumLogger.info('✅ Álbum obtenido:', album.name);

		// Convertir el resultado de Prisma al tipo Album usando el nuevo transformador
		const albumData = transformAlbumToExtended(fromPrismaAlbum(album as AlbumBase));

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

		// Convertir el resultado de Prisma al tipo Album usando el nuevo transformador
		const albumData = transformAlbumToExtended(fromPrismaAlbum(album as AlbumBase));

		return albumData;
	} catch (error) {
		albumLogger.error('❌ Error al crear álbum:', error);
		throw createAlbumError('No se pudo crear el álbum', AlbumErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateAlbum(id: string, data: AlbumUpdateInput): Promise<Album> {
	try {
		albumLogger.info('🔄 Actualizando álbum:', id);

		// Verificar que el álbum exista
		const existingAlbum = await prisma.album.findUnique({
			where: { id },
		});

		if (!existingAlbum) {
			throw createAlbumError('Álbum no encontrado', AlbumErrorCode.NOT_FOUND);
		}

		// Usar el transformer para preparar los datos para Prisma
		const prismaData = mapUpdateAlbumDataToPrisma(data);

		// Actualizar el álbum
		const updatedAlbum = await prisma.album.update({
			where: { id },
			data: prismaData,
		});

		// Notificar cambio
		await notifyAlbumChange('update', updatedAlbum);
		await revalidateAllPaths();

		albumLogger.info('✅ Álbum actualizado:', updatedAlbum.name);

		// Convertir el resultado de Prisma al tipo Album usando el nuevo transformador
		const albumData = transformAlbumToExtended(fromPrismaAlbum(updatedAlbum as AlbumBase));

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
