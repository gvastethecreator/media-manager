/**
 * 🌈 Módulo de Capas
 *
 * Este módulo proporciona componentes y hooks para gestionar las capas
 * visuales de las tarjetas de entidad, permitiendo una configuración flexible
 * y extensible del sistema de capas.
 */

// Exportar componente principal
export { LayersPanel } from './layers-panel';

// Exportar hook personalizado
export { useLayersSystem } from './hooks/use-layers-system';

// Exportar tipos
export type { LayersSettingsPanelProps, LayerConfig, LayerSystemConfig } from './types';
