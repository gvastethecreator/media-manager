// Importaciones de server actions para entidades
// TODO: addImageToAlbum no está implementada aún
// import { addImageToAlbum } from '@/app/actions/albums/album.actions';
// TODO: addImageToCollection no está implementada aún
// import { addImageToCollection } from '@/app/actions/collections/collection-images.actions';

import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import {
	moveFile as moveFileService,
	copyFile as copyFileService,
	getFileAsDataUrl
} from '@/services/file/file.service';
import { enhancedFileOperationsService } from '@/services/file/enhanced-file-operations.service';
import { enhancedDownloadService } from '@/services/download/download.service';
import { addImageToTag } from '@/services/tag/tag.service';
import type { FileItem } from '@/types/file-browser/file-item';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ContextMenuAction, MultiSelectionAction, EmptySpaceAction } from './types';

const actionLogger = clientLogger.withContext('ContextActionHandler');

// Simple clipboard manager for file operations
interface ClipboardData {
	items: FileItem[];
	operation: 'copy' | 'cut';
	timestamp: number;
}

class SimpleClipboardManager {
	private clipboardData: ClipboardData | null = null;

	copy(items: FileItem[]): void {
		this.clipboardData = {
			items,
			operation: 'copy',
			timestamp: Date.now(),
		};
		actionLogger.info('📋 Archivos copiados al portapapeles:', items.length);
	}

	cut(items: FileItem[]): void {
		this.clipboardData = {
			items,
			operation: 'cut',
			timestamp: Date.now(),
		};
		actionLogger.info('✂️ Archivos cortados al portapapeles:', items.length);
	}

	canPaste(): boolean {
		return this.clipboardData !== null && this.clipboardData.items.length > 0;
	}

	getClipboardData(): ClipboardData | null {
		return this.clipboardData;
	}

	clear(): void {
		this.clipboardData = null;
		actionLogger.info('🗑️ Portapapeles limpiado');
	}
}

const clipboardManager = new SimpleClipboardManager();

// Export clipboard manager for use by other components
export { clipboardManager };

// Modificamos la firma para que el parámetro isMultiSelect sea opcional
type ToggleItemSelectionFunction = (item: FileItem, isMultiSelect?: boolean) => void;

// Redireccionar acciones obsoletas a las nuevas
function _redirectLegacyAction(action: ContextMenuAction): {
	newAction: ContextMenuAction;
	newData?: Record<string, unknown>;
} {
	// Eliminar casos no válidos según el tipo ContextMenuAction
	return { newAction: action };
}

// Helper function to convert FileItem to AnyEntityWithStats
function convertFileItemToEntity(item: FileItem): AnyEntityWithStats {
	// Create basic stats object for compatibility with ImageStatistics
	const basicImageStats = {
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,
		tagCount: 0,
		albumCount: 0,
		collectionCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,
		aspectRatio: 1,
	};

	// Base entity properties
	const baseEntity = {
		id: item.id,
		name: item.name,
		description: null,
		createdAt: item.modifiedAt || new Date(),
		updatedAt: item.modifiedAt || new Date(),
		path: item.path,
		size: item.size,
		isFavorite: item.isFavorite || false,
		addedAt: new Date(),
	};

	// Type-specific properties
	if (item.isDirectory) {
		return {
			...baseEntity,
			entityType: 'folder' as const,
			emoji: '📁',
			color: '#6B7280',
			featuredImage: null,
			totalFiles: 0,
			totalFolders: 0,
			totalSize: item.size,
			isHidden: false,
			isPublic: true,
			parentId: null,
			depth: 0,
			stats: basicImageStats,
		} as any; // Cast to any to satisfy type constraints
	} else if (item.mimeType?.startsWith('video/')) {
		return {
			...baseEntity,
			entityType: 'video' as const,
			hash: '',
			mimeType: item.mimeType,
			width: item.metadata?.width || 0,
			height: item.metadata?.height || 0,
			duration: item.metadata?.duration || null,
			fps: null,
			bitrate: null,
			codec: null,
			metadata: null,
			thumbnail: null,
			thumbnailSize: null,
			thumbnailWidth: null,
			thumbnailHeight: null,
			thumbnailMimeType: null,
			thumbnailError: null,
			thumbnailErrorAt: null,
			thumbnailOptimizedAt: null,
			folderId: '',
			noteId: null,
			thumbnailUrl: item.thumbnailUrl || '',
			fullUrl: item.path,
			statistics: { isHidden: false, isPublic: true },
			isHidden: false,
			isPublic: true,
			stats: basicImageStats,
		} as any; // Cast to any to satisfy type constraints
	} else {
		// Default to image
		return {
			...baseEntity,
			entityType: 'image' as const,
			hash: '',
			mimeType: item.mimeType || 'image/jpeg',
			width: item.metadata?.width || 0,
			height: item.metadata?.height || 0,
			metadata: null,
			thumbnail: null,
			thumbnailSize: null,
			thumbnailWidth: null,
			thumbnailHeight: null,
			thumbnailMimeType: null,
			thumbnailError: null,
			thumbnailErrorAt: null,
			thumbnailOptimizedAt: null,
			folderId: '',
			noteId: null,
			thumbnailUrl: item.thumbnailUrl || '',
			fullUrl: item.path,
			stats: basicImageStats,
		} as any; // Cast to any to satisfy type constraints
	}
}

