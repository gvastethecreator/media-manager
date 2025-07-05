/**
 * @file Transformer for UploadedImage entity
 * @module transformers/uploaded-image/transformer
 * @description Contains functions to transform Drizzle UploadedImage objects into application-level types.
 
 */

import {
	type UploadedImageBase,
	type UploadedImageDimensions,
	type UploadedImageExtended,
} from '@/types/entities/uploaded-image/types';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleUploadedImageWithRelations = {
	id: string;
	hash: string;
	imageId: string;
	fileName: string | null;
	fileSize: number | null;
	mimeType: string | null;
	uploadedAt: Date;
	isProcessed: boolean;
	processingError: string | null;
	width: number;
	height: number;
	metadata: string | null;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	image?: {
		thumbnailPath?: string;
	} | null;
};

type DrizzleUploadedImageBase = {
	id: string;
	hash: string;
	imageId: string;
	fileName: string | null;
	fileSize: number | null;
	mimeType: string | null;
	uploadedAt: Date;
	isProcessed: boolean;
	processingError: string | null;
	width: number;
	height: number;
	metadata: string | null;
	name: string;
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
 * Transforms a Drizzle UploadedImage object (with relations) into a canonical UploadedImageExtended.
 * ✅ MIGRADO A DRIZZLE
 * @param uploadedImage - The Drizzle object, including relations.
 * @returns The canonical UploadedImageExtended.
 */
export function transformToUploadedImageWithRelationsFromDrizzle(
	uploadedImage: DrizzleUploadedImageWithRelations
): UploadedImageExtended {
	const dimensions: UploadedImageDimensions = {
		width: uploadedImage.width,
		height: uploadedImage.height,
		aspectRatio: uploadedImage.width / uploadedImage.height,
	};

	return {
		...uploadedImage,
		metadata: uploadedImage.metadata ?? null,
		dimensions,
		url: `/uploads/${uploadedImage.name}`, // Example URL construction
		thumbnailUrl: uploadedImage.image?.thumbnailPath, // Assuming 'image' relation has a thumbnail path
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

