'use client';

import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast.service';

// Importaciones de server actions para entidades
import { addImageToAlbum } from '@/app/actions/albums/album.actions';
import { addImageToCharacter } from '@/app/actions/characters/character.actions';
import { addImageToCollection } from '@/app/actions/collections/collection.actions';
import { addImageToConcept } from '@/app/actions/concepts/concept.actions';
import { addImageToNote } from '@/app/actions/notes/note.actions';
import { addImageToPlace } from '@/app/actions/places/place.actions';
import { addImageToPrompt } from '@/app/actions/prompts/prompt.actions';
import { addImageToTag } from '@/app/actions/tags';
import { addImageToWorldItem } from '@/app/actions/world-items/world-item.actions';

// Importaciones de stores en entidades
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useNoteStore } from '@/store/entities/note';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';

// Importaciones de actions de archivos
import { deleteFile as deleteFileAction } from '@/app/actions/files/file.actions';

import type { ContextMenuAction, ContextMenuActionData } from '@/types/context-menu-actions';
import type { FileItem } from '@/types/file-item';

const actionLogger = serverLogger.withContext('ContextActionHandler');

// Modificamos la firma para que el parámetro isMultiSelect sea opcional
type ToggleItemSelectionFunction = (item: FileItem, isMultiSelect?: boolean) => void;

// Redireccionar acciones obsoletas a las nuevas
function redirectLegacyAction(action: ContextMenuAction): {
	newAction: ContextMenuAction;
	newData?: ContextMenuActionData;
} {
	switch (action) {
		case 'object-create':
			actionLogger.info('⏩ Redirigiendo object-create a world-item-create');
			return { newAction: 'world-item-create' };
		case 'object-add':
			actionLogger.info('⏩ Redirigiendo object-add a world-item-add');
			return { newAction: 'world-item-add' };
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
			const url = `file://${path}`;
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
			const downloadUrl = `/api/files/download?path=${encodeURIComponent(path)}`;

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
			const imageUrl = `/api/files/view?path=${encodeURIComponent(path)}`;

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
								[blob.type]: blob
							})
						]);
						actionLogger.info('✅ Imagen copiada al portapapeles');
					} catch (error) {
						actionLogger.error('❌ Error al copiar imagen al portapapeles:', error);
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
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	},
};

