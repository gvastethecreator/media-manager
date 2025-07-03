/**
 * @file Mappers for UploadedImage entity
 * @module transformers/uploaded-image/mappers
 * @description Contains functions to map application-level input types to Drizzle-compatible types for UploadedImage.
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import type { UploadedImageCreateInput, UploadedImageUpdateInput } from '@/types/entities/uploaded-image/types';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleUploadedImageCreateInput = {
	hash: string;
	imageId: string;
	fileName?: string | null;
	fileSize?: number | null;
	mimeType?: string | null;
	uploadedAt?: Date;
	isProcessed?: boolean;
	processingError?: string | null;
};

type DrizzleUploadedImageUpdateInput = Partial<Omit<DrizzleUploadedImageCreateInput, 'hash' | 'imageId'>>;

/**
 * Maps the application-level `UploadedImageCreateInput` to the Drizzle `UploadedImageCreateInput`.
 * ✅ MIGRADO A DRIZZLE
 * @param data - The application-level create input.
 * @returns The Drizzle-compatible create input.
 */
export function mapCreateInputToDrizzle(data: UploadedImageCreateInput): DrizzleUploadedImageCreateInput {
	// The type `UploadedImageCreateInput` is a subset of `UploadedImageBase`,
	// but Drizzle's `UploadedImageCreateInput` requires `hash` and `imageId`.
	// We'll spread the input and ensure required fields are present.
	return {
		...data,
		// Assuming hash and imageId will be generated or provided later,
		// but they are required by Drizzle's type.
		// These might need to be handled upstream or defaulted.
		hash: data.hash || '',
		imageId: data.imageId || '',
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

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar mapCreateInputToDrizzle
 */
export const mapCreateInputToPrisma = mapCreateInputToDrizzle;

/**
 * @deprecated Usar mapUpdateInputToDrizzle
 */
export const mapUpdateInputToPrisma = mapUpdateInputToDrizzle;
