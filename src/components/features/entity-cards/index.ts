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
    EntityCardWrapper,
    FolderCard, FolderCardLayout,
    NoteCard, NoteCardLayout,
    PlaceCard, PlaceCardLayout,
    PromptCard, PromptCardLayout,
    TagCard, TagCardLayout, VisualizationConfig, WorldItemCard, WorldItemCardLayout
} from './layouts/fixed-cards';

// Re-exportar tipos públicos desde el index de tipos
export * from './types';

// Re-exportar hooks y utilidades
export { usePreset } from './hooks/use-preset';
