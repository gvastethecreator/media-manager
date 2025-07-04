/**
 * @file Validadores para la entidad Note
 * @module transformers/note/validators
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const NoteCreateSchema = z.object({
	title: z.string().min(1).max(255),
	content: z.string().optional(),
	excerpt: z.string().max(500).optional(),
	category: z.string().max(100).optional(),
	emoji: z.string().max(10).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	isFavorite: z.boolean().default(false),
	isPinned: z.boolean().default(false),
	isArchived: z.boolean().default(false),
	tags: z.array(z.string()).optional(),
});

export const NoteUpdateSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	content: z.string().optional(),
	excerpt: z.string().max(500).optional(),
	category: z.string().max(100).optional(),
	emoji: z.string().max(10).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	isFavorite: z.boolean().optional(),
	isPinned: z.boolean().optional(),
	isArchived: z.boolean().optional(),
	tags: z.array(z.string()).optional(),
});

export const NoteSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	content: z.string().nullable(),
	excerpt: z.string().nullable(),
	category: z.string().nullable(),
	emoji: z.string().nullable(),
	color: z.string().nullable(),
	isFavorite: z.boolean(),
	isPinned: z.boolean(),
	isArchived: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validateNoteCreate(data: unknown) {
	return NoteCreateSchema.parse(data);
}

export function validateNoteUpdate(data: unknown) {
	return NoteUpdateSchema.parse(data);
}

export function validateNote(data: unknown) {
	return NoteSchema.parse(data);
}
