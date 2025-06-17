import { z } from 'zod';

export const jsonFileSchema = z.object({
	id: z.string().cuid(),
	name: z.string().min(1),
	filePath: z.string().min(1),
	content: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
