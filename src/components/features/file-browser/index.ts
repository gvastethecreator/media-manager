// ✅ MIGRADO: Exportaciones actualizadas para la nueva arquitectura V2

// Export main components - V2 (migrados)
export { FileBrowserV2 } from './file-browser-v2';

// Export legacy components (serán eliminados gradualmente)
export { GridItem } from './components/grid-item';
export { FileBrowser } from './file-browser'; // @deprecated - usar FileBrowserV2

// Export utility hooks and helpers
export { useFilteredData } from './hooks/use-filtered-data';

// Export renderer
export { ImageRenderer } from './image-renderer';

// Export types
export * from './types';

// Export views - V2 (migradas)
export { CardsViewV2 } from './views/cards-view-v2';
export { ListViewV2 } from './views/list-view-v2';
export { MasonryViewV2 } from './views/masonry-view-v2';
export { SimpleGridViewV2 } from './views/simple-grid-view-v2';

// Export legacy views (serán eliminadas gradualmente)
export { CardsView } from './views/cards-view'; // @deprecated - usar CardsViewV2
export { ListView } from './views/list-view'; // @deprecated - usar ListViewV2
export { MasonryView } from './views/masonry-view'; // @deprecated - usar MasonryViewV2
export { SimpleGridView } from './views/simple-grid-view'; // @deprecated - usar SimpleGridViewV2
export { VirtualizerWrapper } from './views/virtualizer-wrapper';

