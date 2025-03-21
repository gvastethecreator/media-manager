import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

/**
 * 💨 Esquema de configuración para capas de desenfoque
 * Define las propiedades específicas para efectos de desenfoque.
 */

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

// Esquema para configuración de zona
const zoneSchema = z.object({
  type: z.enum(['circle', 'rectangle', 'ellipse', 'custom']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  rotation: z.number(),
  feather: z.number(),
  invert: z.boolean(),
});

// Esquema para configuración de movimiento
const motionSchema = z.object({
  angle: z.number(),
  distance: z.number(),
});

// Esquema para la configuración de desenfoque
export const blurConfigSchema = layerBaseConfigSchema.extend({
  radius: z.number().min(0).max(100).default(5),
  algorithm: z.enum(['gaussian', 'box', 'motion', 'radial', 'zoom']).default('gaussian'),
  quality: z.number().int().min(1).max(3).default(2),
  preserveEdges: z.boolean().default(false),
  edgeThreshold: z.number().min(0).max(100).default(10),
  animated: z.boolean().default(false),
  animationSpeed: z.number().min(0.1).max(10).default(1),
  zone: zoneSchema.default({
    type: 'circle',
    position: { x: 0.5, y: 0.5 },
    size: { width: 0.5, height: 0.5 },
    rotation: 0,
    feather: 0.1,
    invert: false,
  }),
  motion: motionSchema.default({
    angle: 45,
    distance: 20,
  }),
});

// Tipos inferidos del esquema
export type Zone = z.infer<typeof zoneSchema>;
export type Motion = z.infer<typeof motionSchema>;
export type BlurConfig = z.infer<typeof blurConfigSchema>;

// Configuración predeterminada
export const defaultBlurConfig: BlurConfig = {
  enabled: true,
  layerType: 'blur',
  layerIndex: 10,
  opacity: 0.8,
  blendMode: 'normal',
  visibleOnHover: false,
  radius: 5,
  algorithm: 'gaussian',
  quality: 2,
  preserveEdges: false,
  edgeThreshold: 10,
  animated: false,
  animationSpeed: 1,
  zone: {
    type: 'circle',
    position: { x: 0.5, y: 0.5 },
    size: { width: 0.5, height: 0.5 },
    rotation: 0,
    feather: 0.1,
    invert: false,
  },
  motion: {
    angle: 45,
    distance: 20,
  },
};