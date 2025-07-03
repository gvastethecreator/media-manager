'use server';

import { existsSync } from 'fs';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { prisma } from '@/lib/database/prisma';
import { generateThumbnail } from '@/lib/image/thumbnail';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ProcessOptions } from '@/services/thumbnail';
import { thumbnailService } from '@/services/thumbnail';
import type { LastProcessedThumbnail, ThumbnailStats } from '@/types/thumbnails';

const thumbLogger = serverLogger.withContext('ThumbnailActions');

export interface ThumbnailResponse {
	thumbnailUrl?: string;
	width?: number;
	height?: number;
	size?: number;
	mimeType?: string;
	error?: string;
}

export async function getThumbnail(
	id: string,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM
): Promise<ThumbnailResponse> {
	try {
		// Validar que la calidad sea una de las opciones válidas
		let validQuality = quality;
		if (!Object.values(ThumbnailQuality).includes(quality as ThumbnailQuality)) {
			thumbLogger.warn('⚠️ Calidad inválida, usando MEDIUM por defecto:', quality);
			validQuality = ThumbnailQuality.MEDIUM;
		}

		// Validar el ID de forma estricta
		if (!id || typeof id !== 'string' || id.trim() === '') {
			const error = 'ID no proporcionado o inválido';
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		thumbLogger.info('🔄 Obteniendo thumbnail:', { id, quality: validQuality });

		const image = await prisma.image.findUnique({
			where: { id },
			select: {
				id: true,
				path: true,
				thumbnail: true,
				thumbnailSize: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailError: true,
				thumbnailMimeType: true,
			},
		});

		if (!image) {
			const error = `Imagen no encontrada: ${id}`;
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		// Si hay un error previo, intentar regenerar
		if (image.thumbnailError) {
			thumbLogger.warn('⚠️ Error previo detectado, intentando regenerar:', {
				id,
				error: image.thumbnailError,
			});
		}

		// Si ya tiene thumbnail, devolverlo
		if (image.thumbnail) {
			// No devolver la base64, sino la URL de la API
			const thumbnailUrl = `/api/images/${image.id}/thumbnail`;

			thumbLogger.info('✅ Thumbnail encontrado en caché (servido por API):', {
				id,
				size: image.thumbnailSize,
				width: image.thumbnailWidth,
				height: image.thumbnailHeight,
				url: thumbnailUrl,
			});

			return {
				thumbnailUrl,
				width: image.thumbnailWidth || undefined,
				height: image.thumbnailHeight || undefined,
				size: image.thumbnailSize || undefined,
				mimeType: image.thumbnailMimeType || 'image/webp',
			};
		}

		// Validar que la ruta del archivo exista
		if (!image.path || !existsSync(image.path)) {
			const error = `Archivo no encontrado en ruta: ${image.path}`;
			// Registrar el error en la base de datos
			await prisma.image.update({
				where: { id },
				data: {
					thumbnailError: error,
				},
			});
			thumbLogger.error(`❌ ${error}`);
			return {
				thumbnailUrl: '',
				error,
			};
		}

		// Si no tiene thumbnail, generarlo
		thumbLogger.info('🔄 Generando nuevo thumbnail:', { id, path: image.path });

		try {
			const thumbnail = await generateThumbnail(image.path, { quality: validQuality });

			if (!thumbnail || !thumbnail.buffer) {
				throw new Error('No se pudo generar el thumbnail');
			}

			// Actualizar la imagen con el nuevo thumbnail
			await prisma.image.update({
				where: { id },
				data: {
					thumbnail: thumbnail.buffer,
					thumbnailSize: thumbnail.buffer.length,
					thumbnailWidth: thumbnail.width,
					thumbnailHeight: thumbnail.height,
					thumbnailError: null, // Limpiar error previo si existía
					thumbnailMimeType: `image/${thumbnail.format}`,
				},
			});

			thumbLogger.info('✅ Nuevo thumbnail generado (servido por API):', {
				id,
				size: thumbnail.buffer.length,
				width: thumbnail.width,
				height: thumbnail.height,
			});

			return {
				thumbnailUrl: `/api/images/${id}/thumbnail`,
				width: thumbnail.width,
				height: thumbnail.height,
				size: thumbnail.buffer.length,
				mimeType: `image/${thumbnail.format}`,
			};
		} catch (genError) {
			// Registrar el error en la imagen
			const errorMessage = genError instanceof Error ? genError.message : 'Error desconocido';
			await prisma.image.update({
				where: { id },
				data: {
					thumbnailError: errorMessage,
				},
			});

			thumbLogger.error('❌ Error generando thumbnail:', genError);
			return {
				thumbnailUrl: '',
				error: errorMessage,
			};
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
		thumbLogger.error('❌ Error obteniendo thumbnail:', { error: errorMessage, id });
		return {
			thumbnailUrl: '',
			error: errorMessage,
		};
	}
}

export async function optimizeThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando optimización de thumbnails');
		return await thumbnailService.optimizeThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error optimizando thumbnails:', error);
		throw error;
	}
}

export async function reprocessThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando reprocesamiento de thumbnails');
		return await thumbnailService.reprocessAll(options);
	} catch (error) {
		thumbLogger.error('❌ Error reprocesando thumbnails:', error);
		throw error;
	}
}

