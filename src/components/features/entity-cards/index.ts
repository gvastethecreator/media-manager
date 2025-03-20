/**
 * Exportaciones centralizadas para el sistema de tarjetas
 * Con adaptadores para garantizar la compatibilidad entre versiones de tipos
 */

// Re-exportar componentes principales con correcciones de tipo
export {
    AlbumCard, AlbumCardLayout,
    CharacterCard, CharacterCardLayout,
    CollectionCard, CollectionCardLayout,
    ConceptCard, ConceptCardLayout,
    FolderCard, FolderCardLayout,
    NoteCard, NoteCardLayout,
    PlaceCard, PlaceCardLayout,
    PromptCard, PromptCardLayout,
    TagsCard, TagsCardLayout,
    WorldItemCard, WorldItemCardLayout
} from './layouts/';

// Exportar el adaptador genérico de entidades
export { EntityCardAdapter } from './adapters/entity-card-adapter';

// Re-exportar tipos públicos desde el index de tipos
export * from './types';

// Re-exportar hooks y utilidades
export { usePreset } from './hooks/use-preset';

// Re-exportar contextos y barras de herramientas de depuración
export { CardDebugToolbar, useCardDebug } from './debug/card-debug-toolbar';

