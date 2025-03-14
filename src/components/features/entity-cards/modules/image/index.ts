/**
 * 🖼️ Módulo de Imagen
 *
 * Este módulo proporciona componentes y hooks para configurar
 * y gestionar la apariencia y efectos de imágenes en las tarjetas de entidad.
 */

// Exportar componente principal
export { ImagePanel } from './image-panel';

// Exportar hook personalizado
export { useImageSettings } from './hooks/use-image-settings';

// Exportar tipos
export type { ImageOptions, ImagePanelProps } from './types';
export { DEFAULT_IMAGE_OPTIONS } from './types';

// Exportar componentes de sección
export { DesignSection, BasicEffectsSection, DepthEffectsSection, PerformanceSection } from './components/sections';
