/**
 * @file Hook para agregar media a entidades
 * @module file-browser-new/hooks/use-add-to-entity
 *
 * Centraliza las mutaciones para agregar imágenes/videos a cualquier entidad
 */

import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAddImageToAlbum } from '@/lib/api/albums';
import { useAddImageToCollection } from '@/lib/api/collections';
import { useAddTags } from '@/lib/api/files';
import { useCreateFavorite } from '@/lib/api/favorites';
import { apiClient } from '@/lib/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientLogger } from '@/lib/logger/client-logger';

// Tipos de entidad soportados
export type EntityType =
	| 'album'
	| 'collection'
	| 'group'
	| 'tag'
	| 'world-item'
	| 'character'
	| 'concept'
	| 'note'
	| 'place'
	| 'prompt'
	| 'property'
	| 'wildcard'
	| 'favorite';

interface AddToEntityParams {
	entityType: EntityType;
	entityId: string;
	mediaIds: string[];
}

interface AddToEntityResult {
	success: boolean;
	added: number;
	failed: number;
	errors?: string[];
}

/**
 * Hook genérico para agregar imágenes a grupos
 */
function useAddImageToGroup() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { groupId: string; imageId: string }>({
		mutationFn: async ({ groupId, imageId }) => {
			await apiClient.post(`/groups/${groupId}/images/${imageId}`);
		},
		onSuccess: (_, { groupId }) => {
			queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId] });
			queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId, 'images'] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a world items
 */
