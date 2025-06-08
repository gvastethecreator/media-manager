/**
 * @file Transformador principal para la entidad Folder
 * @module transformers/folder/transformer
 */

import { Logger } from '@/lib/logger';
import type { Folder, FolderComplete, FolderExtended } from '@/types/entities/folder/types';
import { toFolderComplete } from './converters';
import { extendFolder } from './serializers';

const logger = new Logger('FolderTransformer');

/**
 * 📂 Transformador principal para la entidad Folder
 * Punto de entrada unificado para transformar objetos Folder a diferentes formatos
 *
 * @param folder Objeto Folder a transformar (puede ser de Prisma, parcial, etc)
 * @returns Objeto FolderComplete con todas las propiedades
 */
function transformFolderBase(folder: any): FolderComplete {
	try {
		// Validar entrada
		if (!folder || typeof folder !== 'object') {
			logger.warn('⚠️ Intentando transformar un objeto Folder inválido:', folder);
			throw new Error('Invalid folder object');
		}

		// Convertir a formato completo
		const folderComplete = toFolderComplete(folder);

		// Extender con propiedades adicionales
		return extendFolder(folderComplete);
	} catch (error) {
		logger.error('❌ Error transformando Folder:', error);
		// En caso de error, devolver el objeto original, pero asegurándonos
		// que tenga la estructura mínima esperada
		return {
			id: folder?.id || 'unknown',
			name: folder?.name || 'Unknown Folder',
			path: folder?.path || '/',
			description: folder?.description || '',
			parentId: folder?.parentId || null,
			createdAt: folder?.createdAt || new Date(),
			updatedAt: folder?.updatedAt || new Date(),
			children: folder?.children || [],
			parent: folder?.parent || null,
			_count: folder?._count || {
				children: 0,
				images: 0,
				uploadedImages: 0,
				tags: 0,
			},
			totalFiles: 0,
			totalSize: 0,
			metadata: folder?.metadata || {},
			color: folder?.color || '#3b82f6',
			emoji: folder?.emoji || '📁',
			stats: null,
		};
	}
}

/**
 * 🔄 Transforma un Folder a la versión extendida para UI
 *
 * @param folder Objeto Folder a transformar
 * @param isSelected Estado de selección (opcional)
 * @param isOpen Estado de apertura (opcional)
 * @returns Objeto FolderExtended con propiedades de UI
 */
function transformFolderToExtended(
	folder: Folder | FolderComplete,
	isSelected = false,
	isOpen = false
): FolderExtended {
	try {
		// Validación de entrada adicional
		if (!folder || typeof folder !== 'object') {
			logger.warn('⚠️ Intentando transformar un objeto Folder inválido a Extended:', folder);
			throw new Error('Invalid folder object');
		}

		// Asegurarse de que _count esté definido para evitar errores
		if (!folder._count) {
			folder._count = {
				children: 0,
				images: 0,
				videos: 0,
				uploadedImages: 0,
				tags: 0,
			};
		}

		// Log para depuración
		logger.debug('📂 Transformando folder a extendido:', {
			id: folder.id,
			name: folder.name,
			totalSize: folder.totalSize,
			_count: folder._count,
			stats: 'stats' in folder ? folder.stats : null,
		});

		// Primero asegurar que tenemos un FolderComplete
		const folderComplete = 'stats' in folder ? folder : transformFolderBase(folder);

		// Log después de transformación básica
		logger.debug('📂 Folder transformado a complete:', {
			id: folderComplete.id,
			totalSize: folderComplete.totalSize,
			stats: folderComplete.stats,
		});

		// Extender con propiedades de UI
		return {
			...folderComplete,
			isSelected,
			isOpen,
			isLoading: false,
			hasError: false,
			isDragging: false,
			isDropTarget: false,
			level: folderComplete.stats?.level || 0,
		};
	} catch (error) {
		logger.error('❌ Error transformando Folder a Extended:', error);
		// Devolver versión básica en caso de error
		return {
			...folder,
			isSelected,
			isOpen,
			isLoading: false,
			hasError: true, // Marcamos como error
			isDragging: false,
			isDropTarget: false,
			level: 0,
		} as FolderExtended;
	}
}

// Exportar las funciones principales con sus nombres finales
export { transformFolderBase, transformFolderToExtended };
