'use server';

import type { ImageComplete as Image } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { createMetadataError as createMetadataErrorAction } from './index';
import type { ImageMetadata, ImageWithMetadata, UpdateMetadataInput } from './metadata-types.actions';

// Configuración y utilidades
const metadataLogger = serverLogger.withContext('MetadataActions');
const REVALIDATE_PATHS = ['/images', '/images/[id]'] as const;

// Códigos de error
enum MetadataErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores
const _createMetadataError = (
	message: string,
	code: MetadataErrorCode = MetadataErrorCode.OPERATION_FAILED,
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
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw await createMetadataErrorAction('Imagen no encontrada', MetadataErrorCode.NOT_FOUND);
		}

		metadataLogger.info('✅ Metadatos obtenidos');
		return parseImageMetadata(image);
	} catch (error) {
		metadataLogger.error('❌ Error al obtener metadatos:', error);
		if (error instanceof Error && error.name === 'MetadataError') {
			throw error;
		}
		throw await createMetadataErrorAction(
			'No se pudieron obtener los metadatos',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function updateImageMetadata(imageId: string, data: UpdateMetadataInput): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('📝 Actualizando metadatos:', imageId);

		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw await createMetadataErrorAction('Imagen no encontrada', MetadataErrorCode.NOT_FOUND);
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
		throw await createMetadataErrorAction(
			'No se pudieron actualizar los metadatos',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function clearImageMetadata(imageId: string): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('🗑️ Limpiando metadatos:', imageId);

		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			throw await createMetadataErrorAction('Imagen no encontrada', MetadataErrorCode.NOT_FOUND);
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
		throw await createMetadataErrorAction(
			'No se pudieron limpiar los metadatos',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}
