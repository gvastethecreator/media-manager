'use client';

// Importaciones de server actions para entidades
import { addImageToAlbum } from '@/app/actions/albums/album.actions';
import { addImageToCollection } from '@/app/actions/collections/collection-images.actions';
import { addTagToImage } from '@/app/actions/tags/tag-images.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toast } from '@/services/toast.service';

// Importaciones de stores en entidades

// Importaciones de actions de archivos
import { deleteFile as deleteFileAction } from '@/app/actions/files/file.actions';

// Importar el tipo local en lugar del tipo global
import type { FileItem } from '@/types/files';
import type { ContextMenuAction } from './types';

const actionLogger = clientLogger.withContext('ContextActionHandler');

// Modificamos la firma para que el parámetro isMultiSelect sea opcional
type ToggleItemSelectionFunction = (item: FileItem, isMultiSelect?: boolean) => void;

// Redireccionar acciones obsoletas a las nuevas
function _redirectLegacyAction(action: ContextMenuAction): {
	newAction: ContextMenuAction;
	newData?: Record<string, unknown>;
} {
	switch (action) {
		case 'object-create':
			actionLogger.info('⏩ Redirigiendo object-create a world-item-create');
			return { newAction: 'world-item-create' as ContextMenuAction };
		case 'object-add':
			actionLogger.info('⏩ Redirigiendo object-add a world-item-add');
			return { newAction: 'world-item-add' as ContextMenuAction };
		default:
			return { newAction: action };
	}
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

	// Descarga el archivo al dispositivo del usuario
	downloadFile: async (path: string) => {
		try {
			// Crear un enlace temporal para descargar
			const filename = path.split('/').pop() || 'download';

			// Si es una ruta local, necesitamos convertirla a una URL descargable
			// Para esto, debemos tener un endpoint que permita acceder al archivo
			const downloadUrl = `/api/images/${filename}/content`;

			// Usar fetch para obtener el archivo como blob
			const response = await fetch(downloadUrl);
			const blob = await response.blob();
			const secureUrl = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = secureUrl;
			a.download = filename;
			a.rel = 'noopener noreferrer';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			// Liberar el objeto URL
			URL.revokeObjectURL(secureUrl);

			actionLogger.info('✅ Archivo descargado:', path);
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	},

	// Copia la imagen al portapapeles
	copyFileToClipboard: async (path: string) => {
		try {
			// Para copiar una imagen al portapapeles, primero necesitamos cargarla
			const imageUrl = `/api/images/${path.split('/').pop()}/content`;

			// Creamos un elemento de imagen temporal
			const img = new Image();
			img.crossOrigin = 'anonymous';

			// Esperamos a que la imagen cargue
			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = imageUrl;
			});

			// Creamos un canvas para dibujar la imagen
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('No se pudo crear contexto 2D');

			// Dibujamos la imagen en el canvas
			ctx.drawImage(img, 0, 0);

			// Copiamos la imagen al portapapeles
			canvas.toBlob(async (blob) => {
				if (blob) {
					try {
						// Usar la API moderna del portapapeles
						await navigator.clipboard.write([
							new ClipboardItem({
								[blob.type]: blob,
							}),
						]);
						actionLogger.info('✅ Imagen copiada al portapapeles');
						toast.success('Imagen copiada al portapapeles');
					} catch (error) {
						actionLogger.error('❌ Error al copiar imagen al portapapeles:', error);
						toast.error('No se pudo copiar la imagen al portapapeles');
						throw error;
					}
				}
			});

			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	},

	// Elimina el archivo
	deleteFile: async (path: string) => {
		try {
			// Usar la server action para eliminar el archivo
			await deleteFileAction(path);
			actionLogger.info('✅ Archivo eliminado:', path);
			toast.success('Archivo eliminado correctamente');
			return Promise.resolve();
		} catch (error) {
			toast.error('Error al eliminar el archivo');
			return Promise.reject(error);
		}
	},
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

			case 'open':
				// Abrir ubicación del archivo
				await customFileOperationsService.openPath(item.path);
				break;

			case 'download':
				// Descargar archivo
				toast.info(`Descargando: ${item.name}`);
				await customFileOperationsService.downloadFile(item.path);
				break;

			case 'copy':
				// Copiar al portapapeles
				await customFileOperationsService.copyFileToClipboard(item.path);
				break;

			case 'copy-path':
				// Copiar ruta
				await navigator.clipboard
					.writeText(item.path)
					.then(() => toast.success('Ruta copiada al portapapeles'))
					.catch(() => toast.error('No se pudo copiar la ruta'));
				break;

			case 'delete':
				// Eliminar archivo
				if (confirm(`¿Estás seguro de que quieres eliminar "${item.name}"?`)) {
					await customFileOperationsService.deleteFile(item.path);
				}
				break;

			case 'add-to-collection':
				if (data?.collectionId) {
					// Añadir a colección
					const collectionId = data.collectionId as string;
					await addImageToCollection(item.id, collectionId);
					toast.success('Imagen añadida a la colección');
				}
				break;

			case 'add-to-album':
				if (data?.albumId) {
					// Añadir a álbum
					const albumId = data.albumId as string;
					await addImageToAlbum(item.id, albumId);
					toast.success('Imagen añadida al álbum');
				}
				break;

			case 'add-tag':
				if (data?.tagId) {
					// Añadir etiqueta
					const tagId = data.tagId as string;
					await addTagToImage(item.id, tagId);
					toast.success('Etiqueta añadida a la imagen');
				}
				break;

			default:
				console.warn(`Acción no implementada: ${action}`);
		}
	} catch (error) {
		actionLogger.error(`Error al ejecutar acción ${action}:`, error);
		toast.error(`Error al ejecutar la acción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
};
