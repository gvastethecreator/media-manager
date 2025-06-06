'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { FolderExtendedComplete } from '@/types/entities/folder';

// Logger específico para acciones de FolderCard
const folderCardLogger = serverLogger.withContext('FolderCardActions');

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Obtiene las imágenes recientes de una carpeta especificada por su ID.
 * @param folderId El ID de la carpeta de la que se quieren obtener las imágenes.
 * @param limit El número máximo de imágenes a devolver.
 * @returns Un array de objetos que representan las imágenes recientes con sus URL de miniatura.
 */
export async function getRecentFolderImages(folderId: string, limit = 4) {
	try {
		// Verificar que el ID es válido
		if (!folderId || folderId.trim() === '') {
			folderCardLogger.warn('⚠️ Solicitud de imágenes sin ID de carpeta válido');
			return [];
		}

		const prisma = await getPrismaClient();

		// Verificar que la carpeta existe
		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			select: { id: true },
		});

		if (!folder) {
			folderCardLogger.warn(`⚠️ Carpeta no encontrada para imágenes: ${folderId}`);
			return [];
		}

		// Obtener las imágenes más recientes asociadas a esta carpeta
		const images = await prisma.image.findMany({
			where: {
				folderId: folderId,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: limit,
			select: {
				id: true,
				// thumbnail: true, // ⚠️ Eliminado para no cargar los datos binarios aquí
			},
		});

		// Transformar a formato requerido - ahora solo construimos la URL
		return images.map((image) => ({
			id: image.id,
			thumbnailUrl: `/api/images/${image.id}/thumbnail`, // Usar la URL de la API
		}));
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo imágenes recientes de carpeta:', error);
		return [];
	}
}

/**
 * Obtiene estadísticas detalladas de una carpeta.
 * @param folderId El ID de la carpeta de la que se quieren obtener las estadísticas.
 * @returns Un objeto con las estadísticas de la carpeta o null si no se encuentra.
 */
export async function getFolderStats(folderId?: string) {
	try {
		// Verificar que el ID es válido (manejo explícito de undefined)
		if (!folderId || folderId.trim() === '') {
			folderCardLogger.debug('ℹ️ Solicitud de estadísticas sin ID de carpeta');
			return null; // Retornar null silenciosamente sin error
		}

		folderCardLogger.info(`📂 Obteniendo estadísticas de carpeta: ${folderId}`);
		const prisma = await getPrismaClient();

		// Obtener información básica de la carpeta
		const folder = await prisma.folder.findUnique({
			where: {
				id: folderId,
			},
			select: {
				id: true,
				name: true,
				description: true,
				path: true,
				emoji: true,
				color: true,
				featuredImage: true,
				isFavorite: true,
				totalFiles: true,
				totalSize: true,
				autoReindex: true,
				lastIndexed: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!folder) {
			folderCardLogger.warn(`⚠️ Carpeta no encontrada: ${folderId}`);
			return null; // Usar null en lugar de notFound() para manejo más flexible
		}

		// Contar subcarpetas
		const childrenCount = await prisma.folder.count({
			where: {
				path: {
					startsWith: `${folder.path}/`,
				},
			},
		});

		// Obtener URLs de imágenes recientes para mostrar en la tarjeta
		const recentImages = await prisma.image.findMany({
			where: {
				folderId: folderId,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			take: 4,
			select: {
				thumbnail: true,
			},
		});

		// Extraer solo las URLs de las imágenes
		const imageUrls = recentImages.map((img) =>
			img.thumbnail ? `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}` : ''
		);

		// Devolver la carpeta con estadísticas adicionales
		folderCardLogger.info('✅ Estadísticas de carpeta obtenidas correctamente');
		return {
			...folder,
			childrenCount,
			recentImageUrls: imageUrls,
		};
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo estadísticas de carpeta:', error);
		return null;
	}
}

/**
 * Genera un color secundario basado en el color primario de la carpeta.
 * Útil para crear gradientes y efectos visuales en las cartas de carpetas.
 * @param primaryColor El color primario de la carpeta en formato hexadecimal.
 * @returns Un color secundario derivado del primario.
 */
export async function generateSecondaryColor(primaryColor: string): Promise<string> {
	// Validar el formato del color
	if (!primaryColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(primaryColor)) {
		return '#6366f1'; // Devolver un color predeterminado si el formato no es válido
	}

	// Convertir el color hexadecimal a componentes RGB
	let r = Number.parseInt(primaryColor.slice(1, 3), 16);
	let g = Number.parseInt(primaryColor.slice(3, 5), 16);
	let b = Number.parseInt(primaryColor.slice(5, 7), 16);

	// Aplicar un ajuste para crear un color secundario
	// Método: Desplazar los componentes para crear un color complementario suave
	r = (r + 30) % 255;
	g = (g + 50) % 255;
	b = (b + 70) % 255;

	// Convertir de nuevo a formato hexadecimal
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Obtiene una carpeta completa con todas sus relaciones para la tarjeta
 * @param folderId ID de la carpeta
 * @returns Objeto completo de carpeta con relaciones
 */
export async function getFolderForCard(folderId?: string): Promise<FolderExtendedComplete | null> {
	try {
		// Verificar que el ID es válido (manejo explícito de undefined)
		if (!folderId || folderId.trim() === '') {
			folderCardLogger.debug('ℹ️ Solicitud de carpeta sin ID válido');
			return null;
		}

		folderCardLogger.info(`📁 Obteniendo carpeta completa para FolderCard: ${folderId}`);
		const prisma = await getPrismaClient();

		// Obtener la carpeta con todas sus relaciones relevantes
		const folder = await prisma.folder.findUnique({
			where: {
				id: folderId,
			},
			include: {
				_count: {
					select: {
						children: true,
						images: true,
						videos: true,
					},
				},
			},
		});

		if (!folder) {
			folderCardLogger.warn(`⚠️ Carpeta no encontrada: ${folderId}`);
			return null;
		}

		folderCardLogger.info('✅ Carpeta obtenida para FolderCard');

		// Convertir a tipo FolderExtendedComplete
		return folder as unknown as FolderExtendedComplete;
	} catch (error) {
		folderCardLogger.error('❌ Error obteniendo carpeta completa para FolderCard:', error);
		return null;
	}
}
