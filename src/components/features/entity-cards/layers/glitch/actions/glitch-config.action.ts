'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { create } from 'zustand';

// Schema de configuración
export const glitchConfigSchema = z.object({
  enabled: z.boolean(),
  intensity: z.number().min(0).max(1),
  frequency: z.number().min(0).max(10),
  animated: z.boolean(),
  speed: z.number().min(0).max(10),
  colorShift: z.boolean(),
  colorShiftAmount: z.number().min(0).max(1),
  scanlines: z.boolean(),
  scanlinesCount: z.number().min(0).max(100),
  scanlinesOpacity: z.number().min(0).max(1),
  noise: z.boolean(),
  noiseIntensity: z.number().min(0).max(1),
  distortion: z.boolean(),
  distortionAmount: z.number().min(0).max(1),
  chromatic: z.boolean(),
  chromaticOffset: z.number().min(0).max(50),
  blend: z.enum(['normal', 'overlay', 'multiply', 'screen', 'color-dodge']),
  seed: z.number().int().min(0),
  layerIndex: z.number().min(0),
});

// Tipo de configuración
export type GlitchConfig = z.infer<typeof glitchConfigSchema>;

// Configuración por defecto
const defaultConfig: GlitchConfig = {
  enabled: true,
  intensity: 0.5,
  frequency: 2,
  animated: true,
  speed: 1,
  colorShift: true,
  colorShiftAmount: 0.3,
  scanlines: true,
  scanlinesCount: 50,
  scanlinesOpacity: 0.3,
  noise: true,
  noiseIntensity: 0.2,
  distortion: true,
  distortionAmount: 0.3,
  chromatic: true,
  chromaticOffset: 2,
  blend: 'screen',
  seed: 42,
  layerIndex: 7,
};

// Interface del store
interface GlitchStore {
  config: GlitchConfig;
  updateConfig: (config: Partial<GlitchConfig>) => void;
  resetConfig: () => void;
  toggleEnabled: () => void;
  toggleAnimated: () => void;
  toggleColorShift: () => void;
  toggleScanlines: () => void;
  toggleNoise: () => void;
  toggleDistortion: () => void;
  toggleChromatic: () => void;
}

// Crear store con Zustand
export const useGlitchStore = create<GlitchStore>((set) => ({
  config: defaultConfig,

  updateConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),

  resetConfig: () => set({ config: defaultConfig }),

  toggleEnabled: () =>
    set((state) => ({
      config: { ...state.config, enabled: !state.config.enabled },
    })),

  toggleAnimated: () =>
    set((state) => ({
      config: { ...state.config, animated: !state.config.animated },
    })),

  toggleColorShift: () =>
    set((state) => ({
      config: { ...state.config, colorShift: !state.config.colorShift },
    })),

  toggleScanlines: () =>
    set((state) => ({
      config: { ...state.config, scanlines: !state.config.scanlines },
    })),

  toggleNoise: () =>
    set((state) => ({
      config: { ...state.config, noise: !state.config.noise },
    })),

  toggleDistortion: () =>
    set((state) => ({
      config: { ...state.config, distortion: !state.config.distortion },
    })),

  toggleChromatic: () =>
    set((state) => ({
      config: { ...state.config, chromatic: !state.config.chromatic },
    })),
}));

interface GlitchConfigResponse {
  success: boolean;
  message: string;
  data?: GlitchConfig;
}

export async function getGlitchConfig(entityType: string, entityId?: string): Promise<GlitchConfigResponse> {
  try {
    const validation = glitchConfigSchema.safeParse({
      entityType,
      entityId,
      config: {},
    });

    if (!validation.success) {
      return {
        success: false,
        message: 'Parámetros inválidos',
      };
    }

    let config: GlitchConfig | null = null;

    if (entityId) {
      config = await prisma.layerGlitchConfig.findFirst({
        where: {
          entityType,
          entityId,
        },
      });
    }

    if (!config) {
      config = await prisma.layerGlitchConfig.findFirst({
        where: {
          entityType,
          isDefault: true,
        },
      });
    }

    if (!config) {
      return {
        success: true,
        message: 'Usando configuración por defecto',
        data: defaultConfig,
      };
    }

    return {
      success: true,
      message: 'Configuración de glitch obtenida correctamente',
      data: config as GlitchConfig,
    };
  } catch (error) {
    console.error('Error al obtener la configuración de glitch:', error);
    return {
      success: false,
      message: 'Error al obtener la configuración de glitch',
    };
  }
}

export async function updateGlitchConfig(
  entityType: string,
  config: GlitchConfig,
  entityId?: string
): Promise<GlitchConfigResponse> {
  try {
    const validation = glitchConfigSchema.safeParse({
      entityType,
      entityId,
      config,
    });

    if (!validation.success) {
      return {
        success: false,
        message: 'Parámetros inválidos',
      };
    }

    const updatedConfig = await prisma.layerGlitchConfig.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId: entityId || 'default',
        },
      },
      update: {
        ...config,
        isDefault: !entityId,
      },
      create: {
        entityType,
        entityId: entityId || 'default',
        isDefault: !entityId,
        ...config,
      },
    });

    revalidatePath('/settings');
    revalidatePath(`/${entityType}`);
    if (entityId) {
      revalidatePath(`/${entityType}/${entityId}`);
    }

    return {
      success: true,
      message: 'Configuración de glitch actualizada correctamente',
      data: updatedConfig as GlitchConfig,
    };
  } catch (error) {
    console.error('Error al actualizar la configuración de glitch:', error);
    return {
      success: false,
      message: 'Error al actualizar la configuración de glitch',
    };
  }
}

export async function deleteGlitchConfig(entityType: string, entityId?: string): Promise<GlitchConfigResponse> {
  try {
    const validation = glitchConfigSchema.safeParse({
      entityType,
      entityId,
      config: {},
    });

    if (!validation.success) {
      return {
        success: false,
        message: 'Parámetros inválidos',
      };
    }

    await prisma.layerGlitchConfig.delete({
      where: {
        entityType_entityId: {
          entityType,
          entityId: entityId || 'default',
        },
      },
    });

    revalidatePath('/settings');
    revalidatePath(`/${entityType}`);
    if (entityId) {
      revalidatePath(`/${entityType}/${entityId}`);
    }

    return {
      success: true,
      message: 'Configuración de glitch eliminada correctamente',
    };
  } catch (error) {
    console.error('Error al eliminar la configuración de glitch:', error);
    return {
      success: false,
      message: 'Error al eliminar la configuración de glitch',
    };
  }
}