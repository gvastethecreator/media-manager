/**
 * @file Mappers for UploadedImage entity
 * @module transformers/uploaded-image/mappers
 * @description Contains functions to map application-level input types to Prisma-compatible types for UploadedImage.
 */

import type { Prisma } from '@prisma/client';
import type { UploadedImageCreateInput, UploadedImageUpdateInput } from '@/types/entities/uploaded-image/types';

/**
 * Maps the application-level `UploadedImageCreateInput` to the Prisma `UploadedImageCreateInput`.
 * @param data - The application-level create input.
 * @returns The Prisma-compatible create input.
 */
export function mapCreateInputToPrisma(data: UploadedImageCreateInput): Prisma.UploadedImageCreateInput {
	// The type `UploadedImageCreateInput` is a subset of `UploadedImageBase`,
	// but Prisma's `UploadedImageCreateInput` requires `hash` and `imageId`.
	// We'll spread the input and ensure required fields are present.
	return {
		...data,
		// Assuming hash and imageId will be generated or provided later,
		// but they are required by Prisma's type.
		// These might need to be handled upstream or defaulted.
		hash: data.hash || '',
		imageId: data.imageId || '',
	};
}

/**
 * Maps the application-level `UploadedImageUpdateInput` to the Prisma `UploadedImageUpdateInput`.
 * @param data - The application-level update input.
 * @returns The Prisma-compatible update input.
 */
export function mapUpdateInputToPrisma(data: UploadedImageUpdateInput): Prisma.UploadedImageUpdateInput {
	// The update input is a partial, so we can map it directly.
	return data;
}
