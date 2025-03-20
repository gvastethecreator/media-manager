'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { create } from 'zustand';

// 🔄 Schema de configuración
export const distortionConfigSchema = z.object({
  enabled: z.boolean(),
  visibleOnHover: z.boolean(),
  intensity: z.number().min(0).max(1),
  glitchEffect: z.object({
    enabled: z.boolean(),
    visibleOnHover: z.boolean(),
    intensity: z.number().min(0).max(1),
    frequency: z.number().min(0).max(1),
    duration: z.number().min(0).max(5),
  }),
  chromaticAberration: z.object({
    enabled: z.boolean(),
    visibleOnHover: z.boolean(),
    intensity: z.number().min(0).max(1),
    offset: z.number().min(0).max(10),
  }),
  pixelate: z.object({
    enabled: z.boolean(),
    visibleOnHover: z.boolean(),
    intensity: z.number().min(0).max(1),
    blockSize: z.number().min(1).max(50),
  }),
  layerIndex: z.number().min(0).max(10),
});

// 📝 Tipo de configuración
export type DistortionConfig = z.infer<typeof distortionConfigSchema>;

// ⚙️ Configuración por defecto
const defaultConfig: DistortionConfig = {
  enabled: true,
  visibleOnHover: true,
  intensity: 0.5,
  glitchEffect: {
    enabled: true,
    visibleOnHover: true,
    intensity: 0.3,
    frequency: 0.05,
    duration: 0.2,
  },
  chromaticAberration: {
    enabled: true,
    visibleOnHover: true,
    intensity: 0.5,
    offset: 2,
  },
  pixelate: {
    enabled: true,
    visibleOnHover: true,
    intensity: 0.5,
    blockSize: 8,
  },
  layerIndex: 5,
};

// 🏪 Interface del store
interface DistortionStore {
  config: DistortionConfig;
  updateConfig: (config: Partial<DistortionConfig>) => void;
  resetConfig: () => void;
  toggleEnabled: () => void;
  toggleGlitch: () => void;
  toggleChromatic: () => void;
  togglePixelate: () => void;
  updateGlitch: (config: Partial<DistortionConfig['glitchEffect']>) => void;
  updateChromatic: (config: Partial<DistortionConfig['chromaticAberration']>) => void;
  updatePixelate: (config: Partial<DistortionConfig['pixelate']>) => void;
}

// 🎯 Crear store con Zustand
export const useDistortionStore = create<DistortionStore>((set) => ({
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

  toggleGlitch: () =>
    set((state) => ({
      config: {
        ...state.config,
        glitchEffect: {
          ...state.config.glitchEffect,
          enabled: !state.config.glitchEffect.enabled,
        },
      },
    })),

  toggleChromatic: () =>
    set((state) => ({
      config: {
        ...state.config,
        chromaticAberration: {
          ...state.config.chromaticAberration,
          enabled: !state.config.chromaticAberration.enabled,
        },
      },
    })),

  togglePixelate: () =>
    set((state) => ({
      config: {
        ...state.config,
        pixelate: {
          ...state.config.pixelate,
          enabled: !state.config.pixelate.enabled,
        },
      },
    })),

  updateGlitch: (glitchConfig) =>
    set((state) => ({
      config: {
        ...state.config,
        glitchEffect: {
          ...state.config.glitchEffect,
          ...glitchConfig,
        },
      },
    })),

  updateChromatic: (chromaticConfig) =>
    set((state) => ({
      config: {
        ...state.config,
        chromaticAberration: {
          ...state.config.chromaticAberration,
          ...chromaticConfig,
        },
      },
    })),

  updatePixelate: (pixelateConfig) =>
    set((state) => ({
      config: {
        ...state.config,
        pixelate: {
          ...state.config.pixelate,
          ...pixelateConfig,
        },
      },
    })),
}));

// 🌐 Server Actions
interface DistortionConfigResponse {
  success: boolean;
  message: string;
  data?: DistortionConfig;
}

export async function getDistortionConfig(
  entityType: string,
  entityId?: string
): Promise<DistortionConfigResponse> {
  try {
    const validation = distortionConfigSchema.safeParse({
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

    let config: DistortionConfig | null = null;

    if (entityId) {
      config = await prisma.layerDistortionConfig.findFirst({
        where: {
          entityType,
          entityId,
        },
      });
    }

    if (!config) {
      config = await prisma.layerDistortionConfig.findFirst({
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
      message: 'Configuración de distorsión obtenida correctamente',
      data: config as DistortionConfig,
    };
  } catch (error) {
    console.error('Error al obtener la configuración de distorsión:', error);
    return {
      success: false,
      message: 'Error al obtener la configuración de distorsión',
    };
  }
}

export async function updateDistortionConfig(
  entityType: string,
  config: DistortionConfig,
  entityId?: string
): Promise<DistortionConfigResponse> {
  try {
    const validation = distortionConfigSchema.safeParse({
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

    const updatedConfig = await prisma.layerDistortionConfig.upsert({
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
      message: 'Configuración de distorsión actualizada correctamente',
      data: updatedConfig as DistortionConfig,
    };
  } catch (error) {
    console.error('Error al actualizar la configuración de distorsión:', error);
    return {
      success: false,
      message: 'Error al actualizar la configuración de distorsión',
    };
  }
}

export async function deleteDistortionConfig(
  entityType: string,
  entityId?: string
): Promise<DistortionConfigResponse> {
  try {
    const validation = distortionConfigSchema.safeParse({
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

    await prisma.layerDistortionConfig.delete({
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
      message: 'Configuración de distorsión eliminada correctamente',
    };
  } catch (error) {
    console.error('Error al eliminar la configuración de distorsión:', error);
    return {
      success: false,
      message: 'Error al eliminar la configuración de distorsión',
    };
  }
}