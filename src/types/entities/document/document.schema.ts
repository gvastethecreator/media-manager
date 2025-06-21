import { z } from 'zod';

export const documentSchema = z.object({
	id: z.string().cuid(),
	name: z.string().min(1),
	filePath: z.string().min(1),
	content: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
