// Importaciones de server actions para entidades
// TODO: addImageToAlbum no está implementada aún
// import { addImageToAlbum } from '@/app/actions/albums/album.actions';
// TODO: addImageToCollection no está implementada aún
// import { addImageToCollection } from '@/app/actions/collections/collection-images.actions';

import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import {
	deleteFile as deleteFileAction,
	renameFile as renameFileService,
	moveFile as moveFileService,
	copyFile as copyFileService,
	getFileAsDataUrl
} from '@/services/file/file.service';
import { enhancedFileOperationsService } from '@/services/file/enhanced-file-operations.service';
import { enhancedDownloadService } from '@/services/download/download.service';
import { addImageToTag } from '@/services/tag/tag.service';
import type { FileItem } from '@/types/files';
import type { AnyEntityWithStats } from '@/types/migration';
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

// Implementación del servicio de operaciones de archivos
const customFileOperationsService = {
	// Abre la ubicación del archivo en el explorador del sistema
	openPath: async (path: string) => {
		try {
			// En navegador web, podemos intentar abrir una ventana nueva
			// con la ruta en formato file:// (esto funciona en algunos navegadores)
			const _url = `file://${path}`;
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

			// Use enhanced download service
			const result = await enhancedDownloadService.downloadFile(fileItem, {
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
			// Create entity for enhanced service
			const entity: AnyEntityWithStats = {
				id: oldPath,
				name: oldPath.split('/').pop() || '',
				path: oldPath,
				size: 0,
				mimeType: 'application/octet-stream',
				extension: '',
				updatedAt: new Date(),
				createdAt: new Date(),
				isDirectory: false,
				type: 'file' as const,
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

	// Copia un archivo - fallback to original service for single file copies
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

	// Pega archivos desde el portapapeles
	pasteFiles: async (targetPath: string) => {
		try {
			const clipboardData = clipboardManager.getClipboardData();
			if (!clipboardData) {
				throw new Error('No hay archivos en el portapapeles');
			}

			const results = [];
			for (const item of clipboardData.items) {
				const sourcePath = 'path' in item ? (item as any).path : '';
				const fileName = item.name;
				const destPath = `${targetPath}/${fileName}`;

				if (clipboardData.operation === 'copy') {
					await customFileOperationsService.copyFile(sourcePath, destPath);
				} else if (clipboardData.operation === 'cut') {
					await customFileOperationsService.moveFile(sourcePath, destPath);
				}
				results.push(destPath);
			}

			// Si fue una operación de cortar, limpiar el portapapeles
			if (clipboardData.operation === 'cut') {
				clipboardManager.clear();
			}

			actionLogger.info('✅ Archivos pegados:', results.length);
			toastService.success(`${results.length} archivo(s) pegado(s) correctamente`);
			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al pegar archivos:', error);
			toastService.error('Error al pegar los archivos');
			return Promise.reject(error);
		}
	},

	// Elimina el archivo - now with undo/redo support
	deleteFile: async (path: string) => {
		try {
			actionLogger.info('🗑️ Eliminando archivo con undo/redo:', path);
			// Create entity for enhanced service
			const entity: AnyEntityWithStats = {
				id: path,
				name: path.split('/').pop() || '',
				path: path,
				size: 0,
				mimeType: 'application/octet-stream',
				extension: '',
				updatedAt: new Date(),
				createdAt: new Date(),
				isDirectory: false,
				type: 'file' as const,
			} as AnyEntityWithStats;
			
			await enhancedFileOperationsService.deleteItems([entity]);
			return Promise.resolve();
		} catch (error) {
			actionLogger.error('❌ Error al eliminar archivo:', error);
			toastService.error('Error al eliminar el archivo');
			return Promise.reject(error);
		}
	},
};

// Helper function to convert FileItem to AnyEntityWithStats
function convertFileItemToEntity(item: FileItem): AnyEntityWithStats {
	// Handle different entity types
	const baseEntity = {
		id: item.id,
		name: item.name,
		path: 'path' in item ? (item as any).path : '',
		size: 'size' in item ? (item as any).size : 0,
		mimeType: 'mimeType' in item ? (item as any).mimeType || 'application/octet-stream' : 'application/octet-stream',
		extension: 'extension' in item ? (item as any).extension || '' : '',
		updatedAt: 'modifiedAt' in item ? (item as any).modifiedAt || new Date() : new Date(),
		createdAt: 'createdAt' in item ? (item as any).createdAt || new Date() : new Date(),
		isDirectory: 'isDirectory' in item ? (item as any).isDirectory || false : false,
		type: 'file' as const,
	};
	
	return baseEntity as AnyEntityWithStats;
}

export const handleMultiSelectionAction = async (
	action: MultiSelectionAction,
	items: FileItem[],
	data?: Record<string, unknown>
): Promise<void> => {
	try {
		// Convert FileItems to AnyEntityWithStats for enhanced operations
		const entityItems = items.map(convertFileItemToEntity);

		switch (action) {
			case 'delete-multiple': {
				// Use enhanced service with undo/redo support
				await enhancedFileOperationsService.deleteItems(entityItems);
				actionLogger.info('✅ Múltiples archivos eliminados con undo/redo:', items.length);
				break;
			}

			case 'move-multiple': {
				// Mover múltiples archivos - por ahora mostrar prompt simple para destino
				const destPath = prompt('Ruta de destino para mover los archivos:');
				if (destPath) {
					// Use enhanced service with undo/redo support
					await enhancedFileOperationsService.moveItems(entityItems, destPath);
					actionLogger.info('✅ Múltiples archivos movidos con undo/redo:', items.length);
				}
				break;
			}

			case 'copy-multiple': {
				// Use enhanced clipboard manager
				enhancedFileOperationsService.copyToClipboard(entityItems);
				actionLogger.info('✅ Múltiples archivos copiados al portapapeles:', items.length);
				break;
			}

			case 'download-multiple': {
				// Descargar múltiples archivos usando el servicio mejorado
				const downloadItems = items.map(item => ({
					id: item.id,
					name: item.name,
					path: 'path' in item ? (item as any).path : ''
				}));

				// Use enhanced download service for batch download
				const result = await enhancedDownloadService.downloadMultipleFiles(downloadItems, {
					batchOptimization: items.length > 5, // Use ZIP for large batches
					showProgress: true,
					maxConcurrent: 3
				});

				if (result.success) {
					actionLogger.info('✅ Descarga múltiple completada:', {
						totalFiles: result.totalFiles,
						successful: result.successfulDownloads,
						failed: result.failedDownloads,
						totalSize: result.totalSize,
						duration: result.totalDuration
					});
				} else {
					actionLogger.error('❌ Error en descarga múltiple:', result);
				}
				break;
			}

			case 'add-to-collection': {
				if (data?.collectionId) {
					// TODO: Implementar cuando addImageToCollection esté disponible
					// const collectionId = data.collectionId as string;
					// const addPromises = items.map(item => addImageToCollection(item.id, collectionId));
					// await Promise.all(addPromises);
					toastService.info(`Función añadir ${items.length} elemento${items.length > 1 ? 's' : ''} a colección pendiente de implementación`);
				}
				break;
			}

			case 'add-to-album': {
				if (data?.albumId) {
					// TODO: Implementar cuando addImageToAlbum esté disponible
					// const albumId = data.albumId as string;
					// const addPromises = items.map(item => addImageToAlbum(item.id, albumId));
					// await Promise.all(addPromises);
					toastService.info(`Función añadir ${items.length} elemento${items.length > 1 ? 's' : ''} a álbum pendiente de implementación`);
				}
				break;
			}

			case 'add-tag': {
				if (data?.tagId) {
					// Añadir etiqueta a múltiples elementos
					const tagId = data.tagId as string;
					const addPromises = items.map(item => addImageToTag(tagId, item.id));
					await Promise.all(addPromises);
					actionLogger.info('✅ Etiqueta añadida a múltiples elementos:', items.length);
					toastService.success(`Etiqueta añadida a ${items.length} elemento${items.length > 1 ? 's' : ''}`);
				}
				break;
			}

			default:
				console.warn(`Acción de selección múltiple no implementada: ${action}`);
		}
	} catch (error) {
		actionLogger.error(`Error al ejecutar acción de selección múltiple ${action}:`, error);
		toastService.error(`Error al ejecutar la acción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
};

export const handleEmptySpaceAction = async (
	action: EmptySpaceAction,
	data?: Record<string, unknown>,
	context?: {
		currentPath?: string;
		totalItems?: number;
		selectAll?: (allIds: string[]) => void;
		refreshView?: () => void;
		allItemIds?: string[];
	}
): Promise<void> => {
	try {
		switch (action) {
			case 'select-all':
				if (context?.selectAll && context?.allItemIds) {
					context.selectAll(context.allItemIds);
					toastService.info(`${context.allItemIds.length} elementos seleccionados`);
				} else {
					toastService.warning('No hay elementos para seleccionar');
				}
				break;

			case 'paste':
				if (context?.currentPath) {
					// Use enhanced service with undo/redo support
					await enhancedFileOperationsService.pasteFromClipboard(context.currentPath);
				} else {
					toastService.warning('No se puede pegar: ruta no disponible');
				}
				break;

			case 'refresh':
				if (context?.refreshView) {
					context.refreshView();
					toastService.info('Vista actualizada');
				} else {
					// Fallback: recargar la página
					window.location.reload();
				}
				break;

			case 'new-folder':
				if (context?.currentPath) {
					const folderName = prompt('Nombre de la nueva carpeta:', 'Nueva carpeta');
					if (folderName) {
						// TODO: Implementar creación de carpeta cuando esté disponible el servicio
						toastService.info(`Crear carpeta "${folderName}" - Funcionalidad pendiente`);
					}
				} else {
					toastService.warning('No se puede crear carpeta: ruta no disponible');
				}
				break;

			case 'change-view':
				// Esta acción se maneja típicamente en el componente padre
				toastService.info('Cambiar vista - Usar toolbar de vista');
				break;

			case 'sort-by':
				// Esta acción se maneja típicamente en el componente padre
				toastService.info('Ordenar por - Usar toolbar de ordenación');
				break;

			case 'show-hidden':
				// Esta acción se maneja típicamente en el componente padre
				toastService.info('Mostrar archivos ocultos - Funcionalidad pendiente');
				break;

			case 'scan-folder':
				if (context?.currentPath) {
					toastService.info(`Escaneando carpeta: ${context.currentPath}`);
					// TODO: Implementar escaneo de carpeta cuando esté disponible
				} else {
					toastService.warning('No se puede escanear: ruta no disponible');
				}
				break;

			case 'properties':
				if (context?.currentPath) {
					toastService.info(`Propiedades de: ${context.currentPath}`);
					// TODO: Implementar propiedades de carpeta cuando esté disponible
				} else {
					toastService.warning('No se pueden mostrar propiedades: ruta no disponible');
				}
				break;

			default:
				console.warn(`Acción de espacio vacío no implementada: ${action}`);
		}
	} catch (error) {
		actionLogger.error(`Error al ejecutar acción de espacio vacío ${action}:`, error);
		toastService.error(`Error al ejecutar la acción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
};

export const handleContextAction = async (
	action: ContextMenuAction,
	item: FileItem,
	data?: Record<string, unknown>,
	handleItemDoubleClick?: (item: FileItem) => void,
	toggleSelectFile?: (id: string) => void
): Promise<void> => {
	try {
		switch (action) {
			case 'preview':
				if (handleItemDoubleClick) {
					handleItemDoubleClick(item);
				}
				break;

			case 'favorite-toggle':
				// Esta acción se maneja en el componente FileContextMenu
				break;

			case 'mark-toggle':
				if (toggleSelectFile) {
					toggleSelectFile(item.id);
				}
				break;

			case 'open': {
				// Abrir ubicación del archivo
				const itemPath = 'path' in item ? (item as any).path : '';
				await customFileOperationsService.openPath(itemPath);
				break;
			}

			case 'download': {
				// Descargar archivo usando el servicio mejorado
				const itemName = 'name' in item ? item.name : 'archivo';
				const downloadPath = 'path' in item ? (item as any).path : '';
				
				// Create download item for enhanced service
				const downloadItem = {
					id: item.id,
					name: itemName,
					path: downloadPath
				};
				
				// Use enhanced download service with progress tracking
				const result = await enhancedDownloadService.downloadFile(downloadItem, {
					format: 'original',
					showProgress: true
				});
				
				if (!result.success) {
					throw new Error(result.error || 'Download failed');
				}
				break;
			}

			case 'copy': {
				// Copiar al portapapeles del sistema (imagen)
				const copyPath = 'path' in item ? (item as any).path : '';
				await customFileOperationsService.copyFileToClipboard(copyPath);
				// También copiar al portapapeles interno para operaciones de archivo
				clipboardManager.copy([item]);
				break;
			}

			case 'copy-path': {
				// Copiar ruta
				const pathToCopy = 'path' in item ? (item as any).path : '';
				await navigator.clipboard
					.writeText(pathToCopy)
					.then(() => toastService.success('Ruta copiada al portapapeles'))
					.catch(() => toastService.error('No se pudo copiar la ruta'));
				break;
			}

			case 'paste': {
				// Pegar archivos
				const targetPath = 'path' in item ? (item as any).path : '';
				const targetDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
				await customFileOperationsService.pasteFiles(targetDir);
				break;
			}

			case 'rename': {
				// Renombrar archivo - por ahora mostrar prompt simple
				const currentName = 'name' in item ? item.name : 'archivo';
				const newName = prompt('Nuevo nombre:', currentName);
				if (newName && newName !== currentName) {
					const renamePath = 'path' in item ? (item as any).path : '';
					await customFileOperationsService.renameFile(renamePath, newName);
				}
				break;
			}

			case 'move': {
				// Mover archivo - por ahora mostrar prompt simple para destino
				const sourcePath = 'path' in item ? (item as any).path : '';
				const destPath = prompt('Ruta de destino:', sourcePath);
				if (destPath && destPath !== sourcePath) {
					await customFileOperationsService.moveFile(sourcePath, destPath);
				}
				break;
			}

			case 'open-in-explorer': {
				// Ver en explorador - usar la implementación existente mejorada
				const explorerPath = 'path' in item ? (item as any).path : '';
				await customFileOperationsService.openPath(explorerPath);
				break;
			}

			case 'delete': {
				// Eliminar archivo
				const deleteItemName = 'name' in item ? item.name : 'archivo';
				const deletePath = 'path' in item ? (item as any).path : '';

				// Confirmar eliminación
				const confirmed = confirm(`¿Estás seguro de que quieres eliminar "${deleteItemName}"?`);
				if (confirmed) {
					toastService.info(`Eliminando: ${deleteItemName}`);
					await customFileOperationsService.deleteFile(deletePath);
				}
				break;
			}

			case 'add-to-collection':
				if (data?.collectionId) {
					// TODO: Implementar cuando addImageToCollection esté disponible
					// const collectionId = data.collectionId as string;
					// await addImageToCollection(item.id, collectionId);
					toastService.info('Función añadir a colección pendiente de implementación');
				}
				break;

			case 'add-to-album':
				if (data?.albumId) {
					// TODO: Implementar cuando addImageToAlbum esté disponible
					// const albumId = data.albumId as string;
					// await addImageToAlbum(item.id, albumId);
					toastService.info('Función añadir a álbum pendiente de implementación');
				}
				break;

			case 'add-tag':
				if (data?.tagId) {
					// Añadir etiqueta
					const tagId = data.tagId as string;
					await addImageToTag(tagId, item.id);
					toastService.success('Etiqueta añadida a la imagen');
				}
				break;

			default:
				console.warn(`Acción no implementada: ${action}`);
		}
	} catch (error) {
		actionLogger.error(`Error al ejecutar acción ${action}:`, error);
		toastService.error(`Error al ejecutar la acción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
};