export async function cleanThumbnails(options?: ProcessOptions) {
	try {
		thumbLogger.info('🔄 Iniciando limpieza de thumbnails');
		return await thumbnailService.cleanThumbnails(options);
	} catch (error) {
		thumbLogger.error('❌ Error limpiando thumbnails:', error);
		throw error;
	}
}

export async function getLastProcessedThumbnails(limit = 9): Promise<LastProcessedThumbnail[]> {
	try {
		thumbLogger.info('🔄 Obteniendo últimas miniaturas procesadas:', { limit });

		const images = await prisma.image.findMany({
			where: {
				thumbnail: { not: null },
				thumbnailSize: { not: null },
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: limit,
			select: {
				id: true,
				path: true,
				updatedAt: true,
				thumbnailSize: true,
			},
		});

		return images.map((image) => ({
			id: image.id,
			path: image.path,
			processedAt: image.updatedAt,
			status: 'success' as const,
		}));
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo últimas miniaturas:', error);
		throw error;
	}
}

export async function getThumbnailStats(): Promise<ThumbnailStats> {
	try {
		thumbLogger.info('🔄 Obteniendo estadísticas de thumbnails');

		// Verificar la conexión a la base de datos antes de continuar
		try {
			// Consulta simple para verificar la conexión
			await prisma.$queryRaw`SELECT 1`;
		} catch (dbError) {
			thumbLogger.error('❌ Error de conexión a la base de datos:', dbError);
			throw new Error('No se pudo conectar a la base de datos. Verifica tu conexión.');
		}

		const [totalFiles, withThumbnail, pending, errors] = await Promise.all([
			prisma.image.count(),
			prisma.image.count({
				where: {
					thumbnail: { not: null },
				},
			}),
			prisma.image.count({
				where: {
					thumbnail: null,
				},
			}),
			prisma.image.findMany({
				where: {
					thumbnailError: { not: null },
				},
				select: {
					id: true,
					path: true,
					thumbnailError: true,
					updatedAt: true,
				},
			}),
		]);

		const totalSize = await prisma.image.aggregate({
			_sum: {
				thumbnailSize: true,
			},
			where: {
				thumbnailSize: { not: null },
			},
		});

		return {
			total: totalFiles,
			processed: withThumbnail,
			errors: errors.length,
			totalSize: totalSize._sum.thumbnailSize || 0,
		};
	} catch (error) {
		thumbLogger.error('❌ Error obteniendo estadísticas:', error);

		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Error al obtener estadísticas de miniaturas. Por favor, intenta más tarde.');
	}
}

export async function verifySignedToken(token: string): Promise<{ buffer: Buffer; mimeType: string }> {
	try {
		thumbLogger.info('🔄 Verificando token firmado:', token);

		// TODO: Implementar lógica real de verificación de token
		// Por ahora retornamos un placeholder
		throw new Error('Token verification not implemented yet');
	} catch (error) {
		thumbLogger.error('❌ Error verificando token:', error);
		throw new Error(`Token inválido: ${token}`);
	}
}
