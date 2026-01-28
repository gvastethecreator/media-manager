import { z } from 'zod';

export const CreateAlbumSchema = z.object({
	name: z.string().min(1, 'El nombre es obligatorio'),
	emoji: z.string().default('📸'),
	color: z
		.string()
		.refine(
			(val) => /^#[0-9A-Fa-f]{6}$/.test(val) || val.startsWith('var(--'),
			'Color debe ser un valor hexadecimal o una variable CSS válida'
		)
		.default('var(--entity-album)'),
	description: z.string().optional(),
	shortcut: z.string().optional(),
	category: z.string().optional(),
	sortBy: z.string().default('name'),
	filters: z.string().default('[]'),
	featuredImage: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

export const UpdateAlbumSchema = z.object({
	name: z.string().min(1).optional(),
	emoji: z.string().optional(),
	color: z.string().optional(),
	description: z.string().optional(),
	shortcut: z.string().optional(),
	category: z.string().optional(),
	sortBy: z.string().optional(),
	filters: z.string().optional(),
	featuredImage: z.string().optional(),
	isFavorite: z.boolean().optional(),
});
