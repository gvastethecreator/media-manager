import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { serverLogger } from '@/lib/logger/server-logger';
import { uploadedImagesService } from '@/services/uploaded-images';
import type { UploadedImageType } from '@/types/entities/uploaded-image';
import type { UploadedImageFilters } from '@/types/uploaded-images';

const serviceLogger = serverLogger.withContext('UploadedImagesApiService');
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'public/uploads';

/**
 * Sube una o varias imágenes al servidor
 */
export async function uploadImages(formData: FormData) {
	serviceLogger.info('Iniciando carga de imágenes');
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

			// Obtenemos las dimensiones de la imagen (valores por defecto, se pueden mejorar con sharp)
			const dimensions = {
				width: 800,
				height: 600,
				aspectRatio: 800 / 600,
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

				results.push({
					id: imageRecord.id,
					name: imageRecord.name,
					path: imageRecord.path,
					success: true,
				});
			} catch (err) {
				serviceLogger.error('Error al crear registro de imagen:', err);
				results.push({
					name: file.name,
					error: 'Error al procesar la imagen',
					success: false,
				});
			}
		}

		return {
			success: true,
			items: results,
		};
	} catch (error) {
		serviceLogger.error('Error al procesar imágenes subidas:', error);
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
	serviceLogger.info('Obteniendo imágenes subidas', { filters });
	try {
		const result = await uploadedImagesService.getImages({
			filters,
			includeDimensions: true,
			includeThumbnails: true,
		});

		// Asegurar que todos los datos son serializables (especialmente thumbnails)
		const safeResult = _ensureSerializable(result);

		return {
			success: true,
			...safeResult,
		};
	} catch (error) {
		serviceLogger.error('Error al obtener imágenes subidas:', error);
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
	serviceLogger.info('Eliminando imagen subida:', { id });
	try {
		await uploadedImagesService.deleteImage(id);

		return {
			success: true,
		};
	} catch (error) {
		serviceLogger.error('Error al eliminar imagen:', error);
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
	serviceLogger.info('Obteniendo estadísticas de imágenes subidas');
	try {
		const stats = await uploadedImagesService.getImageStats();

		return {
			success: true,
			stats,
		};
	} catch (error) {
		serviceLogger.error('Error al obtener estadísticas de imágenes:', error);
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
 * Obtiene una imagen subida por su ID
 */
export async function getUploadedImage(id: string) {
	serviceLogger.info('Obteniendo imagen subida por ID:', { id });
	try {
		const image = await uploadedImagesService.getImage(id);
		if (!image) {
			return { success: false, error: 'Imagen subida no encontrada' };
		}
		const safeResult = _ensureSerializable(image);
		return { success: true, item: safeResult };
	} catch (error) {
		serviceLogger.error('Error al obtener imagen subida por ID:', error);
		return { success: false, error: 'Error al obtener la imagen' };
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
			serviceLogger.error('❌ Error convirtiendo binario a base64:', error);
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
