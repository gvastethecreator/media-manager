/**
 * Archivo de barril (barrel file) para las vistas de la aplicación
 *
 * Este archivo centraliza las exportaciones de las vistas principales
 * y sus componentes relacionados para facilitar su importación.
 */

// Exportar vista principal
export * from './view-container';

// Exportar tipos
export * from './types';

// Exportar vistas base
export * from './base';

// Exportar vistas de entidades
export * from './albums/album-content-view';
export * from './albums/albums-view';
export * from './characters/character-content-view';
export * from './characters/characters-view';
export * from './collections/collection-content-view';
export * from './collections/collections-view';
export * from './concepts/concept-content-view';
export * from './concepts/concepts-view';
export * from './notes/note-content-view';
export * from './notes/notes-view';
export * from './places/place-content-view';
export * from './places/places-view';
export * from './prompts/prompt-content-view';
export * from './prompts/prompts-view';
export * from './tags/tag-content-view';
export * from './tags/tags-view';
export * from './world-items/world-item-content-view';
export * from './world-items/world-items-view';

// Exportar vistas especiales
export * from './all-images/all-images-view';
export * from './development/development-view';
export * from './favorites/favorites-view';
export * from './search/search-view';
export * from './uploaded-images/uploaded-images-view';
