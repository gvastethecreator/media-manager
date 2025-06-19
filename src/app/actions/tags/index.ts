'use server';

/**
 * @file Exportaciones asíncronas para funciones de gestión de etiquetas
 * @module app/actions/tags
 */

import * as CrudActions from './crud.actions';
import * as QueryActions from './query.actions';
import * as RelationActions from './relation.actions'; // Importar todas las acciones de relación
import * as TagImagesActions from './tag-images.actions'; // Importar acciones de tag-images

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'

// Exportaciones de crud.actions
export async function createTagAction(...args: Parameters<typeof CrudActions.createTag>) {
	return CrudActions.createTag(...args);
}
export async function updateTagAction(...args: Parameters<typeof CrudActions.updateTag>) {
	return CrudActions.updateTag(...args);
}
export async function deleteTagAction(...args: Parameters<typeof CrudActions.deleteTag>) {
	return CrudActions.deleteTag(...args);
}

// Exportaciones de query.actions
export async function getTagByIdAction(...args: Parameters<typeof QueryActions.getTag>) {
	return QueryActions.getTag(...args);
}
export async function getTagsAction(...args: Parameters<typeof QueryActions.getTags>) {
	return QueryActions.getTags(...args);
}
export async function searchTagsAction(...args: Parameters<typeof QueryActions.searchTags>) {
	return QueryActions.searchTags(...args);
}

// Exportaciones de relation.actions
export async function addImageToTag(...args: Parameters<typeof RelationActions.addImageToTag>) {
	return RelationActions.addImageToTag(...args);
}
export async function assignTagToImages(...args: Parameters<typeof RelationActions.assignTagToImages>) {
	return RelationActions.assignTagToImages(...args);
}
export async function getSuggestedTags(...args: Parameters<typeof RelationActions.getSuggestedTags>) {
	return RelationActions.getSuggestedTags(...args);
}
export async function removeTagFromImages(...args: Parameters<typeof RelationActions.removeTagFromImages>) {
	return RelationActions.removeTagFromImages(...args);
}
export async function updateImageTags(...args: Parameters<typeof RelationActions.updateImageTags>) {
	return RelationActions.updateImageTags(...args);
}

// Exportaciones de tag-images.actions
export async function getTagImages(...args: Parameters<typeof TagImagesActions.getTagImages>) {
	return TagImagesActions.getTagImages(...args);
}
export async function getImageTags(...args: Parameters<typeof TagImagesActions.getImageTags>) {
	return TagImagesActions.getImageTags(...args);
}
export async function addTagToImage(...args: Parameters<typeof TagImagesActions.addTagToImage>) {
	return TagImagesActions.addTagToImage(...args);
}
export async function removeTagFromImage(...args: Parameters<typeof TagImagesActions.removeTagFromImage>) {
	return TagImagesActions.removeTagFromImage(...args);
}

// NOTA: Los transformadores de tags ya no pueden exportarse desde este archivo debido a las
// restricciones de 'use server'. Use alguna de las siguientes opciones:
//
// 1. Importe directamente desde el transformador:
//    import { createTag, transformTag, ... } from '@/transformers/tag';
//
// 2. Importe desde el archivo cliente para mantener la organización:
//    import { createTag, transformTag, ... } from '@/app/actions/tags/client-tag-exports';
