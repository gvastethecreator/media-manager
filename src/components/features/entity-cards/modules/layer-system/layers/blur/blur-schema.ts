import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

/**
 * Tipos de algoritmos de desenfoque disponibles
 */
export const blurAlgorithmSchema = z.enum([
  'gaussian', // Desenfoque gaussiano suave
  'box', // Desenfoque de caja simple
  'motion', // Desenfoque de movimiento direccional
  'radial', // Desenfoque radial desde un punto
  'zoom', // Desenfoque de zoom desde el centro
]);

export type BlurAlgorithm = z.infer<typeof blurAlgorithmSchema>;

/**
 * Esquema para la configuración de zona de efecto
 */
export const blurZoneSchema = z.object({
  enabled: z.boolean().default(false),
  centerX: z.number().min(0).max(1).default(0.5),
  centerY: z.number().min(0).max(1).default(0.5),
  radius: z.number().min(0).max(1).default(0.5),
  feather: z.number().min(0).max(1).default(0.2),
});

export type BlurZone = z.infer<typeof blurZoneSchema>;

/**
 * Esquema para la configuración de movimiento
 */
export const blurMotionSchema = z.object({
  angle: z.number().min(0).max(360).default(0),
  distance: z.number().min(0).max(100).default(20),
});

export type BlurMotion = z.infer<typeof blurMotionSchema>;

/**
 * Esquema principal para la configuración de desenfoque
 */
export const blurConfigSchema = layerBaseConfigSchema.extend({
  // Propiedades específicas del desenfoque
  radius: z.number().min(0).max(100).default(10),
  algorithm: blurAlgorithmSchema.default('gaussian'),
  quality: z.number().int().min(1).max(3).default(2),

  // Configuración de zona
  zone: blurZoneSchema.default({}),

  // Configuración de movimiento (para motion blur)
  motion: blurMotionSchema.default({}),

  // Preservar bordes
  preserveEdges: z.boolean().default(false),
  edgeThreshold: z.number().min(0).max(1).default(0.1),

  // Animación
  animated: z.boolean().default(false),
  animationSpeed: z.number().min(0.1).max(10).default(1),
});

export type BlurConfig = z.infer<typeof blurConfigSchema>;

/**
 * Configuración por defecto para desenfoque
 */
export function createDefaultBlurConfig(): BlurConfig {
  return {
    enabled: true,
    layerType: 'blur',
    layerIndex: 5,
    opacity: 1,
    blendMode: 'normal',
    visibleOnHover: false,
    radius: 10,
    algorithm: 'gaussian',
    quality: 2,
    zone: {
      enabled: false,
      centerX: 0.5,
      centerY: 0.5,
      radius: 0.5,
      feather: 0.2,
    },
    motion: {
      angle: 0,
      distance: 20,
    },
    preserveEdges: false,
    edgeThreshold: 0.1,
    animated: false,
    animationSpeed: 1,
  };
}