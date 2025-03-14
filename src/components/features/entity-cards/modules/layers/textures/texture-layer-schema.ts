import { z } from 'zod';
import { baseLayerConfigSchema } from '@/lib/schemas/base-layer-config-schema';

// Esquema para el patrón de textura
export const texturePatternSchema = z.enum([
  'digital',
  'noise',
  'dots',
  'lines',
  'grid',
  'diagonal',
  'cross',
  'hexagon',
  'diamond',
  'wave',
  'custom'
]);

// Esquema para la configuración de textura
export const textureConfigSchema = baseLayerConfigSchema.extend({
  textureType: texturePatternSchema.default('digital'),
  opacity: z.number().min(0).max(1).default(0.5),
  scale: z.number().min(0.1).max(10).default(1),
  blendMode: z.enum([
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
    'exclusion'
  ]).default('overlay'),
  color: z.string().default('#ffffff'),
  secondaryColor: z.string().optional(),
  animated: z.boolean().default(false),
  animationSpeed: z.number().min(0).max(5).default(1),
  density: z.number().min(0).max(1).default(0.5),
  contrast: z.number().min(0).max(2).default(1),
  rotation: z.number().min(0).max(360).default(0),
  visibleOnHover: z.boolean().default(false),
  customPattern: z.string().optional(),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
  seamless: z.boolean().default(true),
});

// Tipo para la configuración de textura
export type TextureConfig = z.infer<typeof textureConfigSchema>;

// Esquema para la respuesta del servidor
export const textureConfigResponseSchema = z.object({
  success: z.boolean(),
  data: textureConfigSchema.optional(),
  error: z.string().optional(),
});

// Esquema para los parámetros de la entidad
export const entityParamsSchema = z.object({
  entityType: z.string(),
  entityId: z.string().optional(),
});

// Configuración por defecto para textura
export const defaultTextureConfig: TextureConfig = {
  enabled: true,
  layerIndex: 2,
  textureType: 'digital',
  opacity: 0.5,
  scale: 1,
  blendMode: 'overlay',
  color: '#ffffff',
  animated: false,
  animationSpeed: 1,
  density: 0.5,
  contrast: 1,
  rotation: 0,
  visibleOnHover: false,
  seamless: true,
};