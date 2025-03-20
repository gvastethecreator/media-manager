'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { create } from 'zustand';

// 🎨 Esquema de configuración de la capa de imagen
export const imageConfigSchema = z.object({
  enabled: z.boolean().default(true),
  layerIndex: z.number().min(0).max(10).default(10),
  objectFit: z.enum(['cover', 'contain', 'fill', 'none']).default('cover'),
  aspectRatio: z.enum(['1/1', '4/3', '3/4', '16/9', 'auto']).default('3/4'),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
  blur: z.number().min(0).max(10).default(0),
  grayscale: z.number().min(0).max(100).default(0),
  brightness: z.number().min(50).max(150).default(100),
  contrast: z.number().min(50).max(150).default(100),
  saturate: z.number().min(0).max(200).default(100),
  loading: z.enum(['eager', 'lazy']).default('lazy'),
  placeholder: z.enum(['blur', 'empty', 'shimmer']).default('shimmer'),
  accessibility: z.object({
    alt: z.string().optional(),
    description: z.string().optional(),
  }).default({}),
  visibleOnHover: z.boolean().default(false),
});

// 📝 Tipo de configuración inferido del esquema
export type ImageConfig = z.infer<typeof imageConfigSchema>;

// 🏭 Configuración por defecto
const defaultConfig: ImageConfig = {
  enabled: true,
  layerIndex: 10,
  objectFit: 'cover',
  aspectRatio: '3/4',
  borderRadius: 'md',
  blur: 0,
  grayscale: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  loading: 'lazy',
  placeholder: 'shimmer',
  accessibility: {},
  visibleOnHover: false,
};

// 🏪 Interfaz del store
interface ImageStore {
  config: ImageConfig;
  updateConfig: (config: Partial<ImageConfig>) => void;
  resetConfig: () => void;
  toggleEnabled: () => void;
  toggleVisibleOnHover: () => void;
  updateBlur: (value: number) => void;
  updateGrayscale: (value: number) => void;
  updateBrightness: (value: number) => void;
  updateContrast: (value: number) => void;
  updateSaturate: (value: number) => void;
  updateObjectFit: (value: ImageConfig['objectFit']) => void;
  updateAspectRatio: (value: ImageConfig['aspectRatio']) => void;
  updateBorderRadius: (value: ImageConfig['borderRadius']) => void;
  updateLoading: (value: ImageConfig['loading']) => void;
  updatePlaceholder: (value: ImageConfig['placeholder']) => void;
  updateAccessibility: (value: Partial<ImageConfig['accessibility']>) => void;
}

// 🎯 Creación del store
export const useImageStore = create<ImageStore>((set) => ({
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
  toggleVisibleOnHover: () =>
    set((state) => ({
      config: { ...state.config, visibleOnHover: !state.config.visibleOnHover },
    })),
  updateBlur: (value) =>
    set((state) => ({
      config: { ...state.config, blur: value },
    })),
  updateGrayscale: (value) =>
    set((state) => ({
      config: { ...state.config, grayscale: value },
    })),
  updateBrightness: (value) =>
    set((state) => ({
      config: { ...state.config, brightness: value },
    })),
  updateContrast: (value) =>
    set((state) => ({
      config: { ...state.config, contrast: value },
    })),
  updateSaturate: (value) =>
    set((state) => ({
      config: { ...state.config, saturate: value },
    })),
  updateObjectFit: (value) =>
    set((state) => ({
      config: { ...state.config, objectFit: value },
    })),
  updateAspectRatio: (value) =>
    set((state) => ({
      config: { ...state.config, aspectRatio: value },
    })),
  updateBorderRadius: (value) =>
    set((state) => ({
      config: { ...state.config, borderRadius: value },
    })),
  updateLoading: (value) =>
    set((state) => ({
      config: { ...state.config, loading: value },
    })),
  updatePlaceholder: (value) =>
    set((state) => ({
      config: { ...state.config, placeholder: value },
    })),
  updateAccessibility: (value) =>
    set((state) => ({
      config: {
        ...state.config,
        accessibility: { ...state.config.accessibility, ...value },
      },
    })),
}));

// 🔄 Funciones del servidor
export async function getImageConfig(entityType: string, entityId: string) {
  try {
    const config = await prisma.layerConfig.findUnique({
      where: {
        entityType_entityId_layerType: {
          entityType,
          entityId,
          layerType: 'image',
        },
      },
    });

    if (!config) {
      return defaultConfig;
    }

    const parsedConfig = imageConfigSchema.safeParse(config.config);
    return parsedConfig.success ? parsedConfig.data : defaultConfig;
  } catch (error) {
    console.error('Error al obtener la configuración de imagen:', error);
    return defaultConfig;
  }
}

export async function updateImageConfig(
  entityType: string,
  entityId: string,
  config: Partial<ImageConfig>
) {
  try {
    const currentConfig = await getImageConfig(entityType, entityId);
    const newConfig = { ...currentConfig, ...config };
    const validatedConfig = imageConfigSchema.parse(newConfig);

    await prisma.layerConfig.upsert({
      where: {
        entityType_entityId_layerType: {
          entityType,
          entityId,
          layerType: 'image',
        },
      },
      update: {
        config: validatedConfig,
      },
      create: {
        entityType,
        entityId,
        layerType: 'image',
        config: validatedConfig,
      },
    });

    revalidatePath(`/settings/${entityType}/${entityId}`);
    revalidatePath(`/${entityType}/${entityId}`);

    return validatedConfig;
  } catch (error) {
    console.error('Error al actualizar la configuración de imagen:', error);
    throw error;
  }
}

export async function deleteImageConfig(entityType: string, entityId: string) {
  try {
    await prisma.layerConfig.delete({
      where: {
        entityType_entityId_layerType: {
          entityType,
          entityId,
          layerType: 'image',
        },
      },
    });

    revalidatePath(`/settings/${entityType}/${entityId}`);
    revalidatePath(`/${entityType}/${entityId}`);
  } catch (error) {
    console.error('Error al eliminar la configuración de imagen:', error);
    throw error;
  }
}