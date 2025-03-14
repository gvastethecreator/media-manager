import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

/**
 * Tipos de algoritmos de pixelado disponibles
 */
export const pixelateAlgorithmSchema = z.enum([
	'simple', // Algoritmo básico de promediado
	'weighted', // Da más peso a los píxeles centrales
	'adaptive', // Varía el tamaño de píxel según el contenido
	'color', // Incluye reducción de colores
	'mosaic', // Usa formas geométricas en lugar de cuadrados
]);

export type PixelateAlgorithm = z.infer<typeof pixelateAlgorithmSchema>;

/**
 * Esquema para la configuración de la zona de efecto
 */
export const pixelateZoneSchema = z.object({
	enabled: z.boolean().default(false),
	centerX: z.number().min(0).max(1).default(0.5), // Posición X relativa (0-1)
	centerY: z.number().min(0).max(1).default(0.5), // Posición Y relativa (0-1)
	radius: z.number().min(0).max(1).default(0.5), // Radio relativo al tamaño máximo
	feather: z.number().min(0).max(1).default(0.2), // Suavizado del borde (0-1)
});

export type PixelateZone = z.infer<typeof pixelateZoneSchema>;

/**
 * Tipo de forma para el pixelado
 */
export const pixelShapeSchema = z.enum([
	'square', // Cuadrados (forma predeterminada)
	'circle', // Círculos
	'diamond', // Diamantes
	'hexagon', // Hexágonos
]);

export type PixelShape = z.infer<typeof pixelShapeSchema>;

/**
 * Esquema para los efectos de transición
 */
export const pixelateTransitionSchema = z.object({
	enabled: z.boolean().default(false),
	onEnter: z.boolean().default(true), // Aplicar al entrar en hover
	onExit: z.boolean().default(true), // Aplicar al salir del hover
	duration: z.number().min(0).max(5000).default(300), // Duración en ms
	easing: z.string().default('ease-out'), // Tipo de easing
});

export type PixelateTransition = z.infer<typeof pixelateTransitionSchema>;

/**
 * Esquema principal para la configuración de pixelado
 */
export const pixelateConfigSchema = layerBaseConfigSchema.extend({
	// Propiedades específicas del pixelado
	pixelSize: z.number().int().min(1).max(100).default(8),
	algorithm: pixelateAlgorithmSchema.default('simple'),
	intensity: z.number().min(0).max(10).default(1),

	// Reducción de colores (para algoritmo 'color')
	colorReduction: z.number().int().min(2).max(64).default(8),

	// Forma de los píxeles (para algoritmo 'mosaic')
	shape: pixelShapeSchema.default('square'),

	// Animación
	animated: z.boolean().default(false),
	animationSpeed: z.number().min(0.1).max(10).default(1),

	// Zona de efecto
	zone: pixelateZoneSchema.default({}),

	// Visibilidad condicional
	visibleOnHover: z.boolean().default(false),

	// Transiciones
	transition: pixelateTransitionSchema.default({}),

	// Preservar canal alfa
	preserveAlpha: z.boolean().default(true),

	// Modo de fusión con capas inferiores
	blendMode: z.string().default('normal'),
});

/**
 * Tipo para la configuración de pixelado
 */
export type PixelateConfig = z.infer<typeof pixelateConfigSchema>;

/**
 * Esquema para la respuesta del servidor
 */
export const pixelateConfigResponseSchema = z.object({
	success: z.boolean(),
	data: pixelateConfigSchema.optional(),
	error: z.string().optional(),
});

/**
 * Esquema para los parámetros de la entidad
 */
export const entityParamsSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
});

/**
 * Configuración por defecto para pixelado
 */
export function createDefaultPixelateConfig(): PixelateConfig {
	return {
		enabled: true,
		layerType: 'pixelate',
		layerIndex: 10,
		pixelSize: 8,
		algorithm: 'simple',
		intensity: 1,
		colorReduction: 8,
		shape: 'square',
		animated: false,
		animationSpeed: 1,
		zone: {
			enabled: false,
			centerX: 0.5,
			centerY: 0.5,
			radius: 0.5,
			feather: 0.2,
		},
		visibleOnHover: false,
		transition: {
			enabled: false,
			onEnter: true,
			onExit: true,
			duration: 300,
			easing: 'ease-out',
		},
		preserveAlpha: true,
		blendMode: 'normal',
	};
}
