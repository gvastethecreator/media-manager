import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

/**
 * Tipos de algoritmos de pixelado disponibles
 */
export const pixelateAlgorithmSchema = z.enum([
	'simple', // Algoritmo básico de promediado
	'weighted', // Da más peso a los píxeles centrales
	'adaptive', // Varía el tamaño de píxel según el contenido
]);

export type PixelateAlgorithm = z.infer<typeof pixelateAlgorithmSchema>;

/**
 * Esquema para la configuración de zona de efecto
 */
export const pixelateZoneSchema = z.object({
	enabled: z.boolean().default(false),
	centerX: z.number().min(0).max(1).default(0.5),
	centerY: z.number().min(0).max(1).default(0.5),
	radius: z.number().min(0).max(1).default(0.5),
	feather: z.number().min(0).max(1).default(0.2),
});

export type PixelateZone = z.infer<typeof pixelateZoneSchema>;

/**
 * Esquema para la configuración de transiciones
 */
export const pixelateTransitionSchema = z.object({
	enabled: z.boolean().default(false),
	duration: z.number().min(0).max(2000).default(300),
	easing: z.string().default('ease-out'),
});

export type PixelateTransition = z.infer<typeof pixelateTransitionSchema>;

/**
 * Esquema principal para la configuración de pixelado
 */
export const pixelateConfigSchema = layerBaseConfigSchema.extend({
	// Propiedades específicas del pixelado
	pixelSize: z.number().int().min(1).max(100).default(8),
	algorithm: pixelateAlgorithmSchema.default('simple'),
	colorReduction: z.boolean().default(false),
	colorLevels: z.number().int().min(2).max(256).default(32),

	// Configuración de zona y transiciones
	zone: pixelateZoneSchema.default({}),
	transition: pixelateTransitionSchema.default({}),
});

export type PixelateConfig = z.infer<typeof pixelateConfigSchema>;

/**
 * Configuración por defecto para pixelado
 */
export function createDefaultPixelateConfig(): PixelateConfig {
	return {
		enabled: true,
		layerType: 'pixelate',
		layerIndex: 10,
		opacity: 1,
		blendMode: 'normal',
		visibleOnHover: false,
		pixelSize: 8,
		algorithm: 'simple',
		colorReduction: false,
		colorLevels: 32,
		zone: {
			enabled: false,
			centerX: 0.5,
			centerY: 0.5,
			radius: 0.5,
			feather: 0.2,
		},
		transition: {
			enabled: false,
			duration: 300,
			easing: 'ease-out',
		},
	};
}
