'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Importar el esquema y los tipos desde el archivo de configuración del cliente
import {
	imageConfigSchema,
	type ImageConfig
} from '../image-config.action';

// Configuración por defecto para usar en las funciones del servidor
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

/**
 * Obtiene la configuración de la capa de imagen para una entidad específica
 */
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

/**
 * Actualiza la configuración de la capa de imagen para una entidad específica
 */
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

/**
 * Elimina la configuración de la capa de imagen para una entidad específica
 */
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