'use client';

import { z } from 'zod';

// Esquema para la configuración de patrones
export const patternConfigSchema = z.object({
	enabled: z.boolean().default(true),
	patternType: z.enum(['dots', 'lines', 'grid', 'hexagon']).default('dots'),
	color: z.string().default('rgba(255, 255, 255, 0.15)'),
	secondaryColor: z.string().optional(),
	opacity: z.number().min(0).max(1).default(0.15),
	size: z.number().min(1).max(100).default(5),
	spacing: z.number().min(1).max(100).default(10),
	rotation: z.number().min(0).max(360).default(0),
	visibleOnHover: z.boolean().optional().default(false),
	animated: z.boolean().optional().default(false),
	animationSpeed: z.number().min(0).max(10).optional().default(1),
	blendMode: z.enum(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten']).optional().default('normal'),
	density: z.number().min(0.1).max(10).optional().default(1),
	strokeWidth: z.number().min(0).max(10).optional().default(1),
	layerIndex: z.number().int().min(0).default(2),
});

export type PatternConfig = z.infer<typeof patternConfigSchema>;

// Configuración por defecto
export const defaultPatternConfig: PatternConfig = {
	enabled: true,
	patternType: 'dots',
	color: 'rgba(255, 255, 255, 0.15)',
	opacity: 0.15,
	size: 5,
	spacing: 10,
	rotation: 0,
	visibleOnHover: false,
	animated: false,
	animationSpeed: 1,
	blendMode: 'normal',
	density: 1,
	strokeWidth: 1,
	layerIndex: 2,
};
