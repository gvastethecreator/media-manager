import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

/**
 * 🎨 Tipos de glitch disponibles
 */
export const glitchTypeSchema = z.enum([
  'digital',    // Glitch digital clásico
  'analog',     // Glitch tipo VHS/analógico
  'rgb',        // Separación de canales RGB
  'slice',      // Cortes horizontales/verticales
  'corruption', // Corrupción de datos
]);

export type GlitchType = z.infer<typeof glitchTypeSchema>;

/**
 * 🎯 Configuración de zona de glitch
 */
export const glitchZoneSchema = z.object({
  type: z.enum(['horizontal', 'vertical', 'random']),
  position: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }).optional(),
  size: z.number().min(0).max(1),
  feather: z.number().min(0).max(1),
});

export type GlitchZone = z.infer<typeof glitchZoneSchema>;

/**
 * 🌈 Configuración de canales de color
 */
export const colorChannelSchema = z.object({
  offset: z.object({
    x: z.number().min(-1).max(1),
    y: z.number().min(-1).max(1),
  }),
  intensity: z.number().min(0).max(1),
});

export type ColorChannel = z.infer<typeof colorChannelSchema>;

/**
 * ⚡ Configuración de animación
 */
export const glitchAnimationSchema = z.object({
  frequency: z.number().min(0).max(10),
  duration: z.number().min(0).max(1000),
  randomness: z.number().min(0).max(1),
});

export type GlitchAnimation = z.infer<typeof glitchAnimationSchema>;

/**
 * ⚙️ Configuración completa de la capa de glitch
 */
export const glitchConfigSchema = layerBaseConfigSchema.extend({
  type: z.literal('glitch'),
  glitchType: glitchTypeSchema.default('digital'),
  intensity: z.number().min(0).max(1).default(0.5),
  seed: z.number().int().min(0).max(999999).default(0),
  zone: glitchZoneSchema.optional(),
  colorChannels: z.object({
    red: colorChannelSchema.optional(),
    green: colorChannelSchema.optional(),
    blue: colorChannelSchema.optional(),
  }).optional(),
  animation: glitchAnimationSchema.optional(),
  scanlines: z.boolean().default(false),
  noise: z.number().min(0).max(1).default(0),
  compression: z.number().min(0).max(1).default(0),
  timeOffset: z.number().default(0),
});

export type GlitchConfig = z.infer<typeof glitchConfigSchema>;

/**
 * 🎨 Configuración por defecto para la capa de glitch
 */
export function createDefaultGlitchConfig(): GlitchConfig {
  return {
    type: 'glitch',
    glitchType: 'digital',
    intensity: 0.5,
    seed: Math.floor(Math.random() * 1000000),
    scanlines: false,
    noise: 0.2,
    compression: 0.3,
    timeOffset: 0,
  };
}