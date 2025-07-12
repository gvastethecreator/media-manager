/**
 * @file Mappers for UploadedImage entity
 * @module transformers/uploaded-image/mappers
 * @description Contains functions to map application-level input types to Drizzle-compatible types for UploadedImage.
 
 */

import type { UploadedImageCreateInput, UploadedImageUpdateInput } from '@/types/entities/uploaded-image/types';

// Tipos de datos para Drizzle
type DrizzleUploadedImageCreateInput = {
	id?: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	metadata?: string | null;
	imageId: string;
	createdAt?: Date;
};

type DrizzleUploadedImageUpdateInput = Partial<Omit<DrizzleUploadedImageCreateInput, 'hash' | 'imageId'>>;

/**
 * Maps the application-level `UploadedImageCreateInput` to the Drizzle `UploadedImageCreateInput`.
 * ✅ MIGRADO A DRIZZLE
 * @param data - The application-level create input.
 * @returns The Drizzle-compatible create input.
 */
export function mapCreateInputToDrizzle(data: UploadedImageCreateInput): DrizzleUploadedImageCreateInput {
	return {
		id: crypto.randomUUID(),
		name: data.name,
		path: data.path,
		size: data.size,
		hash: data.hash,
		metadata: data.metadata || null,
		imageId: data.imageId,
		createdAt: new Date(),
	};
}

/**
 * Maps the application-level `UploadedImageUpdateInput` to the Drizzle `UploadedImageUpdateInput`.
 * ✅ MIGRADO A DRIZZLE
 * @param data - The application-level update input.
 * @returns The Drizzle-compatible update input.
 */
export function mapUpdateInputToDrizzle(data: UploadedImageUpdateInput): DrizzleUploadedImageUpdateInput {
	// The update input is a partial, so we can map it directly.
	return data;
}

/**
 * Convierte un UploadedImageBase a UploadedImageExtended con dimensiones y estadísticas.
 * @param uploadedImage - Datos base de la imagen subida
 * @param dimensions - Dimensiones de la imagen (opcional)
 * @param stats - Estadísticas de la imagen (opcional)
 * @returns UploadedImageExtended
 */
export function toUploadedImageExtended(
	uploadedImage: any,
	dimensions?: { width: number; height: number },
	stats?: any
): any {
	// Calcular dimensiones si no se proporcionan
	const imageDimensions = dimensions || {
		width: 800,
		height: 600,
		aspectRatio: 800 / 600,
	};
	
	// Calcular estadísticas básicas si no se proporcionan
	const imageStats = stats || {
		totalViews: 0,
		lastAccessed: new Date().toISOString(),
		processingTime: 0,
	};
	
	// Construir URL de la imagen
	const imageUrl = `/uploads/${uploadedImage.name || uploadedImage.id}`;
	const thumbnailUrl = `/uploads/thumbnails/${uploadedImage.name || uploadedImage.id}`;
	
	return {
		...uploadedImage,
		dimensions: {
			...imageDimensions,
			aspectRatio: imageDimensions.width / imageDimensions.height,
		},
		url: imageUrl,
		thumbnailUrl,
		stats: imageStats,
	};
}

/**
 * Convierte una lista de UploadedImageBase a UploadedImageExtended.
 * @param uploadedImages - Lista de imágenes base
 * @returns Lista de UploadedImageExtended
 */
export function toUploadedImageExtendedList(uploadedImages: any[]): any[] {
	return uploadedImages.map(image => toUploadedImageExtended(image));
}
