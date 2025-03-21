'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema para validar los parámetros de la acción
const updateLayerConfigSchema = z.object({
  cardId: z.string(),
  layerId: z.string(),
  configData: z.record(z.unknown()),
  layerType: z.string(),
});

export type UpdateLayerConfigParams = z.infer<typeof updateLayerConfigSchema>;

/**
 * 🔄 Actualiza la configuración de una capa específica
 *
 * Esta acción del servidor es un punto centralizado para actualizar cualquier tipo
 * de capa en el sistema. Recibe el ID de la tarjeta, el ID de la capa, los datos
 * de configuración y el tipo de capa.
 */
export async function updateLayerConfig({
  cardId,
  layerId,
  configData,
  layerType,
}: UpdateLayerConfigParams) {
  try {
    // Validar los datos de entrada
    const validatedData = updateLayerConfigSchema.parse({
      cardId,
      layerId,
      configData,
      layerType,
    });

    // Obtener la configuración actual (si existe)
    const existingConfig = await prisma.layerConfig.findUnique({
      where: {
        cardId_layerId: {
          cardId: validatedData.cardId,
          layerId: validatedData.layerId,
        },
      },
    });

    // Combinar la configuración existente con los nuevos datos
    const mergedConfig = existingConfig
      ? { ...existingConfig.config, ...validatedData.configData }
      : validatedData.configData;

    // Actualizar o crear la configuración en la base de datos
    await prisma.layerConfig.upsert({
      where: {
        cardId_layerId: {
          cardId: validatedData.cardId,
          layerId: validatedData.layerId,
        },
      },
      update: {
        config: mergedConfig,
        layerType: validatedData.layerType,
      },
      create: {
        cardId: validatedData.cardId,
        layerId: validatedData.layerId,
        layerType: validatedData.layerType,
        config: mergedConfig,
      },
    });

    // Invalidar las rutas relacionadas para refrescar los datos
    revalidatePath(`/cards/${validatedData.cardId}`);
    revalidatePath(`/cards/${validatedData.cardId}/edit`);
    revalidatePath(`/dashboard`);

    // Devolver respuesta exitosa
    return {
      success: true,
      data: mergedConfig,
    };
  } catch (error) {
    console.error('Error al actualizar la configuración de la capa:', error);

    // Devolver respuesta de error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}