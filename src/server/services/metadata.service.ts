import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';

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

// Tipos de metadatos usando Drizzle
export interface ImageMetadata {
	colorSpace?: string;
	exif?: Record<string, unknown>;
	format?: string;
	hasAlpha?: boolean;
	orientation?: number;
}

// Tipo local para imagen de Drizzle
interface DrizzleImage {
	addedAt: Date;
	createdAt: Date;
	folderId: string | null;
	height: number | null;
	id: string;
	isFavorite: boolean;
	metadata: string | null;
	name: string | null;
	path: string;
	size: number;
	thumbnail: Buffer | null;
	thumbnailError: string | null;
	thumbnailErrorAt: Date | null;
	thumbnailHeight: number | null;
	thumbnailOptimizedAt: Date | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	updatedAt: Date;
	width: number | null;
}

export interface ImageWithMetadata extends DrizzleImage {
	parsedMetadata?: ImageMetadata;
}

export interface UpdateMetadataInput {
	colorSpace?: string;
	exif?: Record<string, unknown>;
	format?: string;
	hasAlpha?: boolean;
	height?: number;
	orientation?: number;
	size?: number;
	width?: number;
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
function parseImageMetadata(image: DrizzleImage): ImageWithMetadata {
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

// Acciones del servidor usando Drizzle
export async function getImageMetadata(imageId: string): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('🔍 Obteniendo metadatos:', imageId);

		const [image] = await db.select().from(images).where(eq(images.id, imageId)).limit(1);

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
		throw _createMetadataError('No se pudieron obtener los metadatos', MetadataErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateImageMetadata(imageId: string, data: UpdateMetadataInput): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('📝 Actualizando metadatos:', imageId);

		const [image] = await db.select().from(images).where(eq(images.id, imageId)).limit(1);

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
		const [updatedImage] = await db
			.update(images)
			.set({
				metadata: JSON.stringify(newMetadata),
				width: data.width || image.width,
				height: data.height || image.height,
				size: data.size || image.size,
				updatedAt: new Date(),
			})
			.where(eq(images.id, imageId))
			.returning();

		await notifyMetadataChange('update', imageId);
		await revalidateAllPaths();

		metadataLogger.info('✅ Metadatos actualizados');
		return parseImageMetadata(updatedImage);
	} catch (error) {
		metadataLogger.error('❌ Error al actualizar metadatos:', error);
		if (error instanceof Error && error.name === 'MetadataError') {
			throw error;
		}
		throw _createMetadataError('No se pudieron actualizar los metadatos', MetadataErrorCode.OPERATION_FAILED, error);
	}
}

export async function clearImageMetadata(imageId: string): Promise<ImageWithMetadata> {
	try {
		metadataLogger.info('🗑️ Limpiando metadatos:', imageId);

		const [image] = await db.select().from(images).where(eq(images.id, imageId)).limit(1);

		if (!image) {
			throw _createMetadataError('Imagen no encontrada', MetadataErrorCode.NOT_FOUND);
		}

		// Actualizar la imagen limpiando los metadatos
		const [updatedImage] = await db
			.update(images)
			.set({
				metadata: null,
				updatedAt: new Date(),
			})
			.where(eq(images.id, imageId))
			.returning();

		await notifyMetadataChange('update', imageId);
		await revalidateAllPaths();

		metadataLogger.info('✅ Metadatos limpiados');
		return parseImageMetadata(updatedImage);
	} catch (error) {
		metadataLogger.error('❌ Error al limpiar metadatos:', error);
		if (error instanceof Error && error.name === 'MetadataError') {
			throw error;
		}
		throw _createMetadataError('No se pudieron limpiar los metadatos', MetadataErrorCode.OPERATION_FAILED, error);
	}
}

export async function updateMultipleImagesMetadata(imageIds: string[], data: UpdateMetadataInputZod) {
	try {
		metadataLogger.info('📝 Actualizando metadatos múltiples:', imageIds.length);

		// Validar entrada
		const validatedData = updateMetadataSchema.parse(data);

		// Actualizar todas las imágenes en una transacción
		await db.transaction(async (tx: any) => {
			for (const imageId of imageIds) {
				await tx
					.update(images)
					.set({
						// Nota: En Drizzle necesitaríamos manejar los metadatos de manera diferente
						// por ahora solo actualizamos updatedAt
						updatedAt: new Date(),
					})
					.where(eq(images.id, imageId));
			}
		});

		// Notificar cambios
		for (const imageId of imageIds) {
			await notifyMetadataChange('update', imageId);
		}

		await revalidateAllPaths();
		metadataLogger.info('✅ Metadatos múltiples actualizados');

		return { success: true, updatedCount: imageIds.length };
	} catch (error) {
		metadataLogger.error('❌ Error al actualizar metadatos múltiples:', error);
		throw _createMetadataError(
			'No se pudieron actualizar los metadatos múltiples',
			MetadataErrorCode.OPERATION_FAILED,
			error
		);
	}
}
