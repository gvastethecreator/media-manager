/**
 * @file Validadores para la entidad Group
 * @module transformers/group/validators
 * @description Funciones de validación con Zod para Group
 
 */

import { z } from 'zod';
import type { GroupBase, GroupCreateInput, GroupUpdateInput } from '../../types/entities/group';

/**
 * Valida datos para crear un grupo
 */
export function validateGroupCreate(data: unknown): GroupCreateInput {
	const schema = z.object({
		name: z.string().min(1, 'The name is required').max(100),
		description: z.string().max(500).optional(),
		emoji: z.string().max(10).optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.optional(),
	});

	return schema.parse(data);
}

/**
 * Valida datos para actualizar un grupo
 */
export function validateGroupUpdate(data: unknown): GroupUpdateInput {
	const schema = z.object({
		name: z.string().min(1).max(100).optional(),
		description: z.string().max(500).optional(),
		emoji: z.string().max(10).optional(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.optional(),
	});

	return schema.parse(data);
}

/**
 * Valida un objeto Group base
 */
export function validateGroup(data: unknown): GroupBase {
	const schema = z.object({
		id: z.string().uuid(),
		name: z.string().min(1).max(100),
		description: z.string().max(500).nullable(),
		emoji: z.string().max(10).nullable(),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.nullable(),
		isFavorite: z.boolean(),
		createdAt: z.date(),
		updatedAt: z.date(),
	});

	return schema.parse(data);
}
