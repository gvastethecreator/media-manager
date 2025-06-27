'use server';

/**
 * @file Exportaciones asíncronas para funciones de gestión de etiquetas
 * @module app/actions/tags
 * @description
 * Este archivo agrupa y reexporta todas las server actions relacionadas con la entidad Tag.
 * Se utiliza un alias con el sufijo 'Action' para mantener la consistencia en el cliente.
 */

import * as CrudActions from './crud.actions';
import * as QueryActions from './query.actions';
import * as RelationActions from './relation.actions';

// === EXPORTACIONES DE CRUD ===

/** @see {@link CrudActions.createTag} */
export async function createTagAction(...args: Parameters<typeof CrudActions.createTag>) {
	return CrudActions.createTag(...args);
}

/** @see {@link CrudActions.updateTag} */
export async function updateTagAction(...args: Parameters<typeof CrudActions.updateTag>) {
	return CrudActions.updateTag(...args);
}

/** @see {@link CrudActions.deleteTag} */
export async function deleteTagAction(...args: Parameters<typeof CrudActions.deleteTag>) {
	return CrudActions.deleteTag(...args);
}

/** @see {@link CrudActions.getTag} */
export async function getTagAction(...args: Parameters<typeof CrudActions.getTag>) {
	return CrudActions.getTag(...args);
}

/** @see {@link CrudActions.getTags} */
export async function getTagsAction(...args: Parameters<typeof CrudActions.getTags>) {
	return CrudActions.getTags(...args);
}

// === EXPORTACIONES DE CONSULTAS ===

/** @see {@link QueryActions.searchTags} */
export async function searchTagsAction(...args: Parameters<typeof QueryActions.searchTags>) {
	return QueryActions.searchTags(...args);
}

/** @see {@link QueryActions.getPopularTags} */
export async function getPopularTagsAction(...args: Parameters<typeof QueryActions.getPopularTags>) {
	return QueryActions.getPopularTags(...args);
}

/** @see {@link QueryActions.getTagsByCategory} */
export async function getTagsByCategoryAction(...args: Parameters<typeof QueryActions.getTagsByCategory>) {
	return QueryActions.getTagsByCategory(...args);
}

/** @see {@link QueryActions.getTagImages} */
export async function getTagImagesAction(...args: Parameters<typeof QueryActions.getTagImages>) {
	return QueryActions.getTagImages(...args);
}

// === EXPORTACIONES DE RELACIONES ===

/** @see {@link RelationActions.assignTagToImages} */
export async function assignTagToImagesAction(...args: Parameters<typeof RelationActions.assignTagToImages>) {
	return RelationActions.assignTagToImages(...args);
}

/** @see {@link RelationActions.removeTagFromImages} */
export async function removeTagFromImagesAction(...args: Parameters<typeof RelationActions.removeTagFromImages>) {
	return RelationActions.removeTagFromImages(...args);
}

/** @see {@link RelationActions.getSuggestedTags} */
export async function getSuggestedTagsAction(...args: Parameters<typeof RelationActions.getSuggestedTags>) {
	return RelationActions.getSuggestedTags(...args);
}

/** @see {@link RelationActions.updateImageTags} */
export async function updateImageTagsAction(...args: Parameters<typeof RelationActions.updateImageTags>) {
	return RelationActions.updateImageTags(...args);
}

/** @see {@link RelationActions.addImageToTag} */
export async function addImageToTagAction(...args: Parameters<typeof RelationActions.addImageToTag>) {
	return RelationActions.addImageToTag(...args);
}
