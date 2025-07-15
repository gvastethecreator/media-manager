/**
 * @file Validadores para la entidad JsonFile
 * @module transformers/json-file/validators
 
 */

import { z } from 'zod';

export const JsonFileCreateSchema = z.object({
	name: z.string().min(1).max(255),
	path: z.string().min(1),
	content: z.any(),
	schema: z.string().optional(),
	isValid: z.boolean().default(true),
	size: z.number().int().min(0).default(0),
});

export const JsonFileUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	content: z.any().optional(),
	schema: z.string().optional(),
	isValid: z.boolean().optional(),
	size: z.number().int().min(0).optional(),
});

export const JsonFileSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	path: z.string(),
	content: z.any(),
	schema: z.string().nullable(),
	isValid: z.boolean(),
	size: z.number().int().min(0),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validateJsonFileCreate(data: unknown) {
	return JsonFileCreateSchema.parse(data);
}

export function validateJsonFileUpdate(data: unknown) {
	return JsonFileUpdateSchema.parse(data);
}

export function validateJsonFile(data: unknown) {
	return JsonFileSchema.parse(data);
}