// Implementación del servicio de operaciones de archivos
const customFileOperationsService = {
	// Abre la ubicación del archivo en el explorador del sistema
	openPath: async (path: string) => {
		try {
			// En navegador web, podemos intentar abrir una ventana nueva
			// con la ruta en formato file:// (esto funciona en algunos navegadores)
			const folderPath = path.substring(0, path.lastIndexOf('/'));
			const folderUrl = `file://${folderPath}`;

			// Intentamos abrir la carpeta contenedora primero
			window.open(folderUrl, '_blank');
			actionLogger.info('✅ Abriendo ubicación del archivo:', folderUrl);
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	},

	// Descarga el archivo al dispositivo del usuario con funcionalidad mejorada
	downloadFile: async (path: string, options?: {
		format?: 'original' | 'zip' | 'pdf';
		quality?: 'original' | 'high' | 'medium' | 'low';
		showProgress?: boolean;
	}) => {
		try {
			const filename = path.split('/').pop() || 'download';

			// Create a FileItem-like object for the enhanced download service
			const fileItem = {
				id: path,
				name: filename,
				path: path
			};

			// Convert to proper entity
			const entity = convertFileItemToEntity(fileItem as FileItem);

			// Use enhanced download service
			const result = await enhancedDownloadService.downloadFile(entity, {
				format: options?.format || 'original',
				quality: options?.quality || 'original',
				showProgress: options?.showProgress !== false
			});

			if (result.success) {
				actionLogger.info('✅ Archivo descargado con servicio mejorado:', {
					path,
					filename: result.filename,
					size: result.size,
					duration: result.duration
				});
				return Promise.resolve();
			} else {
				throw new Error(result.error || 'Download failed');
			}
		} catch (error) {
			actionLogger.error('❌ Error al descargar archivo:', error);
			return Promise.reject(error);
		}
	},

	// Copia la imagen al portapapeles usando el servicio de archivos
	copyFileToClipboard: async (path: string) => {
		try {
			// Usar el servicio de archivos para obtener la imagen como data URL
			const { dataUrl } = await getFileAsDataUrl(path);

			// Convertir data URL a blob
			const response = await fetch(dataUrl);
			const blob = await response.blob();

			// Copiar al portapapeles del sistema
			await navigator.clipboard.write([
				new ClipboardItem({
					[blob.type]: blob,
				}),
			]);

			actionLogger.info('✅ Imagen copiada al portapapeles');
			toastService.success('Imagen copiada al portapapeles');
			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al copiar imagen al portapapeles:', error);
			toastService.error('No se pudo copiar la imagen al portapapeles');
			return Promise.reject(error);
		}
	},

	// Renombra un archivo - now with undo/redo support
	renameFile: async (oldPath: string, newName: string) => {
		try {
			actionLogger.info('✏️ Renombrando archivo con undo/redo:', { oldPath, newName });

			// Create a valid file entity for the rename operation
			const entity: AnyEntityWithStats = {
				id: oldPath,
				name: oldPath.split('/').pop() || '',
				description: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				entityType: 'image',
				stats: {
					viewCount: 0,
					downloadCount: 0,
					likeCount: 0,
					commentCount: 0,
					tagCount: 0,
					albumCount: 0,
					collectionCount: 0,
					characterCount: 0,
					placeCount: 0,
					worldItemCount: 0,
					conceptCount: 0,
					promptCount: 0,
					noteCount: 0,
					wildcardCount: 0,
					propertyCount: 0,
					groupCount: 0,
					aspectRatio: 1,
				},
				path: oldPath,
				hash: '',
				size: 0,
				width: 0,
				height: 0,
				metadata: null,
				thumbnail: null,
				thumbnailSize: null,
				thumbnailWidth: null,
				thumbnailHeight: null,
				thumbnailMimeType: null,
				thumbnailError: null,
				thumbnailErrorAt: null,
				thumbnailOptimizedAt: null,
				isFavorite: false,
				folderId: '',
				noteId: null,
				addedAt: new Date(),
				thumbnailUrl: '',
				fullUrl: '',
			} as AnyEntityWithStats;

			await enhancedFileOperationsService.renameItem(entity, newName);
			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al renombrar archivo:', error);
			toastService.error('Error al renombrar el archivo');
			return Promise.reject(error);
		}
	},

	// Mueve un archivo - fallback to original service for single file moves
	moveFile: async (sourcePath: string, destPath: string) => {
		try {
			await moveFileService(sourcePath, destPath);
			actionLogger.info('✅ Archivo movido:', { from: sourcePath, to: destPath });
			toastService.success('Archivo movido correctamente');
			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al mover archivo:', error);
			toastService.error('Error al mover el archivo');
			return Promise.reject(error);
		}
	},

	// Copia un archivo usando el servicio original
	copyFile: async (sourcePath: string, destPath: string) => {
		try {
			await copyFileService(sourcePath, destPath);
			actionLogger.info('✅ Archivo copiado:', { from: sourcePath, to: destPath });
			toastService.success('Archivo copiado correctamente');
			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al copiar archivo:', error);
			toastService.error('Error al copiar el archivo');
			return Promise.reject(error);
		}
	},

	// Pega archivos desde el portapapeles - with undo/redo support
	pasteFiles: async (targetPath: string) => {
		try {
			const clipboardData = clipboardManager.getClipboardData();
			if (!clipboardData) {
				toastService.error('No hay archivos en el portapapeles');
				return Promise.reject(new Error('No clipboard data'));
			}

			actionLogger.info('📋 Pegando archivos con undo/redo:', {
				count: clipboardData.items.length,
				operation: clipboardData.operation,
				target: targetPath
			});

			// Convert FileItems to entities
			const entities = clipboardData.items.map(convertFileItemToEntity);

			if (clipboardData.operation === 'copy') {
				await enhancedFileOperationsService.copyItems(entities, targetPath);
			} else {
				await enhancedFileOperationsService.moveItems(entities, targetPath);
				// Clear clipboard after move operation
				clipboardManager.clear();
			}

			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al pegar archivos:', error);
			toastService.error('Error al pegar los archivos');
			return Promise.reject(error);
		}
	},

	// Elimina un archivo - now with undo support
	deleteFile: async (path: string) => {
		try {
			actionLogger.info('🗑️ Eliminando archivo con undo:', path);

			// Create FileItem for the delete operation
			const fileItem: FileItem = {
				id: path,
				name: path.split('/').pop() || '',
				path: path,
				size: 0,
				mimeType: 'application/octet-stream',
				extension: '',
				modifiedAt: new Date(),
				isDirectory: false,
				type: 'file' as const,
			};

			// Convert to entity
			const entity = convertFileItemToEntity(fileItem);

			// Use enhanced service for undo support
			await enhancedFileOperationsService.deleteItems([entity]);
			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al eliminar archivo:', error);
			toastService.error('Error al eliminar el archivo');
			return Promise.reject(error);
		}
	},
};

// Main context action handler with enhanced operations
export const contextActionHandler = {
	// Función para obtener las acciones disponibles
	getActions: (item: FileItem, isMultiSelect: boolean) => {
		const actions: ContextMenuAction[] = [];

		if (isMultiSelect) {
			// Acciones para multi-selección - usar solo tipos válidos
			actions.push('download', 'delete', 'add-to-album', 'add-to-collection');
		} else {
			// Acciones para un solo elemento
			if (item.isDirectory) {
				actions.push('open', 'rename', 'delete', 'copy-path');
			} else {
				if (item.mimeType?.startsWith('image/')) {
					actions.push(
						'preview',
						'open',
						'download',
						'copy',
						'add-to-album',
						'add-to-collection',
						'add-tag',
						'rename',
						'delete',
						'copy-path'
					);
				} else if (item.mimeType?.startsWith('video/')) {
					actions.push(
						'preview',
						'open',
						'download',
						'add-to-album',
						'add-to-collection',
						'add-tag',
						'rename',
						'delete',
						'copy-path'
					);
				} else {
					actions.push('download', 'rename', 'delete', 'copy-path');
				}
			}
		}

		return actions;
	},

	// Ejecutor de acciones individuales
	executeAction: async (
		action: ContextMenuAction | MultiSelectionAction | EmptySpaceAction,
		item?: FileItem,
		items?: FileItem[],
		toggleSelection?: ToggleItemSelectionFunction,
		refreshView?: () => void
	) => {
		try {
			actionLogger.info('🎯 Ejecutando acción:', { action, itemCount: items?.length || (item ? 1 : 0) });

			switch (action) {
				// Acciones de navegación
				case 'open':
					if (item) {
						if (item.isDirectory) {
							window.open(`/browse${item.path}`, '_self');
						} else {
							window.open(`/view${item.path}`, '_blank');
						}
					}
					break;

				case 'preview':
					if (item) {
						window.open(`/view${item.path}`, '_blank');
					}
					break;

				// Acciones de descarga
				case 'download':
					if (item) {
						await customFileOperationsService.downloadFile(item.path);
					}
					break;

				// Acciones de portapapeles
				case 'copy':
					if (item && item.mimeType?.startsWith('image/')) {
						await customFileOperationsService.copyFileToClipboard(item.path);
					} else if (items && items.length > 0) {
						clipboardManager.copy(items);
						toastService.success(`${items.length} elemento(s) copiado(s)`);
					}
					break;

				case 'copy-path':
					if (item) {
						await navigator.clipboard.writeText(item.path);
						toastService.success('Ruta copiada al portapapeles');
					}
					break;

				case 'paste':
					if (item?.isDirectory) {
						await customFileOperationsService.pasteFiles(item.path);
						refreshView?.();
					}
					break;

				// Acciones de archivo
				case 'rename':
					if (item) {
						const newName = prompt('Nuevo nombre:', item.name);
						if (newName && newName !== item.name) {
							await customFileOperationsService.renameFile(item.path, newName);
							refreshView?.();
						}
					}
					break;

				case 'delete':
					if (item) {
						if (confirm(`¿Estás seguro de que quieres eliminar "${item.name}"?`)) {
							await customFileOperationsService.deleteFile(item.path);
							refreshView?.();
						}
					} else if (items && items.length > 0) {
						if (confirm(`¿Estás seguro de que quieres eliminar ${items.length} elemento(s)?`)) {
							const entities = items.map(convertFileItemToEntity);
							await enhancedFileOperationsService.deleteItems(entities);
							refreshView?.();
						}
					}
					break;

				// Acciones de organización
				case 'add-to-album':
					toastService.info('Funcionalidad de álbumes próximamente');
					break;

				case 'add-to-collection':
					toastService.info('Funcionalidad de colecciones próximamente');
					break;

				case 'add-tag':
					if (item) {
						const tags = prompt('Etiquetas (separadas por comas):');
						if (tags) {
							const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
							for (const tag of tagList) {
								await addImageToTag(item.path, tag);
							}
							toastService.success(`${tagList.length} etiqueta(s) agregada(s)`);
						}
					}
					break;

				// Otras acciones
				case 'move':
				case 'open-in-explorer':
				case 'favorite-toggle':
				case 'mark-toggle':
					toastService.info('Funcionalidad próximamente');
					break;

				default:
					actionLogger.warn('🤷 Acción no reconocida:', action);
					break;
			}
		} catch (error) {
			actionLogger.error('❌ Error ejecutando acción:', { action, error });
			toastService.error(`Error al ejecutar la acción: ${action}`);
		}
	},
};

// Export the main functions that other components expect
export const handleContextAction = contextActionHandler.executeAction;
export const handleEmptySpaceAction = contextActionHandler.executeAction;
export const handleMultiSelectionAction = contextActionHandler.executeAction;
