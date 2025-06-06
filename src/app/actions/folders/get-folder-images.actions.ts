'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { FileItem, FileProcessingStatus, FileType } from '@/types/file-item';
import type { MediaMetadata } from '@/types/metadata.types';
import type { EntityId, JSONString } from '@/utils/types/utility-types';
import path from 'path';

const logger = serverLogger.withContext('get-folder-images');

/**
 * Obtiene todas las imágenes de una carpeta específica
 * @param folderId ID de la carpeta
 * @returns Array de objetos FileItem con la información de las imágenes
 */
export async function getFolderImages(folderId: string): Promise<FileItem[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes de la carpeta ${folderId}`);

		// Verificar que el ID es válido
		if (!folderId || folderId.trim() === '') {
			logger.warn('⚠️ ID de carpeta inválido');
			return [];
		}

		// Verificar si la carpeta existe
		const folderExists = await prisma.folder.findUnique({
			where: { id: folderId },
			select: { id: true, name: true, path: true },
		});

		if (!folderExists) {
			logger.warn(`⚠️ Carpeta con ID ${folderId} no encontrada`);
			return [];
		}

		logger.debug(`📂 Carpeta encontrada: ${folderExists.name} (${folderExists.path})`);

		// Obtener imágenes de la carpeta
		const images = await prisma.image.findMany({
			where: {
				folderId: folderId,
			},
			select: {
				id: true,
				name: true,
				path: true,
				size: true,
				width: true,
				height: true,
				// metadata: true, // ⚠️ Temporal: Excluido para reducir la carga útil y diagnosticar cuelgues
				thumbnailSize: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				createdAt: true,
				updatedAt: true,
				// tags: { // ⚠️ Temporal: Excluido para reducir la carga útil y diagnosticar cuelgues
				// 	select: {
				// 		id: true,
				// 		name: true,
				// 		color: true,
				// 	},
				// },
			},
			orderBy: {
				name: 'asc',
			},
		});

		logger.info(`✅ Encontradas ${images.length} imágenes en la carpeta ${folderId}`);

		if (images.length > 0) {
			// Mostrar información de la primera imagen para depuración
			const firstImage = images[0];
			logger.debug('📄 Primera imagen encontrada:', {
				id: firstImage.id,
				name: firstImage.name,
				path: firstImage.path,
				hasThumbnail: !!firstImage.thumbnailSize,
				size: firstImage.size,
				dimensions: `${firstImage.width}x${firstImage.height}`,
			});
		} else {
			logger.debug('📄 No se encontraron imágenes en la carpeta');
			return [];
		}

		// Transformar a FileItem
		const fileItems = images.map((image) => {
			// Construir las URL necesarias
			const thumbnailUrl = `/api/images/${image.id}/thumbnail`;
			const contentUrl = `/api/images/${image.id}/content`;

			// Obtener el nombre del archivo si no está disponible
			const name = image.name || path.basename(image.path || 'sin-nombre');

			// Crear el objeto FileItem con todas las propiedades necesarias
			const fileItem: FileItem = {
				id: image.id as EntityId,
				name,
				path: image.path || '',
				type: 'image' as FileType,
				mimeType: 'image/jpeg', // Valor por defecto
				processingStatus: 'completed' as FileProcessingStatus,
				size: image.size || 0,
				width: image.width || 0,
				height: image.height || 0,
				metadata: {} as JSONString<MediaMetadata>, // Objeto vacío ya que metadata está excluido
				thumbnail: thumbnailUrl,
				thumbnailSize: image.thumbnailSize || 0,
				thumbnailWidth: image.thumbnailWidth || 0,
				thumbnailHeight: image.thumbnailHeight || 0,
				createdAt: image.createdAt,
				updatedAt: image.updatedAt,
				tags: [], // Array vacío ya que tags está excluido
				imageUrl: contentUrl, // URL directa a la imagen
				// Propiedades adicionales para FileBrowserItem
				src: contentUrl, // Alias de imageUrl para compatibilidad con FileBrowser
				url: contentUrl, // Otro alias usado en algunos componentes
				alt: name, // Texto alternativo para la imagen
			};

			return fileItem;
		});

		// Verificar que todas las transformaciones fueron exitosas
		logger.info(`✅ Transformadas ${fileItems.length} imágenes a FileItem`);

		// Validar que cada FileItem tenga las propiedades necesarias para el FileBrowser
		const validItems = fileItems.filter(item => {
			const hasRequiredProps =
				!!item.id &&
				!!item.name &&
				!!item.thumbnail &&
				!!item.imageUrl &&
				!!item.src;

			if (!hasRequiredProps) {
				logger.warn(`⚠️ Imagen ${item.id} no tiene todas las propiedades requeridas:`, {
					id: !!item.id,
					name: !!item.name,
					thumbnail: !!item.thumbnail,
					imageUrl: !!item.imageUrl,
					src: !!item.src
				});
			}

			return hasRequiredProps;
		});

		logger.info(`✅ Validación completada: ${validItems.length}/${fileItems.length} imágenes válidas`);

		if (validItems.length > 0) {
			// Mostrar información del primer FileItem para depuración
			const firstItem = validItems[0];
			logger.debug('📄 Primer FileItem transformado:', {
				id: firstItem.id,
				name: firstItem.name,
				thumbnail: firstItem.thumbnail,
				imageUrl: firstItem.imageUrl,
				src: firstItem.src,
				propiedades: Object.keys(firstItem).join(', ')
			});
		} else if (fileItems.length > 0) {
			// Si hay items pero ninguno es válido, mostrar el primer item con problemas
			const problemItem = fileItems[0];
			logger.error('❌ Ningún item válido. Ejemplo de item con problemas:', {
				id: problemItem.id,
				name: problemItem.name,
				thumbnail: problemItem.thumbnail,
				imageUrl: problemItem.imageUrl,
				src: problemItem.src,
				propiedades: Object.keys(problemItem).join(', ')
			});
		}

		return validItems;
	} catch (error) {
		logger.error('❌ Error al obtener imágenes de la carpeta:', error);
		return [];
	}
}
