/**
 * 🎬 FILE VIEWER - EXPORTS CONSOLIDADOS
 *
 * Barrel file para facilitar importaciones
 */

// Componente principal
export { FileViewer } from './file-viewer';
// Tipos y constantes
export * from './file-viewer.types';
// Componentes
export { ThumbnailItem } from './thumbnail-item';
export { ThumbnailNavigation } from './thumbnail-navigation';
export { ToolbarActions } from './toolbar-actions';
// Hooks
export { useFocusManagement } from './use-focus-management';
export { useImageLoader } from './use-image-loader';
export { useKeyboardNavigation } from './use-keyboard-navigation';
export { useToolbarActions } from './use-toolbar-actions';
export { useZoomPan } from './use-zoom-pan';
