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
export const createFolderSchema = folderBaseSchema.pick({
	name: true,
	path: true,
	description: true,
	parentId: true,
	emoji: true,
	color: true,
	presetId: true,
});

/**
 * Esquema para validar datos de actualización de carpetas
 */
export const updateFolderSchema = folderBaseSchema
	.pick({
		name: true,
		description: true,
		emoji: true,
		color: true,
		isFavorite: true,
		autoReindex: true,
		presetId: true,
	})
	.partial();

/**
 * Esquema para validar configuración visual de carpetas
 */
export const folderVisualConfigSchema = z.object({
	id: z.string().cuid().optional(),
	enable3DEffect: z.boolean().default(true),
	enableHolographicEffect: z.boolean().default(true),
	enableGlowEffect: z.boolean().default(true),
	enableAnimatedBorder: z.boolean().default(true),
	enableLightHalo: z.boolean().default(true),
	designSystem: z.string().nullish(),
	layerSystem: z.string().nullish(),
	effects: z.string().nullish(),
	performance: z.string().nullish(),
	states: z.string().nullish(),
	presetId: z.string().nullish(),
});

/**
 * Tipo inferido para datos de creación de carpetas
 */
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

/**
 * Tipo inferido para datos de actualización de carpetas
 */
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

/**
 * Tipo inferido para configuración visual de carpetas
 */
export type FolderVisualConfigInput = z.infer<typeof folderVisualConfigSchema>;
