import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

/**
 * 🎨 Tipos de ruido disponibles
 */
export const noiseTypeSchema = z.enum([
	'perlin', // Ruido Perlin clásico
	'simplex', // Ruido Simplex (más eficiente)
	'value', // Ruido de valor (más simple)
	'worley', // Ruido celular/Voronoi
	'fractal', // Ruido fractal (FBM)
]);

export type NoiseType = z.infer<typeof noiseTypeSchema>;

/**
 * 🌈 Modos de color para el ruido
 */
export const noiseColorModeSchema = z.enum([
	'monochrome', // Escala de grises
	'rgb', // Canales RGB independientes
	'hsl', // Variación en espacio HSL
]);

export type NoiseColorMode = z.infer<typeof noiseColorModeSchema>;

/**
 * 🎯 Configuración de zona de ruido
 */
export const noiseZoneSchema = z.object({
	type: z.enum(['circle', 'rectangle']),
	center: z
		.object({
			x: z.number().min(0).max(1),
			y: z.number().min(0).max(1),
		})
		.optional(),
	radius: z.number().min(0).max(1).optional(),
	position: z
		.object({
			x: z.number().min(0).max(1),
			y: z.number().min(0).max(1),
		})
		.optional(),
	size: z
		.object({
			width: z.number().min(0).max(1),
			height: z.number().min(0).max(1),
		})
		.optional(),
	feather: z.number().min(0).max(1),
});

export type NoiseZone = z.infer<typeof noiseZoneSchema>;

/**
 * 📊 Configuración de fractal
 */
export const fractalConfigSchema = z.object({
	octaves: z.number().int().min(1).max(8),
	persistence: z.number().min(0).max(1),
	lacunarity: z.number().min(1).max(4),
});

export type FractalConfig = z.infer<typeof fractalConfigSchema>;

/**
 * ⚙️ Configuración completa de la capa de ruido
 */
export const noiseConfigSchema = layerBaseConfigSchema.extend({
	type: z.literal('noise'),
	noiseType: noiseTypeSchema.default('perlin'),
	scale: z.number().min(1).max(100).default(10),
	intensity: z.number().min(0).max(1).default(0.5),
	colorMode: noiseColorModeSchema.default('monochrome'),
	seed: z.number().int().min(0).max(999999).default(0),
	zone: noiseZoneSchema.optional(),
	fractalConfig: fractalConfigSchema.optional(),
	animated: z.boolean().default(false),
	animationSpeed: z.number().min(0.1).max(5).default(1),
	timeOffset: z.number().default(0),
});

export type NoiseConfig = z.infer<typeof noiseConfigSchema>;

/**
 * 🎨 Configuración por defecto para la capa de ruido
 */
export function createDefaultNoiseConfig(): NoiseConfig {
	return {
		type: 'noise',
		noiseType: 'perlin',
		scale: 10,
		intensity: 0.5,
		colorMode: 'monochrome',
		seed: Math.floor(Math.random() * 1000000),
		animated: false,
		animationSpeed: 1,
		timeOffset: 0,
	};
}
