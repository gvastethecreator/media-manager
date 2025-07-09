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
