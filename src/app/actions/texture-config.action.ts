'use server';

import { prisma } from '@/lib/prisma';
import {
  entityParamsSchema,
  textureConfigResponseSchema,
  textureConfigSchema,
  type TextureConfig
} from '@/components/features/entity-cards/layers/textures/texture-layer-schema';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene la configuración de textura para una entidad específica
 */
export async function getTextureConfig(entityType: string, entityId?: string) {
  try {
    // Validar los parámetros de entrada
    const validationResult = entityParamsSchema.safeParse({ entityType, entityId });
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Parámetros de entidad inválidos',
      };
    }

    // Buscar configuración existente
    const existingConfig = await prisma.layerConfig.findFirst({
      where: {
        entityType,
        entityId: entityId || null,
        type: 'texture',
      },
    });

    // Si existe, parsear y devolver
    if (existingConfig?.config) {
      const configData = JSON.parse(existingConfig.config as string) as TextureConfig;
      return {
        success: true,
        data: configData,
      };
    }

    // Si no existe, devolver configuración por defecto
    return {
      success: true,
      data: {
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
      },
    };
  } catch (error) {
    console.error('Error al obtener la configuración de textura:', error);
    return {
      success: false,
      error: 'Error al obtener la configuración',
    };
  }
}

/**
 * Actualiza la configuración de textura para una entidad específica
 */
export async function updateTextureConfig(entityType: string, config: TextureConfig, entityId?: string) {
  try {
    // Validar los parámetros de entrada
    const paramsValidation = entityParamsSchema.safeParse({ entityType, entityId });
    if (!paramsValidation.success) {
      return {
        success: false,
        error: 'Parámetros de entidad inválidos',
      };
    }

    // Validar la configuración
    const configValidation = textureConfigSchema.safeParse(config);
    if (!configValidation.success) {
      return {
        success: false,
        error: 'Configuración de textura inválida',
      };
    }

    // Actualizar o crear la configuración
    await prisma.layerConfig.upsert({
      where: {
        entityType_entityId_type: {
          entityType,
          entityId: entityId || null,
          type: 'texture',
        },
      },
      update: {
        config: JSON.stringify(config),
        updatedAt: new Date(),
      },
      create: {
        entityType,
        entityId: entityId || null,
        type: 'texture',
        config: JSON.stringify(config),
      },
    });

    // Revalidar rutas para aplicar cambios inmediatamente
    revalidatePath(`/entities/${entityType}`);
    if (entityId) {
      revalidatePath(`/entities/${entityType}/${entityId}`);
    }

    return {
      success: true,
      data: config,
    };
  } catch (error) {
    console.error('Error al actualizar la configuración de textura:', error);
    return {
      success: false,
      error: 'Error al guardar la configuración',
    };
  }
}

/**
 * Elimina la configuración de textura para una entidad específica
 */
export async function deleteTextureConfig(entityType: string, entityId?: string) {
  try {
    // Validar los parámetros de entrada
    const validationResult = entityParamsSchema.safeParse({ entityType, entityId });
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Parámetros de entidad inválidos',
      };
    }

    // Eliminar la configuración
    await prisma.layerConfig.delete({
      where: {
        entityType_entityId_type: {
          entityType,
          entityId: entityId || null,
          type: 'texture',
        },
      },
    });

    // Revalidar rutas para aplicar cambios inmediatamente
    revalidatePath(`/entities/${entityType}`);
    if (entityId) {
      revalidatePath(`/entities/${entityType}/${entityId}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error al eliminar la configuración de textura:', error);
    return {
      success: false,
      error: 'Error al eliminar la configuración',
    };
  }
}