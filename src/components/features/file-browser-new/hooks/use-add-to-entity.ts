/**
 * @file Hook para agregar media a entidades
 * @module file-browser-new/hooks/use-add-to-entity
 *
 * Centraliza las mutaciones para agregar archivos a entidades compatibles
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { useCreateFavorite } from '@/lib/api/favorites';
import { clientLogger } from '@/lib/logger/client-logger';
import { FavoriteEntityType } from '@/types/entities/favorite';
import type { BrowserItem } from '../types/item.types';

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
	entityId: string;
	entityType: EntityType;
	items: Array<Pick<BrowserItem, 'entityType' | 'id'>>;
}

interface AddToEntityResult {
	added: number;
	errors?: string[];
	failed: number;
	success: boolean;
}

const IMAGE_TARGET_ENDPOINTS: Record<Exclude<EntityType, 'album' | 'collection' | 'favorite' | 'tag'>, string> = {
	group: '/groups',
	'world-item': '/world-items',
	character: '/characters',
	concept: '/concepts',
	note: '/notes',
	place: '/places',
	prompt: '/prompts',
	property: '/properties',
	wildcard: '/wildcards',
};

function dedupeItems(items: AddToEntityParams['items']) {
	const seen = new Set<string>();
	return items.filter((item) => {
		const key = `${item.entityType}:${item.id}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function mapFavoriteEntityType(entityType: BrowserItem['entityType']): FavoriteEntityType {
	switch (entityType) {
		case 'folder':
			return FavoriteEntityType.FOLDER;
		case 'image':
			return FavoriteEntityType.IMAGE;
		case 'video':
			return FavoriteEntityType.VIDEO;
		case 'audio':
			return FavoriteEntityType.AUDIO;
		case 'document':
			return FavoriteEntityType.DOCUMENT;
		case 'jsonFile':
			return FavoriteEntityType.JSON_FILE;
		case 'file3d':
			return FavoriteEntityType.FILE_3D;
		default:
			throw new Error(`Tipo de entidad no soportado para favoritos: ${entityType}`);
	}
}

/**
 * Hook centralizado para agregar media a cualquier entidad
 */
export function useAddToEntity() {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const createFavorite = useCreateFavorite();

	const addToEntity = useCallback(
		async (params: AddToEntityParams): Promise<AddToEntityResult> => {
			const { entityType, entityId } = params;
			const items = dedupeItems(params.items);
			const errors: string[] = [];
			let added = 0;
			let failed = 0;

			clientLogger.info(`[useAddToEntity] Adding ${items.length} items to ${entityType}:${entityId}`);

			if (items.length === 0) {
				return { success: false, added: 0, failed: 0 };
			}

			const invalidateRelevantQueries = async () => {
				await Promise.allSettled([
					queryClient.invalidateQueries({ queryKey: ['favorites'] }),
					queryClient.invalidateQueries({ queryKey: ['albums'] }),
					queryClient.invalidateQueries({ queryKey: ['collections'] }),
					queryClient.invalidateQueries({ queryKey: ['groups'] }),
					queryClient.invalidateQueries({ queryKey: ['characters'] }),
					queryClient.invalidateQueries({ queryKey: ['concepts'] }),
					queryClient.invalidateQueries({ queryKey: ['notes'] }),
					queryClient.invalidateQueries({ queryKey: ['places'] }),
					queryClient.invalidateQueries({ queryKey: ['prompts'] }),
					queryClient.invalidateQueries({ queryKey: ['properties'] }),
					queryClient.invalidateQueries({ queryKey: ['wildcards'] }),
					queryClient.invalidateQueries({ queryKey: ['world-items'] }),
					queryClient.invalidateQueries({ queryKey: ['tags'] }),
				]);
			};

			const imageItems = items.filter((item) => item.entityType === 'image');
			const videoItems = items.filter((item) => item.entityType === 'video');

			if (entityType === 'album' || entityType === 'collection') {
				const imageIds = imageItems.map((item) => item.id);
				const unsupported = items.filter((item) => item.entityType !== 'image');

				if (imageIds.length > 0) {
					await apiClient.post(`/${entityType === 'album' ? 'albums' : 'collections'}/${entityId}/images`, {
						imageIds,
					});
					added += imageIds.length;
				}

				for (const item of unsupported) {
					failed++;
					errors.push(`${item.id}: ${item.entityType} no es compatible con ${getEntityLabel(entityType)}`);
				}

				await invalidateRelevantQueries();
			} else {
				for (const item of items) {
					try {
						switch (entityType) {
							case 'group':
							case 'world-item':
							case 'character':
							case 'concept':
							case 'note':
							case 'place':
							case 'prompt':
							case 'property':
							case 'wildcard': {
								if (item.entityType !== 'image') {
									throw new Error(`${item.entityType} no es compatible con ${getEntityLabel(entityType)}`);
								}

								await apiClient.post(`${IMAGE_TARGET_ENDPOINTS[entityType]}/${entityId}/images/${item.id}`);
								break;
							}
							case 'tag': {
								if (item.entityType === 'image') {
									await apiClient.post(`/images/${item.id}/tags`, { tagIds: [entityId] });
									break;
								}

								if (item.entityType === 'video') {
									await apiClient.post(`/videos/${item.id}/tags`, { tagIds: [entityId] });
									break;
								}

								throw new Error(`${item.entityType} no soporta etiquetas desde este menú`);
							}
							case 'favorite':
								await createFavorite.mutateAsync({
									entityId: item.id,
									entityType: mapFavoriteEntityType(item.entityType),
								});
								break;
							default:
								throw new Error(`Tipo de entidad no soportado: ${entityType}`);
						}

						added++;
					} catch (error: any) {
						failed++;
						const errorMsg = error?.message || 'Error desconocido';
						errors.push(`${item.id}: ${errorMsg}`);
						clientLogger.error(`[useAddToEntity] Failed to add ${item.id} to ${entityType}:${entityId}`, error);
					}
				}

				if (added > 0) {
					await invalidateRelevantQueries();
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
		[createFavorite, queryClient, toast]
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
