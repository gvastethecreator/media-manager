'use server';

import { z } from 'zod';
import { revalidatePath } from '@/lib/server/revalidate';

/**
 * Esquema de validación para actualizar metadatos de una imagen
 */
const updateMetadataSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	alt: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

type UpdateMetadataInput = z.infer<typeof updateMetadataSchema>;

/**
 * Actualiza los metadatos de una imagen
 * @param imageId ID de la imagen
 * @param data Datos a actualizar
 */
export async function updateImageMetadata(imageId: string, data: UpdateMetadataInput) {
	try {
		// Validar datos de entrada
		const validatedData = updateMetadataSchema.parse(data);

		// Simulación de actualización (reemplazar con la implementación real)
		console.log(`Actualizando metadatos para imagen ${imageId}:`, validatedData);

		// Esperar un poco para simular la operación
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Revalidar la ruta para actualizar la UI
		revalidatePath('/');

		return { success: true };
	} catch (error) {
		console.error('Error al actualizar metadatos:', error);
		return { success: false, error };
	}
}

/**
 * Actualiza los metadatos de múltiples imágenes
 * @param imageIds IDs de las imágenes
 * @param data Datos a actualizar
 */
export async function updateMultipleImagesMetadata(imageIds: string[], data: UpdateMetadataInput) {
	try {
		// Validar datos de entrada
		const validatedData = updateMetadataSchema.parse(data);

		// Simulación de actualización masiva (reemplazar con la implementación real)
		console.log(`Actualizando metadatos para ${imageIds.length} imágenes:`, validatedData);

		// Esperar un poco para simular la operación
		await new Promise((resolve) => setTimeout(resolve, 800));

		// Revalidar la ruta para actualizar la UI
		revalidatePath('/');

		return { success: true, count: imageIds.length };
	} catch (error) {
		console.error('Error al actualizar metadatos en masa:', error);
		return { success: false, error };
	}
}
