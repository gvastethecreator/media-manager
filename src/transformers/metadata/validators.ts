/**
 * @file Validadores para la entidad Metadata
 * @module transformers/metadata/validators
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const MetadataCreateSchema = z.object({
	type: z.string().min(1),
	data: z.any(),
	entityId: z.string().uuid(),
	entityType: z.string().min(1),
	source: z.string().optional(),
});

export const MetadataUpdateSchema = z.object({
	type: z.string().min(1).optional(),
	data: z.any().optional(),
	source: z.string().optional(),
});

export const MetadataSchema = z.object({
	id: z.string().uuid(),
	type: z.string(),
	data: z.any(),
	entityId: z.string().uuid(),
	entityType: z.string(),
	source: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validateMetadataCreate(data: unknown) {
	return MetadataCreateSchema.parse(data);
}

export function validateMetadataUpdate(data: unknown) {
	return MetadataUpdateSchema.parse(data);
}

export function validateMetadata(data: unknown) {
	return MetadataSchema.parse(data);
}