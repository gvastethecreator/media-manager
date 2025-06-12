/**
 * 🏷️ Tipo base para Metadata, solo campos canónicos y serializables
 */
export interface MetadataBase {
	id: string;
	imageId: string;
	format: string;
	width: number;
	height: number;
	size: number;
	colorSpace?: string;
	hasAlpha?: boolean;
	orientation?: number;
	createdAt: Date;
	updatedAt: Date;
}

// Esquema Zod para validación
import { z } from 'zod';
export const metadataBaseSchema = z.object({
	id: z.string().uuid(),
	imageId: z.string().uuid(),
	format: z.string(),
	width: z.number().positive(),
	height: z.number().positive(),
	size: z.number().nonnegative(),
	colorSpace: z.string().optional(),
	hasAlpha: z.boolean().optional(),
	orientation: z.number().min(1).max(8).optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ✅ MetadataBase ahora es seguro y serializable para frontend/backend.
