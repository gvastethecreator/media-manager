import { z } from 'zod';
import { NoteCategory, NotePriority, NoteStatus } from '@/types/entities/note';

/**
 * Esquema para validar tags
 */
export const noteTagsSchema = z.object({
	items: z.array(z.string()),
});

/**
 * Esquema para validar la creación de una nota
 */
export const createNoteSchema = z.object({
	title: z.string().min(1, 'El título es requerido').max(100, 'El título no puede exceder 100 caracteres'),
	content: z.string().optional().default(''),
	category: z.nativeEnum(NoteCategory).optional().default(NoteCategory.GENERAL),
	priority: z.nativeEnum(NotePriority).optional().default(NotePriority.MEDIUM),
	status: z.nativeEnum(NoteStatus).optional().default(NoteStatus.ACTIVE),
	tags: z.union([z.string(), z.array(z.string())]).optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional().default(false),
});

/**
 * Esquema para validar la actualización de una nota
 */
export const updateNoteSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	title: z.string().min(1, 'El título es requerido').max(100, 'El título no puede exceder 100 caracteres').optional(),
	content: z.string().optional(),
	category: z.nativeEnum(NoteCategory).optional(),
	priority: z.nativeEnum(NotePriority).optional(),
	status: z.nativeEnum(NoteStatus).optional(),
	tags: z.union([z.string(), z.array(z.string())]).optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
});

/**
 * Esquema para validar filtros de notas
 */
export const noteFiltersSchema = z.object({
	search: z.string().optional().default(''),
	category: z.nativeEnum(NoteCategory).optional(),
	status: z.nativeEnum(NoteStatus).optional(),
	priority: z.nativeEnum(NotePriority).optional(),
	tags: z.array(z.string()).optional().default([]),
	onlyFavorites: z.boolean().optional().default(false),
	dateRange: z
		.object({
			from: z.date().nullable().optional(),
			to: z.date().nullable().optional(),
		})
		.optional(),
});

/**
 * Tipos inferidos desde los esquemas Zod
 */
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteFiltersInput = z.infer<typeof noteFiltersSchema>;
