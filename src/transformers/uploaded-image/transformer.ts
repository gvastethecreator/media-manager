/**
 * @file Transformer for UploadedImage entity
 * @module transformers/uploaded-image/transformer
 * @description Contains functions to transform Prisma UploadedImage objects into application-level types.
 */

import type { Prisma } from '@prisma/client';
import {
	type UploadedImageBase,
	type UploadedImageDimensions,
	type UploadedImageExtended,
} from '@/types/entities/uploaded-image/types';

// Prisma payload for a complete uploaded image record with its relations (if any)
type UploadedImageFromPrisma = Prisma.UploadedImageGetPayload<{
	include: { image: true };
}>;

// Prisma payload for a basic uploaded image record
type UploadedImageBaseFromPrisma = Prisma.UploadedImageGetPayload<{}>;

/**
 * Transforms a base Prisma UploadedImage object into a canonical UploadedImageBase.
 * @param uploadedImage - The Prisma object.
 * @returns The canonical UploadedImageBase.
 */
export function transformToUploadedImage(uploadedImage: UploadedImageBaseFromPrisma): UploadedImageBase {
	// Metadata is already a string or null from Prisma, aligning with UploadedImageBase.
	return {
		...uploadedImage,
		metadata: uploadedImage.metadata ?? null,
	};
}

/**
 * Transforms a Prisma UploadedImage object (with relations) into a canonical UploadedImageExtended.
 * @param uploadedImage - The Prisma object, including relations.
 * @returns The canonical UploadedImageExtended.
 */
export function transformToUploadedImageWithRelations(uploadedImage: UploadedImageFromPrisma): UploadedImageExtended {
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
