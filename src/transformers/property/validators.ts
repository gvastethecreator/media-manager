/**
 * @file Validadores para la entidad Property
 * @module transformers/property/validators
 
 */

import { z } from 'zod';

export const PropertyCreateSchema = z.object({
	key: z.string().min(1).max(100),
	value: z.any(),
	type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
	entityId: z.string().uuid(),
	entityType: z.string().min(1),
	isSystem: z.boolean().default(false),
	isRequired: z.boolean().default(false),
});

export const PropertyUpdateSchema = z.object({
	key: z.string().min(1).max(100).optional(),
	value: z.any().optional(),
	type: z.enum(['string', 'number', 'boolean', 'object', 'array']).optional(),
	isSystem: z.boolean().optional(),
	isRequired: z.boolean().optional(),
});

export const PropertySchema = z.object({
	id: z.string().uuid(),
	key: z.string(),
	value: z.any(),
	type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
	entityId: z.string().uuid(),
	entityType: z.string(),
	isSystem: z.boolean(),
	isRequired: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validatePropertyCreate(data: unknown) {
	return PropertyCreateSchema.parse(data);
}

export function validatePropertyUpdate(data: unknown) {
	return PropertyUpdateSchema.parse(data);
}

export function validateProperty(data: unknown) {
	return PropertySchema.parse(data);
}
