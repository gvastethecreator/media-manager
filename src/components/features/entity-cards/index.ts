/**
 * 🎴 Sistema de Entity Cards
 *
 * Este archivo proporciona un punto de entrada centralizado para todos los componentes,
 * hooks y utilidades relacionados con las tarjetas de entidades.
 */

// Componentes principales
export { EntityCard } from './entity-card';
export { EntityCardContent } from './entity-card-content';
export { EntityCardLayerWrapper } from './entity-card-layer-wrapper';
export { EntityCardWrapper } from './entity-card-wrapper';
export { EntityTypeIcon } from './entity-type-icon';
export { JsonEntityCard } from './json-entity-card';

// Sistema de tipos
export type { EntityCardOptions, EntityCardProps } from './entity-card';
export type { EntityCardWrapperProps } from './entity-card-wrapper';
export type { CardOptions } from './types/unified-card-types';

// Contextos y Providers
export { CardDisplayProvider, useCardDisplay } from './context/card-display-context';
export { CardControlProvider, useCardControl } from './debug/card-control-context';

// Adaptadores
export { EntityCardAdapter } from './adapters/entity-card-adapter';
export { SimpleCardAdapter } from './adapters/simple-card-adapter';
export { WorldItemAdapter } from './adapters/world-item-adapter';

// UI de depuración
export { CardDebugToolbar } from './debug/card-debug-toolbar';
export { RenderDebug } from './debug/render-debug';
export { UnifiedDebugMenu } from './ui/unified-debug-menu';

// Acciones del servidor
export {
    applyVisualPresetToEntity, deleteVisualPreset, getVisualPresets, getVisualPresetsByEntityType, saveVisualPreset
} from './actions/visual-presets.actions';

// Utilidades
export * from './utils/card-utils';

// Re-exportar tipos principales
export type { CardPreset } from './types/unified-card-types';

// Alias para entradas específicas por tipo para facilitar su uso
export { AlbumCardLayout as AlbumCard } from './modules/layout-system/layouts/album-card-layout';
export { CharacterCardLayout as CharacterCard } from './modules/layout-system/layouts/character-card-layout';
export { CollectionCardLayout as CollectionCard } from './modules/layout-system/layouts/collection-card-layout';
export { ConceptCardLayout as ConceptCard } from './modules/layout-system/layouts/concept-card-layout';
export { FolderCardLayout as FolderCard } from './modules/layout-system/layouts/folder-card-layout';
export { NoteCardLayout as NoteCard } from './modules/layout-system/layouts/note-card-layout';
export { PlaceCardLayout as PlaceCard } from './modules/layout-system/layouts/place-card-layout';
export { PromptCardLayout as PromptCard } from './modules/layout-system/layouts/prompt-card-layout';
export { TagsCardLayout as TagCard } from './modules/layout-system/layouts/tags-card-layout';
export { WorldItemCardLayout as WorldItemCard } from './modules/layout-system/layouts/world-item-card-layout';

// Mensaje informativo
if (process.env.NODE_ENV === 'development') {
  console.info('🔄 Sistema de tarjetas de entidad con soporte para múltiples modos de visualización');
}

/**
 * Exportaciones centralizadas para el sistema de tarjetas
 * Con adaptadores para garantizar la compatibilidad entre versiones de tipos
 */


// Re-exportar tipos públicos desde el index de tipos
export * from './types';

// Re-exportar hooks y utilidades
export { usePreset } from './hooks/use-preset';

// Re-exportar contextos de debug antiguos para compatibilidad (con nombres distintos)
export { useCardControl as useCardControlLegacy } from './debug/card-control-panel';
export { useCardDebug as useCardDebugLegacy } from './debug/card-debug-toolbar';

