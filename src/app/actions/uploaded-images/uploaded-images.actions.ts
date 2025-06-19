'use server';

import { mkdir, writeFile } from 'fs/promises';
import { revalidatePath } from 'next/cache';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { serverLogger } from '@/lib/logger/server-logger';
import { uploadedImagesService } from '@/services/uploaded-images';
import { UploadedImageCreateInput, UploadedImageType } from '@/types/entities/uploaded-image';
import type { UploadedImageFilters } from '@/types/uploaded-images';

const actionLogger = serverLogger.withContext('ServerAction:UploadedImages');
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

			// Preparamos los datos de entrada usando los tipos del transformer
			const _imageData: UploadedImageCreateInput = {
				name: file.name,
				path: filePath,
				type,
				category,
				size: file.size,
				width: dimensions.width,
				height: dimensions.height,
				metadata: JSON.stringify({
					originalName: file.name,
					mimeType: file.type,
				}),
				uploadedAt: new Date(),
			};

			try {
				// Creamos el registro en la base de datos usando el service
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

				// El service ya usa el transformer, solo agregamos el resultado
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
 * 🔒 Garantiza que cualquier dato binario (Uint8Array/Buffer) en thumbnails sea convertido a string
 * @param data Datos que pueden contener binarios
 * @returns Datos seguros para serialización
 */
function ensureThumbnailsAreStrings(data: any): any {
	// Si es null o no es objeto
	if (!data || typeof data !== 'object') return data;

	// Si es array
	if (Array.isArray(data)) {
		return data.map((item) => ensureThumbnailsAreStrings(item));
	}

	// Si es un Uint8Array/Buffer
	if (data instanceof Uint8Array || (typeof Buffer !== 'undefined' && data instanceof Buffer)) {
		try {
			return `data:image/webp;base64,${Buffer.from(data).toString('base64')}`;
		} catch (_e) {
			return null;
		}
	}

	// Para objetos normales
	const result = { ...data };
	for (const key in result) {
		if (Object.hasOwn(result, key)) {
			// Si la clave parece un thumbnail y es binario
			if (
				(key === 'thumbnail' || key.includes('thumbnail')) &&
				(result[key] instanceof Uint8Array || (typeof Buffer !== 'undefined' && result[key] instanceof Buffer))
			) {
				try {
					const mimeType = result.thumbnailMimeType || 'image/webp';
					result[key] = `data:${mimeType};base64,${Buffer.from(result[key]).toString('base64')}`;
				} catch (_e) {
					result[key] = null;
				}
			} else {
				result[key] = ensureThumbnailsAreStrings(result[key]);
			}
		}
	}
	return result;
}

/**
 * Obtiene la lista de imágenes subidas con filtros opcionales
 */
export async function getUploadedImages(filters?: UploadedImageFilters) {
	try {
		// El service ya usa el transformer, solo pasamos los parámetros y devolvemos el resultado
		const result = await uploadedImagesService.getImages({
			filters,
			includeDimensions: true,
			includeThumbnails: true,
		});

		// 🛡️ Asegurar que todos los datos son serializables (especialmente thumbnails)
		const safeResult = ensureThumbnailsAreStrings(result);

		// Validación de seguridad: intentar serializar para detectar problemas
		try {
			JSON.parse(JSON.stringify(safeResult));
		} catch (jsonError) {
			actionLogger.error('❌ Error de serialización en getUploadedImages:', jsonError);
			// Si falla, intentar una versión más segura eliminando thumbnails
			const fallbackResult = {
				...safeResult,
				items: safeResult.items.map((item: any) => ({
					...item,
					thumbnail: null, // Eliminar thumbnails problemáticos
				})),
			};
			return {
				success: true,
				...fallbackResult,
			};
		}

		return {
			success: true,
			...safeResult,
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

/**
 * 🔒 Garantiza que cualquier objeto con datos binarios sea serializable
 * Convierte todos los Uint8Array/Buffer a string (URL o base64) de forma recursiva
 * @param obj Objeto que puede contener datos binarios no serializables
 * @returns Objeto seguro para serialización
 */
function _ensureSerializable<T>(obj: T): T {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (typeof obj !== 'object') {
		return obj;
	}

	// Si es un Uint8Array o Buffer, convertirlo a base64
	if (obj instanceof Uint8Array || (typeof Buffer !== 'undefined' && obj instanceof Buffer)) {
		try {
			const buffer = Buffer.from(obj);
			return `data:image/webp;base64,${buffer.toString('base64')}` as unknown as T;
		} catch (error) {
			actionLogger.error('❌ Error convirtiendo binario a base64:', error);
			return '' as unknown as T;
		}
	}

	// Si es un array, procesar cada elemento
	if (Array.isArray(obj)) {
		return obj.map((item) => _ensureSerializable(item)) as unknown as T;
	}

	// Para objetos normales (no Date, RegExp, etc.)
	if (
		obj &&
		typeof obj === 'object' &&
		!(obj instanceof Date) &&
		!(obj instanceof RegExp) &&
		!(obj instanceof Map) &&
		!(obj instanceof Set)
	) {
		// Crear copia para no modificar el original
		const result = { ...obj } as Record<string, any>;

		// Procesar cada propiedad recursivamente
		for (const key in result) {
			if (Object.hasOwn(result, key)) {
				result[key] = _ensureSerializable(result[key]);
			}
		}

		return result as unknown as T;
	}

	return obj;
}
