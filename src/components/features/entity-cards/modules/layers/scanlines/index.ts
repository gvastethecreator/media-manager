export * from './actions/scanlines-config.action';
export * from './components/scanlines-layer';
export * from './components/scanlines-settings';
export * from './hooks/use-scanlines';
import type { LayerImplementation } from '../types';

/**
 * 📺 Implementación de la capa de scanlines
 */
export const scanlinesImplementation: LayerImplementation = {
  type: 'scanlines',
  name: 'Líneas de escaneo',
  description: 'Añade un efecto de líneas de escaneo a la tarjeta',
  defaultConfig: {
    enabled: true,
    layerIndex: 3,
    lineWidth: 1,
    lineSpacing: 4,
    color: '#000000',
    opacity: 0.2,
    blendMode: 'multiply',
    angle: 0,
  },
  render: () => null, // Stub implementation
  settings: () => null, // Stub implementation
  icon: 'lineHorizontal',
};
