import { z } from 'zod';

// Schema base para la configuración visual
export const baseVisualConfigSchema = z.object({
  enable3DEffect: z.boolean().default(true),
  designSystem: z.object({
    preset: z.string().default('modern'),
    cornerStyle: z.string().default('rounded'),
    elevation: z.number().default(2),
  }).default({
    preset: 'modern',
    cornerStyle: 'rounded',
    elevation: 2,
  }),
  enableHolographicEffect: z.boolean().default(true),
  enableGlowEffect: z.boolean().default(true),
  enableAnimatedBorder: z.boolean().default(true),
  enableLightHalo: z.boolean().default(true),
  layerSystem: z.object({
    order: z.array(z.string()).default(['background', 'content', 'effects', 'holographic', 'border', 'filter']),
    layerBlending: z.string().default('screen'),
    layerSpacing: z.number().default(2),
  }).default({
    order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
    layerBlending: 'screen',
    layerSpacing: 2,
  }),
  effects: z.object({
    shadow: z.object({
      enabled: z.boolean().default(true),
      color: z.string().default('rgba(0,0,0,0.2)'),
      blur: z.number().default(10),
      spread: z.number().default(5),
    }).default({
      enabled: true,
      color: 'rgba(0,0,0,0.2)',
      blur: 10,
      spread: 5,
    }),
    reflection: z.object({
      enabled: z.boolean().default(true),
      opacity: z.number().default(0.1),
      blur: z.number().default(2),
    }).default({
      enabled: true,
      opacity: 0.1,
      blur: 2,
    }),
    parallax: z.object({
      enabled: z.boolean().default(true),
      intensity: z.number().default(0.1),
      perspective: z.number().default(1000),
    }).default({
      enabled: true,
      intensity: 0.1,
      perspective: 1000,
    }),
  }).default({
    shadow: {
      enabled: true,
      color: 'rgba(0,0,0,0.2)',
      blur: 10,
      spread: 5,
    },
    reflection: {
      enabled: true,
      opacity: 0.1,
      blur: 2,
    },
    parallax: {
      enabled: true,
      intensity: 0.1,
      perspective: 1000,
    },
  }),
  performance: z.object({
    enableHardwareAcceleration: z.boolean().default(true),
    useRAF: z.boolean().default(true),
    batchUpdates: z.boolean().default(true),
    throttleMs: z.number().default(16),
  }).default({
    enableHardwareAcceleration: true,
    useRAF: true,
    batchUpdates: true,
    throttleMs: 16,
  }),
  states: z.object({
    hover: z.object({
      scale: z.number().default(1.02),
      rotate: z.boolean().default(true),
      lift: z.boolean().default(true),
      duration: z.number().default(200),
      easing: z.string().default('cubic-bezier(0.4,0,0.2,1)'),
    }).default({
      scale: 1.02,
      rotate: true,
      lift: true,
      duration: 200,
      easing: 'cubic-bezier(0.4,0,0.2,1)',
    }),
    active: z.object({
      scale: z.number().default(0.98),
      brightness: z.number().default(0.95),
    }).default({
      scale: 0.98,
      brightness: 0.95,
    }),
    disabled: z.object({
      opacity: z.number().default(0.5),
      grayscale: z.boolean().default(true),
    }).default({
      opacity: 0.5,
      grayscale: true,
    }),
  }).default({
    hover: {
      scale: 1.02,
      rotate: true,
      lift: true,
      duration: 200,
      easing: 'cubic-bezier(0.4,0,0.2,1)',
    },
    active: {
      scale: 0.98,
      brightness: 0.95,
    },
    disabled: {
      opacity: 0.5,
      grayscale: true,
    },
  }),
});

// Schema para la validación de parámetros de entidad
export const entityParamsSchema = z.object({
  entityType: z.string(),
  entityId: z.string().optional(),
});

// Schema para la respuesta de las acciones
export const actionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
});

// Tipos inferidos
export type BaseVisualConfig = z.infer<typeof baseVisualConfigSchema>;
export type EntityParams = z.infer<typeof entityParamsSchema>;
export type ActionResponse = z.infer<typeof actionResponseSchema>;