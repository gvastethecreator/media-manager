import { z } from 'zod';

export const audioSchema = z.object({
	id: z.string().cuid(),
	name: z.string().min(1),
	filePath: z.string().min(1),
	format: z.string().min(2),
	duration: z.number().int().positive().optional(),
	size: z.number().int().nonnegative(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
