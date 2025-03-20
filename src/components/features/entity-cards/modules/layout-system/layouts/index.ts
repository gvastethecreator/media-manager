/**
 * Punto de entrada para los componentes refactorizados
 * Usa la nueva arquitectura basada en componentes base
 */

// Exportar componentes de layouts refactorizados
export { AlbumCard, AlbumCardLayout } from './album-card-layout';
export { CharacterCard, CharacterCardLayout } from './character-card-layout';
export { CollectionCard, CollectionCardLayout } from './collection-card-layout';
export { ConceptCard, ConceptCardLayout } from './concept-card-layout';
export { FolderCard, FolderCardLayout } from './folder-card-layout';
export { NoteCard, NoteCardLayout } from './note-card-layout';
export { PlaceCard, PlaceCardLayout } from './place-card-layout';
export { PromptCard, PromptCardLayout } from './prompt-card-layout';
export { TagsCard, TagsCardLayout } from './tags-card-layout';
export { WorldItemCard, WorldItemCardLayout } from './world-item-card-layout';

// Exportar tipos de los props para cada componente
export type { AlbumCardProps } from './album-card-layout';
export type { CharacterCardProps } from './character-card-layout';
export type { CollectionCardProps } from './collection-card-layout';
export type { ConceptCardProps } from './concept-card-layout';
export type { FolderCardProps } from './folder-card-layout';
export type { NoteCardProps } from './note-card-layout';
export type { PlaceCardProps } from './place-card-layout';
export type { PromptCardProps } from './prompt-card-layout';
export type { TagsCardProps } from './tags-card-layout';
export type { WorldItemCardProps } from './world-item-card-layout';

// Nota: En el futuro, podríamos añadir aquí más exports a medida que se refactoricen más componentes