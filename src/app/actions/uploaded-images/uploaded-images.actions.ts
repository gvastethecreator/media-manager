'use server';

import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { logger } from '@/lib/logger/logger';
import { uploadedImagesService } from '@/services/uploaded-images.service';
import type { UploadedImageType } from '@/types/entities/entities';
import type { UploadedImageFilters } from '@/types/uploaded-images';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

const actionLogger = logger.withContext('ServerAction:UploadedImages');
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';

/**
 * Sube una o varias imágenes al servidor
 */
export async function uploadImages(formData: FormData) {
	try {
		const files = formData.getAll('files') as File[];
		const type = (formData.get('type') as UploadedImageType) || 'thumbnail';
		const category = (formData.get('category') as string) || 'user';

		if (!files || files.length === 0) {
			return {
				success: false,
				error: 'No se proporcionaron archivos',
			};
		}

		// Aseguramos que exista el directorio de uploads
		try {
			await mkdir(UPLOADS_DIR, { recursive: true });
		} catch (_) {
			// Ignoramos el error si el directorio ya existe
		}

		const results = [];

		for (const file of files) {
			if (!file.type.startsWith('image/')) {
				results.push({
					name: file.name,
					error: 'El archivo no es una imagen válida',
					success: false,
				});
				continue;
			}

			// Generamos un ID único para el archivo
			const fileId = uuidv4();
			const fileExt = path.extname(file.name) || '.jpg';
			const fileName = `${fileId}${fileExt}`;
			const filePath = path.join(UPLOADS_DIR, fileName);

			// Convertimos el archivo a un ArrayBuffer y luego a un Buffer
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Guardamos el archivo localmente
			await writeFile(filePath, buffer);

			// Obtenemos las dimensiones de la imagen
			const dimensions = {
				width: 800, // Valores por defecto
				height: 600,
				aspectRatio: 800 / 600,
			};

			// Creamos el registro en la base de datos
			try {
				const imageRecord = await uploadedImagesService.createImage({
					name: file.name,
					type,
					category,
					file: {
						path: filePath,
						size: file.size,
					},
					dimensions,
					metadata: {
						originalName: file.name,
						mimeType: file.type,
					},
				});

				results.push({
					id: imageRecord.id,
					name: imageRecord.name,
					path: imageRecord.path,
					url: imageRecord.url,
					success: true,
				});
			} catch (err) {
				actionLogger.error('Error al crear registro de imagen:', err);
				results.push({
					name: file.name,
					error: 'Error al procesar la imagen',
					success: false,
				});
			}
		}

		// Revalidamos las rutas relevantes
		revalidatePath('/uploads');
		revalidatePath('/settings');

		return {
			success: true,
			items: results,
		};
	} catch (error) {
		actionLogger.error('Error al procesar imágenes subidas:', error);
		return {
			success: false,
			error: 'Error al procesar la solicitud',
		};
	}
}

/**
 * Obtiene la lista de imágenes subidas con filtros opcionales
 */
export async function getUploadedImages(filters?: UploadedImageFilters) {
	try {
		const result = await uploadedImagesService.getImages({
			filters,
			includeDimensions: true,
			includeThumbnails: true,
		});

		return {
			success: true,
			...result,
		};
	} catch (error) {
		actionLogger.error('Error al obtener imágenes subidas:', error);
		return {
			success: false,
			error: 'Error al obtener las imágenes',
			items: [],
			total: 0,
			page: 1,
			pageSize: 20,
			stats: {
				total: 0,
				byType: {},
				totalSize: 0,
				averageSize: 0,
			},
		};
	}
}

/**
 * Elimina una imagen subida
 */
export async function deleteUploadedImage(id: string) {
	try {
		await uploadedImagesService.deleteImage(id);

		// Revalidamos las rutas relevantes
		revalidatePath('/uploads');
		revalidatePath('/settings');

		return {
			success: true,
		};
	} catch (error) {
		actionLogger.error('Error al eliminar imagen:', error);
		return {
			success: false,
			error: 'Error al eliminar la imagen',
		};
	}
}

/**
 * Obtiene estadísticas de imágenes subidas
 */
export async function getUploadedImageStats() {
	try {
		const stats = await uploadedImagesService.getImageStats();

		return {
			success: true,
			stats,
		};
	} catch (error) {
		actionLogger.error('Error al obtener estadísticas de imágenes:', error);
		return {
			success: false,
			error: 'Error al obtener estadísticas',
			stats: {
				total: 0,
				byType: {},
				totalSize: 0,
				averageSize: 0,
			},
		};
	}
}
