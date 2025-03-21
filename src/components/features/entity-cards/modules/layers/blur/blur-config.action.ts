'use server';

import { z } from 'zod';
import { updateLayerConfig } from '../actions';
import { blurConfigSchema } from './blur-schema';

// Las validaciones deben usar el esquema de Zod
const blurConfigActionSchema = z.object({
    cardId: z.string(),
    layerId: z.string(),
    config: blurConfigSchema.partial(),
});

export type BlurConfigActionParams = z.infer<typeof blurConfigActionSchema>;

/**
 * 🔄 Actualiza la configuración de la capa de desenfoque
 */
export async function updateBlurConfig({
    cardId,
    layerId,
    config,
}: BlurConfigActionParams) {
    // Validar los datos de entrada
    const validatedData = blurConfigActionSchema.parse({
        cardId,
        layerId,
        config,
    });

    // Enviar al servicio general de actualización de capas
    return updateLayerConfig({
        cardId: validatedData.cardId,
        layerId: validatedData.layerId,
        configData: validatedData.config,
        layerType: 'blur',
    });
}