/**
 * Esquema base para la configuración de capas
 * Este archivo define la estructura común que comparten todas las capas
 */

import { z } from 'zod';

// Esquema básico para todas las configuraciones de capas
export const layerBaseConfigSchema = z.object({
	// Propiedades comunes para todas las capas
	enabled: z.boolean().default(true),
	layerIndex: z.number().int().min(0).default(0),
	opacity: z.number().min(0).max(1).default(1),
	blendMode: z
		.enum([
			'normal',
			'multiply',
			'screen',
			'overlay',
			'darken',
			'lighten',
			'color-dodge',
			'color-burn',
			'hard-light',
			'soft-light',
			'difference',
			'exclusion',
			'hue',
			'saturation',
			'color',
			'luminosity',
		])
		.default('normal'),
	visibleOnHover: z.boolean().default(false),
	scale: z.number().default(1),
	rotation: z.number().default(0),
	translateX: z.number().default(0),
	translateY: z.number().default(0),
});

// Tipo para la configuración base de capa
export type LayerBaseConfig = z.infer<typeof layerBaseConfigSchema>;

// Extensión para capas que admiten animación
export const animatedLayerSchema = layerBaseConfigSchema.extend({
	animated: z.boolean().default(false),
	animationSpeed: z.number().min(0).max(10).default(1),
	animationType: z.enum(['none', 'pulse', 'flow', 'blink', 'wave']).default('none'),
});

// Tipo para capas con animación
export type AnimatedLayerConfig = z.infer<typeof animatedLayerSchema>;
