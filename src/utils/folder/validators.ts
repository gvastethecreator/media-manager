/**
 * @file Validadores Zod para la entidad Folder
 * @module utils/folder/validators
 */

import { FOLDER_DEFAULT_COLORS, FOLDER_DEFAULT_EMOJIS } from '@/types/entities/folder';
import { z } from 'zod';

/**
 * Esquema para validar campos básicos de Folder
 */
export const folderBaseSchema = z.object({
	id: z.string().cuid().optional(),
	name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
	description: z.string().max(2000, 'La descripción es demasiado larga').nullish(),
	path: z.string().min(1, 'La ruta es obligatoria'),
	parentId: z.string().cuid().nullish(),
	emoji: z.string().max(10, 'El emoji debe ser más corto').default(FOLDER_DEFAULT_EMOJIS.DEFAULT),
	color: z
		.string()
		.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color inválido')
		.default(FOLDER_DEFAULT_COLORS.DEFAULT),
	isFavorite: z.boolean().default(false),
	autoReindex: z.boolean().default(false),
	presetId: z.string().nullish(),
});

/**
 * Esquema para validar datos de creación de carpetas
 */
export const createFolderSchema = z.object({
	name: z.string().min(1, 'El nombre es obligatorio').max(255, 'El nombre es demasiado largo'),
	description: z.string().max(1000, 'La descripción es demasiado larga').nullish(),
	path: z.string().min(1, 'La ruta es obligatoria'),
	emoji: z.string().nullish(),
	color: z.string().nullish(),
	featuredImage: z.string().nullish(),
	isFavorite: z.boolean().default(false),
	autoReindex: z.boolean().default(false),
	parentId: z.string().nullish(),
	presetId: z.string().nullish(),
});

/**
 * Esquema para validar datos de actualización de carpetas
 */
export const updateFolderSchema = createFolderSchema
	.extend({
		totalFiles: z.number().int().positive().optional(),
		totalSize: z.number().int().positive().optional(),
	})
	.partial()
	.refine(
		(data) => {
			return Object.keys(data).length > 0;
		},
		{
			message: 'Al menos un campo debe ser actualizado',
			path: ['_errors'],
		}
	);

/**
 * Esquema para validar campos específicos en actualización de carpetas
 */
export const updateFolderFieldsSchema = z
	.object({
		name: true,
		description: true,
		path: true,
		emoji: true,
		color: true,
		featuredImage: true,
		totalFiles: true,
		totalSize: true,
		lastIndexed: true,
		isFavorite: true,
		autoReindex: true,
		presetId: true,
	})
	.partial();

/**
 * Tipo inferido para datos de creación de carpetas
 */
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

/**
 * Tipo inferido para datos de actualización de carpetas
 */
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
