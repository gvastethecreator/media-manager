import { z } from 'zod';

/**
 * Esquema base para la configuración de cualquier capa
 */
export const layerBaseConfigSchema = z.object({
  /**
   * Si la capa está habilitada
   */
  enabled: z.boolean().default(true),

  /**
   * Índice de orden de la capa (menor = más abajo en la pila)
   */
  layerIndex: z.number().int().min(0).default(0),

  /**
   * Opacidad de la capa (0-1)
   */
  opacity: z.number().min(0).max(1).default(1),

  /**
   * Si la capa solo debe ser visible al pasar el cursor
   */
  visibleOnHover: z.boolean().optional(),
});

/**
 * Tipo base para la configuración de capas
 */
export interface BaseLayerConfig {
  enabled: boolean;
  layerIndex: number;
  opacity?: number;
  visibleOnHover?: boolean;
  [key: string]: unknown;
}

/**
 * Esquema para respuestas del servidor
 */
export const baseLayerResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

/**
 * Tipos de respuesta del servidor
 */
export type BaseLayerResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * 🎨 Modos de mezcla disponibles como union type
 */
export const blendModeUnion = z.enum([
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
]);

export type BlendMode = z.infer<typeof blendModeUnion>;

/**
 * 🔄 Esquema para configuración global de capas
 */
export const layerSystemConfigSchema = z.object({
  order: z.array(z.string()).default([]),
  explodeView: z.boolean().default(false),
  explodeDistance: z.number().default(10),
  layerBlending: z.string().default('normal'),
  layerSpacing: z.number().default(2),
});

export type LayerSystemConfig = z.infer<typeof layerSystemConfigSchema>;