function useAddImageToWorldItem() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { worldItemId: string; imageId: string }>({
		mutationFn: async ({ worldItemId, imageId }) => {
			await apiClient.post(`/world-items/${worldItemId}/images/${imageId}`);
		},
		onSuccess: (_, { worldItemId }) => {
			queryClient.invalidateQueries({ queryKey: ['world-items', 'detail', worldItemId] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a personajes
 */
function useAddImageToCharacter() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { characterId: string; imageId: string }>({
		mutationFn: async ({ characterId, imageId }) => {
			await apiClient.post(`/characters/${characterId}/images/${imageId}`);
		},
		onSuccess: (_, { characterId }) => {
			queryClient.invalidateQueries({ queryKey: ['characters', 'detail', characterId] });
			queryClient.invalidateQueries({ queryKey: ['characters', 'detail', characterId, 'images'] });
			queryClient.invalidateQueries({ queryKey: ['characters', 'detail', characterId, 'media'] });
			// Invalidar lista para actualizar thumbnails en tarjetas
			queryClient.invalidateQueries({ queryKey: ['characters', 'list'] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a conceptos
 */
function useAddImageToConcept() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { conceptId: string; imageId: string }>({
		mutationFn: async ({ conceptId, imageId }) => {
			await apiClient.post(`/concepts/${conceptId}/images/${imageId}`);
		},
		onSuccess: (_, { conceptId }) => {
			queryClient.invalidateQueries({ queryKey: ['concepts', 'detail', conceptId] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a notas
 */
function useAddImageToNote() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { noteId: string; imageId: string }>({
		mutationFn: async ({ noteId, imageId }) => {
			await apiClient.post(`/notes/${noteId}/images/${imageId}`);
		},
		onSuccess: (_, { noteId }) => {
			queryClient.invalidateQueries({ queryKey: ['notes', 'detail', noteId] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a lugares
 */
function useAddImageToPlace() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { placeId: string; imageId: string }>({
		mutationFn: async ({ placeId, imageId }) => {
			await apiClient.post(`/places/${placeId}/images/${imageId}`);
		},
		onSuccess: (_, { placeId }) => {
			queryClient.invalidateQueries({ queryKey: ['places', 'detail', placeId] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a prompts
 */
function useAddImageToPrompt() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { promptId: string; imageId: string }>({
		mutationFn: async ({ promptId, imageId }) => {
			await apiClient.post(`/prompts/${promptId}/images/${imageId}`);
		},
		onSuccess: (_, { promptId }) => {
			queryClient.invalidateQueries({ queryKey: ['prompts', 'detail', promptId] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a propiedades
 */
function useAddImageToProperty() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { propertyId: string; imageId: string }>({
		mutationFn: async ({ propertyId, imageId }) => {
			await apiClient.post(`/properties/${propertyId}/images/${imageId}`);
		},
		onSuccess: (_, { propertyId }) => {
			queryClient.invalidateQueries({ queryKey: ['properties', 'detail', propertyId] });
		},
	});
}

/**
 * Hook genérico para agregar imágenes a wildcards
 */
function useAddImageToWildcard() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, { wildcardId: string; imageId: string }>({
		mutationFn: async ({ wildcardId, imageId }) => {
			await apiClient.post(`/wildcards/${wildcardId}/images/${imageId}`);
		},
		onSuccess: (_, { wildcardId }) => {
			queryClient.invalidateQueries({ queryKey: ['wildcards', 'detail', wildcardId] });
		},
	});
}

/**
 * Hook centralizado para agregar media a cualquier entidad
 */
export function useAddToEntity() {
	const { toast } = useToast();

	// Mutations disponibles
	const addToAlbum = useAddImageToAlbum();
	const addToCollection = useAddImageToCollection();
	const addToGroup = useAddImageToGroup();
	const addTags = useAddTags();
	const addToWorldItem = useAddImageToWorldItem();
	const addToCharacter = useAddImageToCharacter();
	const addToConcept = useAddImageToConcept();
	const addToNote = useAddImageToNote();
	const addToPlace = useAddImageToPlace();
	const addToPrompt = useAddImageToPrompt();
	const addToProperty = useAddImageToProperty();
	const addToWildcard = useAddImageToWildcard();
	const createFavorite = useCreateFavorite();

	const addToEntity = useCallback(
		async (params: AddToEntityParams): Promise<AddToEntityResult> => {
			const { entityType, entityId, mediaIds } = params;
			const errors: string[] = [];
			let added = 0;
			let failed = 0;

			clientLogger.info(`[useAddToEntity] Adding ${mediaIds.length} items to ${entityType}:${entityId}`);

			for (const mediaId of mediaIds) {
				try {
					switch (entityType) {
						case 'album':
							await addToAlbum.mutateAsync({ albumId: entityId, imageId: mediaId });
							break;
						case 'collection':
							await addToCollection.mutateAsync({ collectionId: entityId, imageId: mediaId });
							break;
						case 'group':
							await addToGroup.mutateAsync({ groupId: entityId, imageId: mediaId });
							break;
						case 'tag':
							await addTags.mutateAsync({ fileId: mediaId, tags: [entityId] });
							break;
						case 'world-item':
							await addToWorldItem.mutateAsync({ worldItemId: entityId, imageId: mediaId });
							break;
						case 'character':
							await addToCharacter.mutateAsync({ characterId: entityId, imageId: mediaId });
							break;
						case 'concept':
							await addToConcept.mutateAsync({ conceptId: entityId, imageId: mediaId });
							break;
						case 'note':
							await addToNote.mutateAsync({ noteId: entityId, imageId: mediaId });
							break;
						case 'place':
							await addToPlace.mutateAsync({ placeId: entityId, imageId: mediaId });
							break;
						case 'prompt':
							await addToPrompt.mutateAsync({ promptId: entityId, imageId: mediaId });
							break;
						case 'property':
							await addToProperty.mutateAsync({ propertyId: entityId, imageId: mediaId });
							break;
						case 'wildcard':
							await addToWildcard.mutateAsync({ wildcardId: entityId, imageId: mediaId });
							break;
						case 'favorite':
							await createFavorite.mutateAsync({
								entityId: mediaId,
								entityType: 'image',
							});
							break;
						default:
							throw new Error(`Tipo de entidad no soportado: ${entityType}`);
					}
					added++;
				} catch (error: any) {
					failed++;
					const errorMsg = error?.message || 'Error desconocido';
					errors.push(`${mediaId}: ${errorMsg}`);
					clientLogger.error(`[useAddToEntity] Failed to add ${mediaId} to ${entityType}:${entityId}`, error);
				}
			}

			// Mostrar toast con resultado
			if (failed === 0) {
				clientLogger.info(`[useAddToEntity] Success toast: ${added} items added to ${entityType}`);
				toast({
					title: '✅ Agregado correctamente',
					description: `${added} elemento${added > 1 ? 's' : ''} agregado${added > 1 ? 's' : ''} a ${getEntityLabel(entityType)}`,
				});
			} else if (added > 0) {
				clientLogger.warn(`[useAddToEntity] Partial success toast: ${added} added, ${failed} failed`);
				toast({
					variant: 'default',
					title: '⚠️ Parcialmente agregado',
					description: `${added} agregado${added > 1 ? 's' : ''}, ${failed} con error`,
				});
			} else {
				clientLogger.error(`[useAddToEntity] Error toast: ${errors[0]}`);
				toast({
					variant: 'destructive',
					title: '❌ Error al agregar',
					description: errors[0] || 'No se pudo completar la operación',
				});
			}

			return { success: failed === 0, added, failed, errors: errors.length > 0 ? errors : undefined };
		},
		[
			addToAlbum,
			addToCollection,
			addToGroup,
			addTags,
			addToWorldItem,
			addToCharacter,
			addToConcept,
			addToNote,
			addToPlace,
			addToPrompt,
			addToProperty,
			addToWildcard,
			createFavorite,
			toast,
		]
	);

	return { addToEntity };
}

/**
 * Obtiene el label legible de un tipo de entidad
 */
function getEntityLabel(entityType: EntityType): string {
	const labels: Record<EntityType, string> = {
		album: 'álbum',
		collection: 'colección',
		group: 'grupo',
		tag: 'etiqueta',
		'world-item': 'elemento del mundo',
		character: 'personaje',
		concept: 'concepto',
		note: 'nota',
		place: 'lugar',
		prompt: 'prompt',
		property: 'propiedad',
		wildcard: 'wildcard',
		favorite: 'favoritos',
	};
	return labels[entityType] || entityType;
}

/**
 * Mapea una acción del menú contextual a un tipo de entidad
 */
export function actionToEntityType(action: string): EntityType | null {
	const mapping: Record<string, EntityType> = {
		'add-to-album': 'album',
		'add-to-collection': 'collection',
		'add-to-group': 'group',
		'add-to-tag': 'tag',
		'add-to-world-item': 'world-item',
		'add-to-characters': 'character',
		'add-to-concept': 'concept',
		'add-to-notes': 'note',
		'add-to-places': 'place',
		'add-to-prompts': 'prompt',
		'add-to-properties': 'property',
		'add-to-wildcards': 'wildcard',
		'add-to-favorites': 'favorite',
	};
	return mapping[action] || null;
}
