/**
 * Archivo de barril (barrel file) para las vistas de la aplicación
 *
 * Este archivo centraliza las exportaciones de las vistas principales
 * y sus componentes relacionados para facilitar su importación.
 */

// Exportar vistas de entidades
export * from './albums/album-content-view';
export * from './albums/albums-view';
export * from './all-images/all-images-view';
export * from './audio/audio-view';
export * from './base';
export * from './characters/character-content-view';
export * from './characters/characters-view';
export * from './collections/collection-content-view';
export * from './collections/collections-view';
export * from './concepts/concept-content-view';
export * from './concepts/concepts-view';
export * from './development/development-view';
export * from './documents/documents-view';
export * from './favorites/favorites-view';
export * from './file3d/file3d-view';
export * from './folders/views/folder-content-view';
export * from './folders/views/folders-view';
export * from './groups/group-content-view';
export * from './groups/groups-view';
export * from './json-files/json-files-view';
export * from './notes/note-content-view';
export * from './notes/notes-view';
export * from './places/place-content-view';
export * from './places/places-view';
export * from './prompts/prompt-content-view';
export * from './prompts/prompts-view';
export * from './properties/properties-view';
export * from './properties/property-content-view';
export * from './search/search-view';
export * from './tags/tag-content-view';
export * from './tags/tags-view';
export * from './types';
export * from './uploaded-images/uploaded-images-view';
export * from './view-container';
export * from './wildcards/wildcard-content-view';
export * from './wildcards/wildcards-view';
export * from './workflows/workflows-view';
export * from './world-items/world-item-content-view';
export * from './world-items/world-items-view';

// Exportaciones agrupadas según la nueva estructura file-centric
export { default as AllFilesView } from './all-files-view';
export { default as ImagesView } from './images-view';
export { default as VideosView } from './videos-view';
export { default as AudioView } from './audio-view';
export { default as DocumentsView } from './documents-view';
export { default as JsonFilesView } from './json-files-view';
export { default as WorkflowsView } from './workflows-view';
export { default as File3DView } from './file3d-view';

export { default as FavoritesView } from './favorites-view';
export { default as AlbumsView } from './albums-view';
export { default as GroupsView } from './groups-view';
export { default as TagsView } from './tags-view';
export { default as CollectionsView } from './collections-view';
export { default as PromptsView } from './prompts-view';

export { default as CharactersView } from './characters-view';
export { default as PlacesView } from './places-view';
export { default as WorldItemsView } from './world-items-view';
export { default as ConceptsView } from './concepts-view';
export { default as WildcardsView } from './wildcards-view';
