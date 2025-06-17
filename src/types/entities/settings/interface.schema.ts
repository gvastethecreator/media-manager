// src/types/entities/settings/interface.schema.ts
// Esquema Zod para validar preferencias de interfaz
// 📏 Cumple lineamientos de validación y runtime safety

import { z } from 'zod';

/**
 * Esquema de validación para InterfacePreferences
 */
export const interfacePreferencesSchema = z
	.object({
		fontFamily: z.enum(['system', 'serif', 'mono', 'rounded']),
		fontSize: z.enum(['sm', 'md', 'lg']),
		theme: z.enum(['light', 'dark', 'system']),
		animations: z.boolean(),
		thumbnailsRespectAspectRatio: z.boolean(),
		thumbnailsBorderRadius: z.object({
			grid: z.number().min(0).max(32),
			card: z.number().min(0).max(32),
			mosaic: z.number().min(0).max(32),
		}),
		thumbnailsAnimations: z.boolean(),
		thumbnailsUltraPerformance: z.boolean(),
	})
	.passthrough(); // Permite flags futuros

export type InterfacePreferencesInput = z.input<typeof interfacePreferencesSchema>;
export type InterfacePreferencesOutput = z.output<typeof interfacePreferencesSchema>;
