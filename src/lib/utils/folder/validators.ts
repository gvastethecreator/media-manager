/**
 * @file Validadores Zod para la entidad Folder (delegan en esquemas canónicos)
 * @module utils/folder/validators
 */

import { z } from 'zod';
import {
	FolderBaseSchema as CanonicalFolderSchema,
	CreateFolderSchema as CanonicalCreateFolderSchema,
	UpdateFolderSchema as CanonicalUpdateFolderSchema,
} from '@/types/entities/folder/schema';

// Re-export con nombres legacy para compatibilidad local
export const folderBaseSchema = CanonicalFolderSchema;
export const createFolderSchema = CanonicalCreateFolderSchema;
export const updateFolderSchema = CanonicalUpdateFolderSchema;

// Campos específicos para actualizaciones parciales: mantener contrato existente
export const updateFolderFieldsSchema = z
	.object({
		name: z.literal(true),
		description: z.literal(true),
		path: z.literal(true),
		emoji: z.literal(true),
		color: z.literal(true),
		featuredImage: z.literal(true),
		totalFiles: z.literal(true),
		totalSize: z.literal(true),
		lastIndexed: z.literal(true),
		isFavorite: z.literal(true),
		presetId: z.literal(true),
	})
	.partial();

// Tipos inferidos preservando nombres
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
