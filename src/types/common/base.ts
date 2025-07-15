import { z } from 'zod';

export const BaseEntitySchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
