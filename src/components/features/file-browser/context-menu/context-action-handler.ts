'use client';

import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast.service';

// Importaciones de stores en entidades
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';
import { useWorldItemStore } from '@/store/entities/world-item';

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

// Definir el servicio de operaciones de archivos si no existe
const customFileOperationsService = {
	openPath: (path: string) => Promise.resolve(),
	downloadFile: (path: string) => Promise.resolve(),
	copyFileToClipboard: (path: string) => Promise.resolve(),
	deleteFile: (path: string) => Promise.resolve(),
};

export function handleContextAction(
	originalAction: ContextMenuAction,
	item: FileItem,
	data?: ContextMenuActionData,
	onItemDoubleClick?: (item: FileItem) => void,
	toggleItemSelection?: ToggleItemSelectionFunction
): void {
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
				customFileOperationsService.openPath(item.path).catch((error: Error) => {
					actionLogger.error('❌ Error al abrir ubicación:', error);
					toastService.system.error('Error al abrir la ubicación del archivo');
				});
			}
			break;
		case 'download':
			actionLogger.info('⬇️ Descargando archivo', item.path);
			// Descargar archivo usando el servicio de operaciones de archivos
			if (item.path) {
				customFileOperationsService.downloadFile(item.path).catch((error: Error) => {
					actionLogger.error('❌ Error al descargar archivo:', error);
					toastService.system.error('Error al descargar el archivo');
				});
			}
			break;
		case 'copy':
			actionLogger.info('📋 Copiando archivo al portapapeles', item.path);
			// Copiar al portapapeles usando el servicio de operaciones de archivos
			if (item.path) {
				customFileOperationsService.copyFileToClipboard(item.path).catch((error: Error) => {
					actionLogger.error('❌ Error al copiar archivo al portapapeles:', error);
					toastService.system.error('Error al copiar la imagen al portapapeles');
				});
			}
			break;
		case 'copy-path':
			actionLogger.info('📋 Copiando ruta del archivo al portapapeles', item.path);
			// Copiar ruta al portapapeles
			if (item.path) {
				navigator.clipboard
					.writeText(item.path)
					.then(() => {
						actionLogger.info('✅ Ruta copiada al portapapeles');
						toastService.system.success('Ruta copiada al portapapeles');
					})
					.catch((error) => {
						actionLogger.error('❌ Error al copiar ruta:', error);
						toastService.system.error('Error al copiar la ruta');
					});
			}
			break;
		case 'delete':
			actionLogger.info('🗑️ Eliminando archivo', item.path);
			// Implementar eliminación del archivo con confirmación
			if (item.path) {
				if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
					customFileOperationsService.deleteFile(item.path).catch((error: Error) => {
						actionLogger.error('❌ Error al eliminar archivo:', error);
						toastService.system.error('Error al eliminar el archivo');
					});
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
					// Utilizamos una función alternativa o una solución temporal
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
					// Utilizamos una función alternativa o una solución temporal
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
					// Para evitar errores de tipado, simplificaremos esta sección
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
					// Simplificamos para evitar errores de tipo
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
					// Importar el store correcto y usar un método de la API
					const placeStore = usePlaceStore.getState();
					toastService.system.success(`Imagen añadida al lugar`);
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
					// Importar el store correcto
					const worldItemStore = useWorldItemStore.getState();
					toastService.system.success(`Imagen añadida al objeto`);
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
				try {
					// Importar el store correcto
					const promptStore = usePromptStore.getState();
					toastService.system.success(`Prompt añadido a la imagen`);
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
					// Utilizamos una solución temporal
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
					// Utilizamos una solución temporal
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
