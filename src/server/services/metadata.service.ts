import type { Image } from '@prisma/client';
import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { createMetadataError as createMetadataErrorAction } from '@/app/actions/metadata/index'; // Mantener import para errores
import { z } from 'zod';

// Configuración y utilidades
const metadataLogger = serverLogger.withContext('MetadataService');
const REVALIDATE_PATHS = ['/images', '/images/[id]'] as const;

// Códigos de error como string literals
const MetadataErrorCode = {
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

type MetadataErrorCodeType = (typeof MetadataErrorCode)[keyof typeof MetadataErrorCode];

// Función creadora de errores
const _createMetadataError = (
	message: string,
	code: MetadataErrorCodeType = MetadataErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'MetadataError';
	Object.assign(error, { code, cause });
	return error;
};

// Utilidades
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	metadataLogger.info('🔄 Rutas revalidadas');
};

const notifyMetadataChange = async (action: 'create' | 'update' | 'delete', imageId: string) => {
	await emit({
		type: 'images:modified',
		imageId,
		data: { action },
	});
};

// Tipos de metadatos
export interface ImageMetadata {
	format?: string;
	colorSpace?: string;
	hasAlpha?: boolean;
	orientation?: number;
	exif?: Record<string, unknown>;
}

export interface ImageWithMetadata extends Image {
	parsedMetadata?: ImageMetadata;
}

export interface UpdateMetadataInput {
	format?: string;
	colorSpace?: string;
	hasAlpha?: boolean;
	orientation?: number;
	exif?: Record<string, unknown>;
	width?: number;
	height?: number;
	size?: number;
}

// Esquema de validación para actualizar metadatos de una imagen
const updateMetadataSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	alt: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

type UpdateMetadataInputZod = z.infer<typeof updateMetadataSchema>;

// Función para parsear los metadatos de una imagen
function parseImageMetadata(image: Image): ImageWithMetadata {
	let parsedMetadata: ImageMetadata | undefined;

	if (image.metadata) {
		try {
			parsedMetadata = JSON.parse(image.metadata);
		} catch (error) {
			metadataLogger.error('❌ Error al parsear metadatos:', error);
		}
	}

	return {
		...image,
		parsedMetadata,
	};
}

// Acciones del servidor
export async function getImageMetadata(imageId: string): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('🔍 Obteniendo metadatos:', imageId);
		const prisma = await getPrismaClient();
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw _createMetadataError('Imagen no encontrada', MetadataErrorCode.NOT_FOUND);
		}

		metadataLogger.info('✅ Metadatos obtenidos');
		return parseImageMetadata(image);
	} catch (error) {
		metadataLogger.error('❌ Error al obtener metadatos:', error);
		if (error instanceof Error && error.name === 'MetadataError') {
			throw error;
		}
		throw _createMetadataError(
			'No se pudieron obtener los metadatos',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function updateImageMetadata(imageId: string, data: UpdateMetadataInput): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('📝 Actualizando metadatos:', imageId);
		const prisma = await getPrismaClient();
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw _createMetadataError('Imagen no encontrada', MetadataErrorCode.NOT_FOUND);
		}

		// Obtener los metadatos actuales
		const currentMetadata = image.metadata ? JSON.parse(image.metadata) : {};

		// Combinar con los nuevos metadatos
		const newMetadata = {
			...currentMetadata,
			format: data.format,
			colorSpace: data.colorSpace,
			hasAlpha: data.hasAlpha,
			orientation: data.orientation,
			exif: data.exif ? { ...currentMetadata.exif, ...data.exif } : currentMetadata.exif,
		};

		// Actualizar la imagen
		const updatedImage = await prisma.image.update({
			where: { id: imageId },
			data: {
				metadata: JSON.stringify(newMetadata),
				width: data.width || undefined,
				height: data.height || undefined,
				size: data.size || undefined,
			},
		});

		await notifyMetadataChange('update', imageId);
		await revalidateAllPaths();

		metadataLogger.info('✅ Metadatos actualizados');
		return parseImageMetadata(updatedImage);
	} catch (error) {
		metadataLogger.error('❌ Error al actualizar metadatos:', error);
		if (error instanceof Error && error.name === 'MetadataError') {
			throw error;
		}
		throw _createMetadataError(
			'No se pudieron actualizar los metadatos',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function clearImageMetadata(imageId: string): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('🗑️ Limpiando metadatos:', imageId);
		const prisma = await getPrismaClient();
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw _createMetadataError('Imagen no encontrada', MetadataErrorCode.NOT_FOUND);
		}

		// Actualizar la imagen limpiando los metadatos
		const updatedImage = await prisma.image.update({
			where: { id: imageId },
			data: {
				metadata: null,
			},
		});

		await notifyMetadataChange('delete', imageId);
		await revalidateAllPaths();

		metadataLogger.info('✅ Metadatos eliminados');
		return parseImageMetadata(updatedImage);
	} catch (error) {
		metadataLogger.error('❌ Error al limpiar metadatos:', error);
		if (error instanceof Error && error.name === 'MetadataError') {
			throw error;
		}
		throw _createMetadataError(
			'No se pudieron limpiar los metadatos',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function updateMultipleImagesMetadata(imageIds: string[], data: UpdateMetadataInputZod) {
	try {
		metadataLogger.info(`📝 Actualizando metadatos para ${imageIds.length} imágenes`);
		const prisma = await getPrismaClient();

		const validatedData = updateMetadataSchema.parse(data);

		const updates = imageIds.map(async (imageId) => {
			const image = await prisma.image.findUnique({
				where: { id: imageId },
			});

			if (!image) {
				metadataLogger.warn(`Imagen ${imageId} no encontrada para actualización masiva.`);
				return null;
			}

			// Obtener los metadatos actuales
			const currentMetadata = image.metadata ? JSON.parse(image.metadata) : {};

			// Combinar con los nuevos metadatos
			const newMetadata = {
				...currentMetadata,
				...validatedData,
			};

			// Actualizar la imagen
			const updatedImage = await prisma.image.update({
				where: { id: imageId },
				data: {
					metadata: JSON.stringify(newMetadata),
				},
			});
			await notifyMetadataChange('update', imageId);
			return updatedImage;
		});

		const results = await Promise.all(updates);
		await revalidateAllPaths();

		metadataLogger.info(`✅ Metadatos actualizados para ${results.filter(Boolean).length} imágenes.`);
		return { success: true, count: results.filter(Boolean).length };
	} catch (error) {
		metadataLogger.error('❌ Error al actualizar metadatos en masa:', error);
		throw _createMetadataError(
			'No se pudieron actualizar los metadatos en masa',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}