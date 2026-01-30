/**
 * @file Validadores para la entidad Image
 * @module transformers/image/validators
 * @description Funciones de validación con Zod para Image
 
 */

import { z } from 'zod';

export const ImageCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
	path: z.string().min(1),
	hash: z.string().optional(),
	size: z.number().int().min(0),
	width: z.number().int().min(1),
	height: z.number().int().min(1),
	metadata: z.any().optional(),
	isFavorite: z.boolean().default(false),
	folderId: z.string().uuid().optional(),
});

export const ImageUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional(),
	isFavorite: z.boolean().optional(),
	metadata: z.any().optional(),
});

export const ImageSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	path: z.string(),
	hash: z.string(),
	size: z.number().int().min(0),
	width: z.number().int().min(1),
	height: z.number().int().min(1),
	metadata: z.any().nullable(),
	isFavorite: z.boolean(),
	addedAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validateImageCreate(data: unknown) {
	return ImageCreateSchema.parse(data);
}

export function validateImageUpdate(data: unknown) {
	return ImageUpdateSchema.parse(data);
}

export function validateImage(data: unknown) {
	return ImageSchema.parse(data);
}
