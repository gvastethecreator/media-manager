'use client';

import { logger } from '@/lib/logger';
import { toastService } from '@/lib/toast';
import { useAlbumsStore } from '@/store/entities/albums.store';
import { useCharactersStore } from '@/store/entities/characters.store';
import { useCollectionsStore } from '@/store/entities/collections.store';
import { useConceptStore } from '@/store/entities/concept.store';
import { useNoteStore } from '@/store/entities/note.store';
import { useTagsStore } from '@/store/entities/tags.store';
import { useObjectsStore } from '@/store/objects.store';
import { usePlacesStore } from '@/store/places.store';
import { usePromptStore } from '@/store/prompt.store';
import type { FileItem } from '@/types/file-item';
import type { ContextMenuAction } from '../context-menu/context-menu';

const actionLogger = logger.withContext('ContextActionHandler');

// Modificamos la firma para que el parámetro isMultiSelect sea opcional
type ToggleItemSelectionFunction = (item: FileItem, isMultiSelect?: boolean) => void;

export function handleContextAction(
	action: ContextMenuAction,
	item: FileItem,
	data?: Record<string, unknown>,
	onItemDoubleClick?: (item: FileItem) => void,
	toggleItemSelection?: ToggleItemSelectionFunction
): void {
	// Validar que el item tenga un ID válido
	if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
		console.error('Intento de ejecutar acción contextual en item con ID inválido:', item);
		toastService.system.error('Error: el elemento no tiene un identificador válido');
		return;
	}

	actionLogger.info(`⚡ Acción del menú contextual: ${action}`, {
		item: item.id,
		data,
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
			// Abrir ubicación del archivo en el explorador de archivos
			if (item.path) {
				window.electron?.openPath(item.path);
			}
			break;
		case 'download':
			actionLogger.info('⬇️ Descargando archivo', item.path);
			// Implementar descarga del archivo
			if (item.path) {
				window.electron?.downloadFile(item.path);
				toastService.system.success('Descarga iniciada');
			}
			break;
		case 'copy':
			actionLogger.info('📋 Copiando archivo al portapapeles', item.path);
			// Copiar al portapapeles
			if (item.path) {
				window.electron?.copyFileToClipboard(item.path);
				toastService.system.success('Imagen copiada al portapapeles');
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
					window.electron?.deleteFile(item.path);
					toastService.system.info('Archivo enviado a la papelera');
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
		case 'object-create':
			actionLogger.info('🆕 Creando nuevo objeto');
			// Mostrar diálogo para crear objeto
			window.dispatchEvent(
				new CustomEvent('open-create-object-dialog', {
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
			actionLogger.info('➕ Añadiendo imagen a colección', data);
			if (data?.id) {
				const collectionId = data.id as string;
				// Buscar la colección en el store para obtener el nombre
				const collection = useCollectionsStore.getState().collections.find((c) => c.id === collectionId);
				try {
					useCollectionsStore.getState().addImageToCollection(collectionId, item.id);
					toastService.collection.imageAdded(collection?.name);
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a colección:', error);
					toastService.system.error('Error al añadir imagen a la colección');
				}
			}
			break;
		case 'tag-add':
			actionLogger.info('➕ Añadiendo etiqueta a imagen', data);
			if (data?.id) {
				const tagId = data.id as string;
				const tag = useTagsStore.getState().tags.find((t) => t.id === tagId);
				try {
					useTagsStore.getState().addTagToImage(tagId, item.id);
					toastService.tag.imageAdded(tag?.name);
				} catch (error) {
					actionLogger.error('❌ Error al añadir etiqueta a imagen:', error);
					toastService.system.error('Error al añadir etiqueta a la imagen');
				}
			}
			break;
		case 'album-add':
			actionLogger.info('➕ Añadiendo imagen a álbum', data);
			if (data?.id) {
				const albumId = data.id as string;
				const album = useAlbumsStore.getState().albums.find((a) => a.id === albumId);
				try {
					useAlbumsStore.getState().addImageToAlbum(albumId, item.id);
					toastService.system.success(`Imagen añadida al álbum "${album?.name || ''}"`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a álbum:', error);
					toastService.system.error('Error al añadir imagen al álbum');
				}
			}
			break;
		case 'character-add':
			actionLogger.info('➕ Añadiendo imagen a personaje', data);
			if (data?.id) {
				const characterId = data.id as string;
				const character = useCharactersStore.getState().characters.find((c) => c.id === characterId);
				try {
					useCharactersStore.getState().addImageToCharacter(characterId, item.id);
					toastService.system.success(`Imagen añadida al personaje "${character?.name || ''}"`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a personaje:', error);
					toastService.system.error('Error al añadir imagen al personaje');
				}
			}
			break;
		case 'place-add':
			actionLogger.info('➕ Añadiendo imagen a lugar', data);
			if (data?.id) {
				const placeId = data.id as string;
				const place = usePlacesStore.getState().places.find((p) => p.id === placeId);
				try {
					usePlacesStore.getState().addImageToPlace(placeId, item.id);
					toastService.system.success(`Imagen añadida al lugar "${place?.name || ''}"`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a lugar:', error);
					toastService.system.error('Error al añadir imagen al lugar');
				}
			}
			break;
		case 'object-add':
			actionLogger.info('➕ Añadiendo imagen a objeto', data);
			if (data?.id) {
				const objectId = data.id as string;
				const objectEntity = useObjectsStore.getState().objects.find((o) => o.id === objectId);
				try {
					useObjectsStore.getState().addImageToObject(objectId, item.id);
					toastService.system.success(`Imagen añadida al objeto "${objectEntity?.name || ''}"`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir imagen a objeto:', error);
					toastService.system.error('Error al añadir imagen al objeto');
				}
			}
			break;
		case 'prompt-add':
			actionLogger.info('➕ Añadiendo prompt a imagen', data);
			if (data?.id) {
				const promptId = data.id as string;
				const prompt = usePromptStore.getState().prompts.find((p) => p.id === promptId);
				try {
					// Suponiendo que existe una función addPromptToImage en el store de prompts
					if (usePromptStore.getState().addPromptToImage) {
						usePromptStore.getState().addPromptToImage(promptId, item.id);
						toastService.system.success(`Prompt "${prompt?.name || ''}" añadido a la imagen`);
					}
				} catch (error) {
					actionLogger.error('❌ Error al añadir prompt a imagen:', error);
					toastService.system.error('Error al añadir prompt a la imagen');
				}
			}
			break;
		case 'note-add':
			actionLogger.info('➕ Añadiendo nota a imagen', data);
			if (data?.id) {
				const noteId = data.id as string;
				const note = useNoteStore.getState().notes.find((n) => n.id === noteId);
				try {
					useNoteStore.getState().addNoteToImage(noteId, item.id);
					toastService.system.success(`Nota "${note?.name || ''}" añadida a la imagen`);
				} catch (error) {
					actionLogger.error('❌ Error al añadir nota a imagen:', error);
					toastService.system.error('Error al añadir nota a la imagen');
				}
			}
			break;
		case 'concept-add':
			actionLogger.info('➕ Añadiendo concepto a imagen', data);
			if (data?.id) {
				const conceptId = data.id as string;
				const concept = useConceptStore.getState().concepts.find((c) => c.id === conceptId);
				try {
					useConceptStore.getState().addConceptToImage(conceptId, item.id);
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
