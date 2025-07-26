/**
 * @file Transformer for UploadedImage entity
 * @module transformers/uploaded-image/transformer
 * @description Contains functions to transform Drizzle UploadedImage objects into application-level types.
 
 */

import {
	type UploadedImageBase,
	type UploadedImageDimensions,
	type UploadedImageExtended,
} from '../../types/entities/uploaded-image/types';

// Tipos locales para uploaded image (migración a Drizzle)
type DrizzleUploadedImageWithRelations = {
	id: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	metadata: string | null;
	imageId: string;
	type: string;
	category: string;
	width: number | null;
	height: number | null;
	createdAt: Date;
	updatedAt: Date;
	image?: {
		thumbnailPath?: string;
	} | null;
};

type DrizzleUploadedImageBase = {
	id: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	metadata: string | null;
	imageId: string;
	type: string;
	category: string;
	width: number | null;
	height: number | null;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Transforms a base Drizzle UploadedImage object into a canonical UploadedImageBase.
 * ✅ MIGRADO A DRIZZLE
 * @param uploadedImage - The Drizzle object.
 * @returns The canonical UploadedImageBase.
 */
export function transformToUploadedImageFromDrizzle(uploadedImage: DrizzleUploadedImageBase): UploadedImageBase {
	// Metadata is already a string or null from Drizzle, aligning with UploadedImageBase.
	return {
		...uploadedImage,
		metadata: uploadedImage.metadata ?? null,
	};
}

/**
 * Transforms a Drizzle UploadedImage object (with or without relations) into a canonical UploadedImageExtended.
 * ✅ MIGRADO A DRIZZLE
 * @param uploadedImage - The Drizzle object, optionally including relations.
 * @returns The canonical UploadedImageExtended.
 */
export function transformToUploadedImageWithRelationsFromDrizzle(
	uploadedImage: DrizzleUploadedImageWithRelations | DrizzleUploadedImageBase
): UploadedImageExtended {
	const width = uploadedImage.width || 800;
	const height = uploadedImage.height || 600;

	const dimensions: UploadedImageDimensions = {
		width,
		height,
		aspectRatio: width / height,
	};

	// Verificar si el objeto tiene relaciones
	const hasRelations = 'image' in uploadedImage;
	const thumbnailUrl = hasRelations ? uploadedImage.image?.thumbnailPath : undefined;

	return {
		...uploadedImage,
		type: uploadedImage.type || null,
		category: uploadedImage.category || null,
		width,
		height,
		uploadedAt: uploadedImage.createdAt, // Usar createdAt como uploadedAt
		updatedAt: uploadedImage.updatedAt,
		metadata: uploadedImage.metadata ?? null,
		dimensions,
		url: `/uploads/${uploadedImage.name}`,
		thumbnailUrl,
	};
}

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar transformToUploadedImageFromDrizzle
 */
export const transformToUploadedImage = transformToUploadedImageFromDrizzle;

/**
 * @deprecated Usar transformToUploadedImageWithRelationsFromDrizzle
 */
export const transformToUploadedImageWithRelations = transformToUploadedImageWithRelationsFromDrizzle;
