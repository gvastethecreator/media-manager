import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

/**
 * 🎨 Tipos de filtros disponibles
 */
export const filterTypeSchema = z.enum([
	'basic', // Filtros básicos (brillo, contraste, etc.)
	'glow', // Efecto de resplandor
	'shadow', // Sombras
	'distortion', // Distorsión
	'blend', // Modos de fusión
]);

export type FilterType = z.infer<typeof filterTypeSchema>;

/**
 * 🌈 Configuración de filtros básicos
 */
export const basicFilterSchema = z.object({
	brightness: z.number().min(0).max(200).default(100),
	contrast: z.number().min(0).max(200).default(100),
	saturation: z.number().min(0).max(200).default(100),
	hueRotate: z.number().min(-180).max(180).default(0),
	blur: z.number().min(0).max(20).default(0),
	opacity: z.number().min(0).max(100).default(100),
});

/**
 * ✨ Configuración de resplandor
 */
export const glowFilterSchema = z.object({
	enabled: z.boolean().default(false),
	color: z.string().default('rgba(0, 0, 255, 0.3)'),
	radius: z.number().min(0).max(100).default(10),
	intensity: z.number().min(0).max(1).default(0.5),
	spread: z.number().min(0).max(100).default(0),
});

/**
 * 🌑 Configuración de sombra
 */
export const shadowFilterSchema = z.object({
	enabled: z.boolean().default(true),
	color: z.string().default('rgba(0, 0, 0, 0.3)'),
	blur: z.number().min(0).max(100).default(5),
	offsetX: z.number().min(-100).max(100).default(0),
	offsetY: z.number().min(-100).max(100).default(5),
	inset: z.boolean().default(false),
});

/**
 * 🌊 Configuración de distorsión
 */
export const distortionFilterSchema = z.object({
	enabled: z.boolean().default(false),
	type: z.enum(['wave', 'ripple', 'twist', 'bulge']).default('wave'),
	amount: z.number().min(0).max(100).default(5),
	speed: z.number().min(0).max(10).default(1),
	animated: z.boolean().default(false),
});

/**
 * 🎭 Configuración de modo de fusión
 */
export const blendModeSchema = z
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
	.default('normal');

/**
 * ⚙️ Configuración completa de la capa de filtros
 */
export const filterConfigSchema = layerBaseConfigSchema.extend({
	type: z.literal('filter'),
	filterType: filterTypeSchema.default('basic'),
	basic: basicFilterSchema.default({}),
	glow: glowFilterSchema.optional(),
	shadow: shadowFilterSchema.optional(),
	distortion: distortionFilterSchema.optional(),
	blendMode: blendModeSchema,
});

export type FilterConfig = z.infer<typeof filterConfigSchema>;

/**
 * 🎨 Configuración por defecto para la capa de filtros
 */
export function createDefaultFilterConfig(): FilterConfig {
	return {
		type: 'filter',
		filterType: 'basic',
		basic: {
			brightness: 100,
			contrast: 100,
			saturation: 100,
			hueRotate: 0,
			blur: 0,
			opacity: 100,
		},
		shadow: {
			enabled: true,
			color: 'rgba(0, 0, 0, 0.3)',
			blur: 5,
			offsetX: 0,
			offsetY: 5,
			inset: false,
		},
		blendMode: 'normal',
	};
}