export async function handleContextAction(
	originalAction: ContextMenuAction,
	item: FileItem,
	data?: ContextMenuActionData,
	onItemDoubleClick?: (item: FileItem) => void,
	toggleItemSelection?: ToggleItemSelectionFunction
): Promise<void> {
	// Redireccionar acciones legacy si es necesario
	const { newAction, newData } = redirectLegacyAction(originalAction);
	const action = newAction;
	const actionData = newData || data;

	// Validar que el item tenga un ID válido
	if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
		console.error('Intento de ejecutar acción contextual en item con ID inválido:', item);
		toastService.system.error('Error: el elemento no tiene un identificador válido');
		return;
	}

	actionLogger.info(`⚡ Acción del menú contextual: ${action}`, {
		item: item.id,
		data: actionData,
	});

	// Acciones que no son de asociación de entidades
	switch (action) {
		case 'preview':
			onItemDoubleClick?.(item);
			break;
		case 'mark-toggle':
			actionLogger.info('🚩 Toggling mark status');
			// Utilizar toggleItemSelection para marcar/desmarcar
			// Pasamos true como segundo parámetro para indicar que es una selección múltiple
			// esto permite mantener los elementos ya marcados
			toggleItemSelection?.(item, true);
			toastService.system.info('Estado de selección cambiado');
			break;
		case 'open':
			actionLogger.info('📂 Abriendo ubicación del archivo', item.path);
			// Abrir ubicación del archivo usando el servicio de operaciones de archivos
			if (item.path) {
				try {
					await customFileOperationsService.openPath(item.path);
				} catch (error: any) {
					actionLogger.error('❌ Error al abrir ubicación:', error);
					toastService.system.error('Error al abrir la ubicación del archivo');
				}
			}
			break;
		case 'download':
			actionLogger.info('⬇️ Descargando archivo', item.path);
			// Descargar archivo usando el servicio de operaciones de archivos
			if (item.path) {
				try {
					await customFileOperationsService.downloadFile(item.path);
				} catch (error: any) {
					actionLogger.error('❌ Error al descargar archivo:', error);
					toastService.system.error('Error al descargar el archivo');
				}
			}
			break;
		case 'copy':
			actionLogger.info('📋 Copiando archivo al portapapeles', item.path);
			// Copiar al portapapeles usando el servicio de operaciones de archivos
			if (item.path) {
				try {
					await customFileOperationsService.copyFileToClipboard(item.path);
				} catch (error: any) {
					actionLogger.error('❌ Error al copiar archivo al portapapeles:', error);
					toastService.system.error('Error al copiar la imagen al portapapeles');
				}
			}
			break;
		case 'copy-path':
			actionLogger.info('📋 Copiando ruta del archivo al portapapeles', item.path);
			// Copiar ruta al portapapeles
			if (item.path) {
				try {
					await navigator.clipboard.writeText(item.path);
					actionLogger.info('✅ Ruta copiada al portapapeles');
					toastService.system.success('Ruta copiada al portapapeles');
				} catch (error) {
					actionLogger.error('❌ Error al copiar ruta:', error);
					toastService.system.error('Error al copiar la ruta');
				}
			}
			break;
		case 'delete':
			actionLogger.info('🗑️ Eliminando archivo', item.path);
			// Implementar eliminación del archivo con confirmación
			if (item.path) {
				if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
					try {
						await customFileOperationsService.deleteFile(item.path);
						toastService.system.success('Archivo eliminado correctamente');
					} catch (error: any) {
						actionLogger.error('❌ Error al eliminar archivo:', error);
						toastService.system.error('Error al eliminar el archivo');
					}
				}
			}
			break;
		// Acciones de creación de entidades
		case 'collection-create':
			actionLogger.info('🆕 Creando nueva colección');
			// Mostrar diálogo para crear colección
			window.dispatchEvent(
				new CustomEvent('open-create-collection-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'tag-create':
			actionLogger.info('🆕 Creando nueva etiqueta');
			// Mostrar diálogo para crear etiqueta
			window.dispatchEvent(
				new CustomEvent('open-create-tag-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'album-create':
			actionLogger.info('🆕 Creando nuevo álbum');
			// Mostrar diálogo para crear álbum
			window.dispatchEvent(
				new CustomEvent('open-create-album-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'character-create':
			actionLogger.info('🆕 Creando nuevo personaje');
			// Mostrar diálogo para crear personaje
			window.dispatchEvent(
				new CustomEvent('open-create-character-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'place-create':
			actionLogger.info('🆕 Creando nuevo lugar');
			// Mostrar diálogo para crear lugar
			window.dispatchEvent(
				new CustomEvent('open-create-place-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'world-item-create':
			actionLogger.info('🆕 Creando nuevo objeto del mundo');
			// Mostrar diálogo para crear objeto del mundo
			window.dispatchEvent(
				new CustomEvent('open-create-world-item-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'prompt-create':
			actionLogger.info('🆕 Creando nuevo prompt');
			// Mostrar diálogo para crear prompt
			window.dispatchEvent(
				new CustomEvent('open-create-prompt-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'note-create':
			actionLogger.info('🆕 Creando nueva nota');
			// Mostrar diálogo para crear nota
			window.dispatchEvent(
				new CustomEvent('open-create-note-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		case 'concept-create':
			actionLogger.info('🆕 Creando nuevo concepto');
			// Mostrar diálogo para crear concepto
			window.dispatchEvent(
				new CustomEvent('open-create-concept-dialog', {
					detail: { imageId: item.id },
				})
			);
			break;
		// Acciones de asociación de entidades
		case 'collection-add':
			actionLogger.info('➕ Añadiendo imagen a colección', actionData);
			if (actionData?.id) {
				const collectionId = actionData.id as string;
				// Buscar la colección en el store para obtener el nombre
				const collection = useCollectionStore.getState().collections.find((c) => c.id === collectionId);
				try {
					// Usar server action para añadir la imagen a la colección
					await addImageToCollection(collectionId, item.id);
					toastService.collection.imageAdded(collection?.name);
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a colección:', error);
					toastService.system.error('Error al añadir imagen a la colección');
				}
			}
			break;
		case 'tag-add':
			actionLogger.info('➕ Añadiendo etiqueta a imagen', actionData);
			if (actionData?.id) {
				const tagId = actionData.id as string;
				const tag = useTagStore.getState().tags.find((t) => t.id === tagId);
				try {
					// Usar server action para añadir la etiqueta a la imagen
					await addImageToTag(tagId, item.id);
					toastService.tag.imageAdded(tag?.name);
				} catch (error) {
					actionLogger.error('❌ Error al añadir etiqueta a imagen:', error);
					toastService.system.error('Error al añadir etiqueta a la imagen');
				}
			}
			break;
		case 'album-add':
			actionLogger.info('➕ Añadiendo imagen a álbum', actionData);
			if (actionData?.id) {
				const albumId = actionData.id as string;
				try {
					// Usar server action para añadir la imagen al álbum
					await addImageToAlbum(albumId, item.id);
					toastService.system.success('Imagen añadida al álbum');
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a álbum:', error);
					toastService.system.error('Error al añadir imagen al álbum');
				}
			}
			break;
		case 'character-add':
			actionLogger.info('➕ Añadiendo imagen a personaje', actionData);
			if (actionData?.id) {
				const characterId = actionData.id as string;
				try {
					// Usar server action para añadir la imagen al personaje
					await addImageToCharacter(characterId, item.id);
					toastService.system.success('Imagen añadida al personaje');
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a personaje:', error);
					toastService.system.error('Error al añadir imagen al personaje');
				}
			}
			break;
		case 'place-add':
			actionLogger.info('➕ Añadiendo imagen a lugar', actionData);
			if (actionData?.id) {
				const placeId = actionData.id as string;
				try {
					// Usar server action para añadir la imagen al lugar
					await addImageToPlace(placeId, item.id);
					toastService.system.success('Imagen añadida al lugar');
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a lugar:', error);
					toastService.system.error('Error al añadir imagen al lugar');
				}
			}
			break;
		case 'world-item-add':
			actionLogger.info('➕ Añadiendo imagen a objeto del mundo', actionData);
			if (actionData?.id) {
				const worldItemId = actionData.id as string;
				try {
					// Usar server action para añadir la imagen al objeto
					await addImageToWorldItem(worldItemId, item.id);
					toastService.system.success('Imagen añadida al objeto');
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a objeto del mundo:', error);
					toastService.system.error('Error al añadir imagen al objeto del mundo');
				}
			}
			break;
		case 'prompt-add':
			actionLogger.info('➕ Añadiendo prompt a imagen', actionData);
			if (actionData?.id) {
				const promptId = actionData.id as string;
				const prompt = usePromptStore.getState().prompts.find((p) => p.id === promptId);
				try {
					// Usar server action para añadir la imagen al prompt
					await addImageToPrompt(promptId, item.id);
					toastService.system.success(`Prompt "${prompt?.name || ''}" añadido a la imagen`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir prompt a imagen:', error);
					toastService.system.error('Error al añadir prompt a la imagen');
				}
			}
			break;
		case 'note-add':
			actionLogger.info('➕ Añadiendo nota a imagen', actionData);
			if (actionData?.id) {
				const noteId = actionData.id as string;
				const note = useNoteStore.getState().notes.find((n) => n.id === noteId);
				try {
					// Usar server action para añadir la imagen a la nota
					await addImageToNote(noteId, item.id);
					toastService.system.success(`Nota "${note?.title || ''}" añadida a la imagen`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir nota a imagen:', error);
					toastService.system.error('Error al añadir nota a la imagen');
				}
			}
			break;
		case 'concept-add':
			actionLogger.info('➕ Añadiendo concepto a imagen', actionData);
			if (actionData?.id) {
				const conceptId = actionData.id as string;
				const concept = useConceptStore.getState().concepts.find((c) => c.id === conceptId);
				try {
					// Usar server action para añadir la imagen al concepto
					await addImageToConcept(conceptId, item.id);
					toastService.system.success(`Concepto "${concept?.name || ''}" añadido a la imagen`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir concepto a imagen:', error);
					toastService.system.error('Error al añadir concepto a la imagen');
				}
			}
			break;
		default:
			// No hay acción definida
			actionLogger.warn(`⚠️ Acción no implementada: ${action}`);
			break;
	}
}
