/**
 * @file Esquema de validación para la entidad Folder
 * @module types/entities/folder/schema
 */
import { z } from 'zod';

export const FolderSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, 'El nombre es requerido.'),
	description: z.string().nullable().optional(),
	path: z.string().min(1, 'La ruta es requerida.'),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().default(false),
	autoReindex: z.boolean().default(true),
	totalFiles: z.number().int().min(0).default(0),
	totalSize: z.number().int().min(0).default(0),
	lastIndexed: z.date().nullable().optional(),
	parentId: z.string().uuid().nullable().optional(),
	presetId: z.string().uuid().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CreateFolderSchema = FolderSchema.pick({
	name: true,
	path: true,
	description: true,
	emoji: true,
	color: true,
	autoReindex: true,
	parentId: true,
	presetId: true,
});

export const UpdateFolderSchema = CreateFolderSchema.partial();
